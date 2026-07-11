import { Router } from 'express';
import { BackupController } from '../controllers/BackupController';
import { authenticateToken } from '../middleware/auth';
import { businessAccessMiddleware } from '../middleware/businessAccessMiddleware';
import { requireBusinessAdmin } from '../middleware/requireBusinessAdmin';

const router = Router();

// 인증 필수
router.use(authenticateToken);

// 조회(읽기)는 해당 사업체 접근 권한 검증
router.get('/:businessId/config', businessAccessMiddleware, BackupController.getConfig);
router.get('/:businessId/history', businessAccessMiddleware, BackupController.getHistory);

// 설정 변경 / 백업 생성·다운로드(전체 데이터 유출 경로) / 복원·삭제(파괴적) → 소유 admin 전용
router.put('/:businessId/config', requireBusinessAdmin, BackupController.updateConfig);
router.post('/:businessId/backup', requireBusinessAdmin, BackupController.createBackup);
router.post('/:businessId/restore/:historyId', requireBusinessAdmin, BackupController.restoreBackup);
router.get('/:businessId/download/:historyId', requireBusinessAdmin, BackupController.downloadBackup);
router.delete('/:businessId/history/:historyId', requireBusinessAdmin, BackupController.deleteBackup);

export default router;
