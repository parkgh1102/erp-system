"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SettingsController_1 = require("../controllers/SettingsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 보안 설정 조회 (로그인 전 - 인증 불필요)
router.get('/security/:email', SettingsController_1.SettingsController.getSecuritySettingsByEmail);
// 이후 라우트에 인증 미들웨어 적용
router.use(auth_1.authenticateToken);
// 설정 조회
router.get('/:businessId', SettingsController_1.SettingsController.getSettings);
// 설정 저장
router.put('/:businessId', SettingsController_1.SettingsController.updateSettings);
// 데이터 내보내기
router.get('/:businessId/export/customers', SettingsController_1.SettingsController.exportCustomers);
router.get('/:businessId/export/products', SettingsController_1.SettingsController.exportProducts);
router.get('/:businessId/export/transactions', SettingsController_1.SettingsController.exportTransactions);
router.get('/:businessId/export/all', SettingsController_1.SettingsController.exportAll);
// 백업 및 복원
router.get('/:businessId/backup', SettingsController_1.SettingsController.backupData);
router.post('/:businessId/restore', SettingsController_1.SettingsController.restoreData);
// 위험한 작업
router.post('/:businessId/reset-data', SettingsController_1.SettingsController.resetAllData);
router.post('/:businessId/delete-account', SettingsController_1.SettingsController.deleteAccount);
exports.default = router;
//# sourceMappingURL=settings.js.map