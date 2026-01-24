import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../config/database';
import { BackupConfig } from '../entities/BackupConfig';
import { BackupHistory } from '../entities/BackupHistory';
import { Customer } from '../entities/Customer';
import { Product } from '../entities/Product';
import { Sales } from '../entities/Sales';
import { SalesItem } from '../entities/SalesItem';
import { Purchase } from '../entities/Purchase';
import { PurchaseItem } from '../entities/PurchaseItem';
import { Payment } from '../entities/Payment';

class BackupSchedulerService {
  private scheduledJobs: Map<number, cron.ScheduledTask> = new Map();
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async initialize() {
    try {
      const configRepo = AppDataSource.getRepository(BackupConfig);
      const configs = await configRepo.find({ where: { enabled: true } });

      for (const config of configs) {
        await this.scheduleBackup(config);
      }

      console.log(`Backup scheduler initialized with ${configs.length} active schedules`);
    } catch (error) {
      console.error('Failed to initialize backup scheduler:', error);
    }
  }

  private getCronExpression(config: BackupConfig): string {
    const [hours, minutes] = config.scheduleTime.split(':').map(Number);

    switch (config.scheduleType) {
      case 'daily':
        return `${minutes} ${hours} * * *`;
      case 'weekly':
        const dayOfWeek = config.scheduleDay || 1; // Default to Monday
        return `${minutes} ${hours} * * ${dayOfWeek}`;
      case 'monthly':
        const dayOfMonth = config.scheduleDay || 1;
        return `${minutes} ${hours} ${dayOfMonth} * *`;
      default:
        return `${minutes} ${hours} * * *`;
    }
  }

  async scheduleBackup(config: BackupConfig) {
    // Cancel existing schedule for this business
    this.cancelSchedule(config.businessId);

    if (!config.enabled || config.scheduleType === 'manual') {
      return;
    }

    const cronExpression = this.getCronExpression(config);

    try {
      const job = cron.schedule(cronExpression, async () => {
        console.log(`Running scheduled backup for business ${config.businessId}`);
        await this.performBackup(config.businessId, 'scheduled');
      });

      this.scheduledJobs.set(config.businessId, job);
      console.log(`Scheduled backup for business ${config.businessId}: ${cronExpression}`);
    } catch (error) {
      console.error(`Failed to schedule backup for business ${config.businessId}:`, error);
    }
  }

  cancelSchedule(businessId: number) {
    const existingJob = this.scheduledJobs.get(businessId);
    if (existingJob) {
      existingJob.stop();
      this.scheduledJobs.delete(businessId);
    }
  }

