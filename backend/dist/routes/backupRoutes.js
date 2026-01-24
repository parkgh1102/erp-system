"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BackupController_1 = require("../controllers/BackupController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Backup config routes
router.get('/:businessId/config', BackupController_1.BackupController.getConfig);
router.put('/:businessId/config', BackupController_1.BackupController.updateConfig);
// Backup history routes
router.get('/:businessId/history', BackupController_1.BackupController.getHistory);
// Backup operations
router.post('/:businessId/backup', BackupController_1.BackupController.createBackup);
router.post('/:businessId/restore/:historyId', BackupController_1.BackupController.restoreBackup);
router.get('/:businessId/download/:historyId', BackupController_1.BackupController.downloadBackup);
router.delete('/:businessId/history/:historyId', BackupController_1.BackupController.deleteBackup);
exports.default = router;
//# sourceMappingURL=backupRoutes.js.map