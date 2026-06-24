import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { authenticateToken } from '../middleware/auth';
import { businessAccessMiddleware } from '../middleware/businessAccessMiddleware';
import { requireBusinessAdmin } from '../middleware/requireBusinessAdmin';

const router: Router = Router();

// 보안 설정 조회 (로그인 전 - 인증 불필요)
router.get('/security/:email', SettingsController.getSecuritySettingsByEmail);

// 이후 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 설정 조회 (접근 권한 검증)
router.get('/:businessId', businessAccessMiddleware, SettingsController.getSettings);

// 설정 저장 (보안 설정 포함 → 소유 admin 전용)
router.put('/:businessId', requireBusinessAdmin, SettingsController.updateSettings);

// 데이터 내보내기 (접근 권한 검증)
router.get('/:businessId/export/customers', businessAccessMiddleware, SettingsController.exportCustomers);
router.get('/:businessId/export/products', businessAccessMiddleware, SettingsController.exportProducts);
router.get('/:businessId/export/transactions', businessAccessMiddleware, SettingsController.exportTransactions);
router.get('/:businessId/export/all', businessAccessMiddleware, SettingsController.exportAll);

// 백업 (접근 권한 검증) / 복원 (소유 admin 전용)
router.get('/:businessId/backup', businessAccessMiddleware, SettingsController.backupData);
router.post('/:businessId/restore', requireBusinessAdmin, SettingsController.restoreData);

// 위험한 작업 — 소유 admin 전용
router.post('/:businessId/reset-data', requireBusinessAdmin, SettingsController.resetAllData);
router.post('/:businessId/delete-account', requireBusinessAdmin, SettingsController.deleteAccount);

export default router;
