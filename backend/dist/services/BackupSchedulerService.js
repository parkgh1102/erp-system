"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupSchedulerService = void 0;
const cron = __importStar(require("node-cron"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const database_1 = require("../config/database");
const BackupConfig_1 = require("../entities/BackupConfig");
const BackupHistory_1 = require("../entities/BackupHistory");
const Customer_1 = require("../entities/Customer");
const Product_1 = require("../entities/Product");
const Sales_1 = require("../entities/Sales");
const SalesItem_1 = require("../entities/SalesItem");
const Purchase_1 = require("../entities/Purchase");
const PurchaseItem_1 = require("../entities/PurchaseItem");
const Payment_1 = require("../entities/Payment");
class BackupSchedulerService {
    constructor() {
        this.scheduledJobs = new Map();
        this.isInitialized = false;
        // Azure App Service uses /home for persistent storage
        const baseDir = process.env.HOME || process.env.APPDATA || __dirname;
        this.backupDir = process.env.BACKUP_DIR || path.join(baseDir, 'backups');
    }
    ensureBackupDirectory() {
        try {
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
            }
            this.isInitialized = true;
            console.log(`Backup directory ready: ${this.backupDir}`);
        }
        catch (error) {
            console.error('Failed to create backup directory:', error);
            // Fallback to temp directory
            this.backupDir = path.join(process.env.TEMP || '/tmp', 'erp-backups');
            try {
                if (!fs.existsSync(this.backupDir)) {
                    fs.mkdirSync(this.backupDir, { recursive: true });
                }
                this.isInitialized = true;
                console.log(`Using fallback backup directory: ${this.backupDir}`);
            }
            catch (fallbackError) {
                console.error('Failed to create fallback backup directory:', fallbackError);
            }
        }
    }
    async initialize() {
        try {
            // Ensure backup directory exists
            this.ensureBackupDirectory();
            const configRepo = database_1.AppDataSource.getRepository(BackupConfig_1.BackupConfig);
            const configs = await configRepo.find({ where: { enabled: true } });
            for (const config of configs) {
                await this.scheduleBackup(config);
            }
            console.log(`Backup scheduler initialized with ${configs.length} active schedules`);
        }
        catch (error) {
            console.error('Failed to initialize backup scheduler:', error);
            // Don't throw - let the app continue without backup scheduling
        }
    }
    getCronExpression(config) {
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
    async scheduleBackup(config) {
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
        }
        catch (error) {
            console.error(`Failed to schedule backup for business ${config.businessId}:`, error);
        }
    }
    cancelSchedule(businessId) {
        const existingJob = this.scheduledJobs.get(businessId);
        if (existingJob) {
            existingJob.stop();
            this.scheduledJobs.delete(businessId);
        }
    }
    async performBackup(businessId, backupType = 'manual') {
        // Ensure backup directory exists before backup
        if (!this.isInitialized) {
            this.ensureBackupDirectory();
        }
        const historyRepo = database_1.AppDataSource.getRepository(BackupHistory_1.BackupHistory);
        const configRepo = database_1.AppDataSource.getRepository(BackupConfig_1.BackupConfig);
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
                database_1.AppDataSource.getRepository(Customer_1.Customer).find({
                    where: { businessId }
                }),
                database_1.AppDataSource.getRepository(Product_1.Product).find({
                    where: { businessId }
                }),
                database_1.AppDataSource.getRepository(Sales_1.Sales).find({
                    where: { businessId },
                    relations: ['items']
                }),
                database_1.AppDataSource.getRepository(Purchase_1.Purchase).find({
                    where: { businessId },
                    relations: ['items']
                }),
                database_1.AppDataSource.getRepository(Payment_1.Payment).find({
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
        }
        catch (error) {
            history.status = 'failed';
            history.errorMessage = error.message;
            await historyRepo.save(history);
            console.error(`Backup failed for business ${businessId}:`, error);
            throw error;
        }
    }
    async cleanupOldBackups(businessId) {
        const configRepo = database_1.AppDataSource.getRepository(BackupConfig_1.BackupConfig);
        const historyRepo = database_1.AppDataSource.getRepository(BackupHistory_1.BackupHistory);
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
                }
                catch (error) {
                    console.error(`Failed to delete old backup ${history.fileName}:`, error);
                }
            }
        }
    }
    async restoreBackup(businessId, historyId) {
        const historyRepo = database_1.AppDataSource.getRepository(BackupHistory_1.BackupHistory);
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
        const queryRunner = database_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // Delete existing data
            await queryRunner.manager.delete(Payment_1.Payment, { businessId });
            await queryRunner.manager.delete(SalesItem_1.SalesItem, { sales: { businessId } });
            await queryRunner.manager.delete(Sales_1.Sales, { businessId });
            await queryRunner.manager.delete(PurchaseItem_1.PurchaseItem, { purchase: { businessId } });
            await queryRunner.manager.delete(Purchase_1.Purchase, { businessId });
            await queryRunner.manager.delete(Product_1.Product, { businessId });
            await queryRunner.manager.delete(Customer_1.Customer, { businessId });
            // Restore data
            const { customers, products, sales, purchases, payments } = backupData.data;
            // Restore customers
            for (const customer of customers) {
                const { id, ...customerData } = customer;
                await queryRunner.manager.save(Customer_1.Customer, { ...customerData, businessId });
            }
            // Restore products
            for (const product of products) {
                const { id, ...productData } = product;
                await queryRunner.manager.save(Product_1.Product, { ...productData, businessId });
            }
            // Restore sales with items
            for (const sale of sales) {
                const { id, items, ...saleData } = sale;
                const savedSale = await queryRunner.manager.save(Sales_1.Sales, { ...saleData, businessId });
                if (items && items.length > 0) {
                    for (const item of items) {
                        const { id: itemId, salesId, ...itemData } = item;
                        await queryRunner.manager.save(SalesItem_1.SalesItem, { ...itemData, salesId: savedSale.id });
                    }
                }
            }
            // Restore purchases with items
            for (const purchase of purchases) {
                const { id, items, ...purchaseData } = purchase;
                const savedPurchase = await queryRunner.manager.save(Purchase_1.Purchase, { ...purchaseData, businessId });
                if (items && items.length > 0) {
                    for (const item of items) {
                        const { id: itemId, purchaseId, ...itemData } = item;
                        await queryRunner.manager.save(PurchaseItem_1.PurchaseItem, { ...itemData, purchaseId: savedPurchase.id });
                    }
                }
            }
            // Restore payments
            for (const payment of payments) {
                const { id, ...paymentData } = payment;
                await queryRunner.manager.save(Payment_1.Payment, { ...paymentData, businessId });
            }
            await queryRunner.commitTransaction();
            return {
                customers: customers.length,
                products: products.length,
                sales: sales.length,
                purchases: purchases.length,
                payments: payments.length
            };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    getBackupFilePath(history) {
        if (fs.existsSync(history.filePath)) {
            return history.filePath;
        }
        return null;
    }
}
exports.backupSchedulerService = new BackupSchedulerService();
exports.default = exports.backupSchedulerService;
//# sourceMappingURL=BackupSchedulerService.js.map