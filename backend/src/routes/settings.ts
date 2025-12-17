import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 보안 설정 조회 (로그인 전 - 인증 불필요)
router.get('/security/:email', SettingsController.getSecuritySettingsByEmail);

// 이후 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 설정 조회
router.get('/:businessId', SettingsController.getSettings);

// 설정 저장
router.put('/:businessId', SettingsController.updateSettings);

// 데이터 내보내기
router.get('/:businessId/export/customers', SettingsController.exportCustomers);
router.get('/:businessId/export/products', SettingsController.exportProducts);
router.get('/:businessId/export/transactions', SettingsController.exportTransactions);
router.get('/:businessId/export/all', SettingsController.exportAll);

// 백업 및 복원
router.get('/:businessId/backup', SettingsController.backupData);
router.post('/:businessId/restore', SettingsController.restoreData);

// 위험한 작업
router.post('/:businessId/reset-data', SettingsController.resetAllData);
router.post('/:businessId/delete-account', SettingsController.deleteAccount);

export default router;
