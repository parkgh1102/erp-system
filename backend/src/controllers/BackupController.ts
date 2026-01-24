import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { BackupConfig, BackupScheduleType } from '../entities/BackupConfig';
import { BackupHistory } from '../entities/BackupHistory';
import { backupSchedulerService } from '../services/BackupSchedulerService';
import * as fs from 'fs';
import * as path from 'path';

export class BackupController {
  // Get backup config for a business
  static async getConfig(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);
      const configRepo = AppDataSource.getRepository(BackupConfig);

      let config = await configRepo.findOne({ where: { businessId } });

      // Create default config if not exists
      if (!config) {
        config = configRepo.create({
          businessId,
          enabled: false,
          scheduleType: 'daily',
          scheduleTime: '03:00',
          retentionCount: 7
        });
        await configRepo.save(config);
      }

      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('Error getting backup config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update backup config
  static async updateConfig(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);
      const { enabled, scheduleType, scheduleTime, scheduleDay, retentionCount } = req.body;

      const configRepo = AppDataSource.getRepository(BackupConfig);
      let config = await configRepo.findOne({ where: { businessId } });

      if (!config) {
        config = configRepo.create({ businessId });
      }

      if (typeof enabled === 'boolean') config.enabled = enabled;
      if (scheduleType) config.scheduleType = scheduleType as BackupScheduleType;
      if (scheduleTime) config.scheduleTime = scheduleTime;
      if (scheduleDay !== undefined) config.scheduleDay = scheduleDay;
      if (retentionCount) config.retentionCount = retentionCount;

      await configRepo.save(config);

      // Update scheduler
      await backupSchedulerService.scheduleBackup(config);

      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('Error updating backup config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get backup history
  static async getHistory(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const historyRepo = AppDataSource.getRepository(BackupHistory);

      const [histories, total] = await historyRepo.findAndCount({
        where: { businessId },
        order: { createdAt: 'DESC' },
        skip: offset,
        take: limit
      });

      res.json({
        success: true,
        data: {
          histories,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error: any) {
      console.error('Error getting backup history:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Create manual backup
  static async createBackup(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);

      const history = await backupSchedulerService.performBackup(businessId, 'manual');

      res.json({ success: true, data: history });
    } catch (error: any) {
      console.error('Error creating backup:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Restore from backup
  static async restoreBackup(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);
      const historyId = parseInt(req.params.historyId);

      const result = await backupSchedulerService.restoreBackup(businessId, historyId);

      res.json({
        success: true,
        message: 'Backup restored successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Download backup file
  static async downloadBackup(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);
      const historyId = parseInt(req.params.historyId);

      const historyRepo = AppDataSource.getRepository(BackupHistory);
      const history = await historyRepo.findOne({
        where: { id: historyId, businessId }
      });

      if (!history) {
        return res.status(404).json({ success: false, message: 'Backup not found' });
      }

      const filePath = backupSchedulerService.getBackupFilePath(history);
      if (!filePath) {
        return res.status(404).json({ success: false, message: 'Backup file not found' });
      }

      res.download(filePath, history.fileName);
    } catch (error: any) {
      console.error('Error downloading backup:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete backup
  static async deleteBackup(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);
      const historyId = parseInt(req.params.historyId);

      const historyRepo = AppDataSource.getRepository(BackupHistory);
      const history = await historyRepo.findOne({
        where: { id: historyId, businessId }
      });

      if (!history) {
        return res.status(404).json({ success: false, message: 'Backup not found' });
      }

      // Delete file if exists
      if (fs.existsSync(history.filePath)) {
        fs.unlinkSync(history.filePath);
      }

      await historyRepo.remove(history);

      res.json({ success: true, message: 'Backup deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting backup:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default BackupController;