  async performBackup(businessId: number, backupType: 'scheduled' | 'manual' = 'manual'): Promise<BackupHistory> {
    const historyRepo = AppDataSource.getRepository(BackupHistory);
    const configRepo = AppDataSource.getRepository(BackupConfig);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup_${businessId}_${timestamp}.json`;
    const filePath = path.join(this.backupDir, fileName);

    // Create history record
    const history = historyRepo.create({
      businessId,
      fileName,
      filePath,
      status: 'in_progress',
      backupType
    });
    await historyRepo.save(history);

    try {
      // Collect all data for the business
      const [customers, products, sales, purchases, payments] = await Promise.all([
        AppDataSource.getRepository(Customer).find({
          where: { businessId }
        }),
        AppDataSource.getRepository(Product).find({
          where: { businessId }
        }),
        AppDataSource.getRepository(Sales).find({
          where: { businessId },
          relations: ['items']
        }),
        AppDataSource.getRepository(Purchase).find({
          where: { businessId },
          relations: ['items']
        }),
        AppDataSource.getRepository(Payment).find({
          where: { businessId }
        })
      ]);

      const backupData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        businessId,
        data: {
          customers,
          products,
          sales,
          purchases,
          payments
        }
      };

      // Write to file
      const jsonData = JSON.stringify(backupData, null, 2);
      fs.writeFileSync(filePath, jsonData, 'utf8');

      const stats = fs.statSync(filePath);

      // Update history
      history.status = 'completed';
      history.fileSize = stats.size;
      history.customersCount = customers.length;
      history.productsCount = products.length;
      history.salesCount = sales.length;
      history.purchasesCount = purchases.length;
      history.paymentsCount = payments.length;
      history.completedAt = new Date();
      await historyRepo.save(history);

      // Update config
      const config = await configRepo.findOne({ where: { businessId } });
      if (config) {
        config.lastBackupAt = new Date();
        await configRepo.save(config);
      }

      // Clean up old backups
      await this.cleanupOldBackups(businessId);

      console.log(`Backup completed for business ${businessId}: ${fileName}`);
      return history;
    } catch (error: any) {
      history.status = 'failed';
      history.errorMessage = error.message;
      await historyRepo.save(history);

      console.error(`Backup failed for business ${businessId}:`, error);
      throw error;
    }
  }

  private async cleanupOldBackups(businessId: number) {
    const configRepo = AppDataSource.getRepository(BackupConfig);
    const historyRepo = AppDataSource.getRepository(BackupHistory);

    const config = await configRepo.findOne({ where: { businessId } });
    const retentionCount = config?.retentionCount || 7;

    const histories = await historyRepo.find({
      where: { businessId, status: 'completed' },
      order: { createdAt: 'DESC' }
    });

    if (histories.length > retentionCount) {
      const toDelete = histories.slice(retentionCount);
      for (const history of toDelete) {
        try {
          if (fs.existsSync(history.filePath)) {
            fs.unlinkSync(history.filePath);
          }
          await historyRepo.remove(history);
        } catch (error) {
          console.error(`Failed to delete old backup ${history.fileName}:`, error);
        }
      }
    }
  }

  async restoreBackup(businessId: number, historyId: number): Promise<{
    customers: number;
    products: number;
    sales: number;
    purchases: number;
    payments: number;
  }> {
    const historyRepo = AppDataSource.getRepository(BackupHistory);
    const history = await historyRepo.findOne({
      where: { id: historyId, businessId }
    });

    if (!history) {
      throw new Error('Backup not found');
    }

    if (!fs.existsSync(history.filePath)) {
      throw new Error('Backup file not found');
    }

    const backupData = JSON.parse(fs.readFileSync(history.filePath, 'utf8'));

    // Start transaction for restore
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete existing data
      await queryRunner.manager.delete(Payment, { businessId });
      await queryRunner.manager.delete(SalesItem, { sales: { businessId } });
      await queryRunner.manager.delete(Sales, { businessId });
      await queryRunner.manager.delete(PurchaseItem, { purchase: { businessId } });
      await queryRunner.manager.delete(Purchase, { businessId });
      await queryRunner.manager.delete(Product, { businessId });
      await queryRunner.manager.delete(Customer, { businessId });

      // Restore data
      const { customers, products, sales, purchases, payments } = backupData.data;

      // Restore customers
      for (const customer of customers) {
        const { id, ...customerData } = customer;
        await queryRunner.manager.save(Customer, { ...customerData, businessId });
      }

      // Restore products
      for (const product of products) {
        const { id, ...productData } = product;
        await queryRunner.manager.save(Product, { ...productData, businessId });
      }

      // Restore sales with items
      for (const sale of sales) {
        const { id, items, ...saleData } = sale;
        const savedSale = await queryRunner.manager.save(Sales, { ...saleData, businessId });
        if (items && items.length > 0) {
          for (const item of items) {
            const { id: itemId, salesId, ...itemData } = item;
            await queryRunner.manager.save(SalesItem, { ...itemData, salesId: savedSale.id });
          }
        }
      }

      // Restore purchases with items
      for (const purchase of purchases) {
        const { id, items, ...purchaseData } = purchase;
        const savedPurchase = await queryRunner.manager.save(Purchase, { ...purchaseData, businessId });
        if (items && items.length > 0) {
          for (const item of items) {
            const { id: itemId, purchaseId, ...itemData } = item;
            await queryRunner.manager.save(PurchaseItem, { ...itemData, purchaseId: savedPurchase.id });
          }
        }
      }

      // Restore payments
      for (const payment of payments) {
        const { id, ...paymentData } = payment;
        await queryRunner.manager.save(Payment, { ...paymentData, businessId });
      }

      await queryRunner.commitTransaction();

      return {
        customers: customers.length,
        products: products.length,
        sales: sales.length,
        purchases: purchases.length,
        payments: payments.length
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  getBackupFilePath(history: BackupHistory): string | null {
    if (fs.existsSync(history.filePath)) {
      return history.filePath;
    }
    return null;
  }
}

export const backupSchedulerService = new BackupSchedulerService();
export default backupSchedulerService;
