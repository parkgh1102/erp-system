import { Router } from 'express';
import { ActivityLogController } from '../controllers/ActivityLogController';
import { authMiddleware } from '../middleware/authMiddleware';
import { businessAccessMiddleware } from '../middleware/businessAccessMiddleware';

const router: Router = Router();
const controller = new ActivityLogController();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 사용자의 활동 로그 조회
router.get('/user', (req, res) => controller.getUserLogs(req, res));

// 최근 활동 로그 조회 (설정 페이지용)
router.get('/recent', (req, res) => controller.getRecentLogs(req, res));

// 비즈니스의 활동 로그 조회 (해당 사업체 접근 권한 검증 → 크로스테넌트 조회 차단)
router.get('/business/:businessId', businessAccessMiddleware, (req, res) => controller.getBusinessLogs(req, res));

// 활동 로그 생성 (수동)
router.post('/', (req, res) => controller.createLog(req, res));

// 활동 로그 삭제
router.delete('/:id', (req, res) => controller.deleteLog(req, res));

export default router;
