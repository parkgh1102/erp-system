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
exports.BackupController = void 0;
const database_1 = require("../config/database");
const BackupConfig_1 = require("../entities/BackupConfig");
const BackupHistory_1 = require("../entities/BackupHistory");
const BackupSchedulerService_1 = require("../services/BackupSchedulerService");
const fs = __importStar(require("fs"));
class BackupController {
    // Get backup config for a business
    static async getConfig(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const configRepo = database_1.AppDataSource.getRepository(BackupConfig_1.BackupConfig);
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
        }
        catch (error) {
            console.error('Error getting backup config:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Update backup config
    static async updateConfig(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const { enabled, scheduleType, scheduleTime, scheduleDay, retentionCount } = req.body;
            const configRepo = database_1.AppDataSource.getRepository(BackupConfig_1.BackupConfig);
            let config = await configRepo.findOne({ where: { businessId } });
            if (!config) {
                config = configRepo.create({ businessId });
            }
            if (typeof enabled === 'boolean')
                config.enabled = enabled;
            if (scheduleType)
                config.scheduleType = scheduleType;
            if (scheduleTime)
                config.scheduleTime = scheduleTime;
            if (scheduleDay !== undefined)
                config.scheduleDay = scheduleDay;
            if (retentionCount)
                config.retentionCount = retentionCount;
            await configRepo.save(config);
            // Update scheduler
            await BackupSchedulerService_1.backupSchedulerService.scheduleBackup(config);
            res.json({ success: true, data: config });
        }
        catch (error) {
            console.error('Error updating backup config:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Get backup history
    static async getHistory(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const historyRepo = database_1.AppDataSource.getRepository(BackupHistory_1.BackupHistory);
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
        }
        catch (error) {
            console.error('Error getting backup history:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Create manual backup
    static async createBackup(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const history = await BackupSchedulerService_1.backupSchedulerService.performBackup(businessId, 'manual');
            res.json({ success: true, data: history });
        }
        catch (error) {
            console.error('Error creating backup:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Restore from backup
    static async restoreBackup(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const historyId = parseInt(req.params.historyId);
            const result = await BackupSchedulerService_1.backupSchedulerService.restoreBackup(businessId, historyId);
            res.json({
                success: true,
                message: 'Backup restored successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error restoring backup:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Download backup file
    static async downloadBackup(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const historyId = parseInt(req.params.historyId);
            const historyRepo = database_1.AppDataSource.getRepository(BackupHistory_1.BackupHistory);
            const history = await historyRepo.findOne({
                where: { id: historyId, businessId }
            });
            if (!history) {
                return res.status(404).json({ success: false, message: 'Backup not found' });
            }
            const filePath = BackupSchedulerService_1.backupSchedulerService.getBackupFilePath(history);
            if (!filePath) {
                return res.status(404).json({ success: false, message: 'Backup file not found' });
            }
            res.download(filePath, history.fileName);
        }
        catch (error) {
            console.error('Error downloading backup:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Delete backup
    static async deleteBackup(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const historyId = parseInt(req.params.historyId);
            const historyRepo = database_1.AppDataSource.getRepository(BackupHistory_1.BackupHistory);
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
        }
        catch (error) {
            console.error('Error deleting backup:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.BackupController = BackupController;
exports.default = BackupController;
//# sourceMappingURL=BackupController.js.map