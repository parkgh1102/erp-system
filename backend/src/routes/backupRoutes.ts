import { Router } from 'express';
import { BackupController } from '../controllers/BackupController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Backup config routes
router.get('/:businessId/config', BackupController.getConfig);
router.put('/:businessId/config', BackupController.updateConfig);

// Backup history routes
router.get('/:businessId/history', BackupController.getHistory);

// Backup operations
router.post('/:businessId/backup', BackupController.createBackup);
router.post('/:businessId/restore/:historyId', BackupController.restoreBackup);
router.get('/:businessId/download/:historyId', BackupController.downloadBackup);
router.delete('/:businessId/history/:historyId', BackupController.deleteBackup);

export default router;
