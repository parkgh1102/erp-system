import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const controller = new NotificationController();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 사용자의 알림 조회
router.get('/', (req, res) => controller.getUserNotifications(req, res));

// 미읽은 알림 개수 조회
router.get('/unread-count', (req, res) => controller.getUnreadCount(req, res));

// 알림 생성
router.post('/', (req, res) => controller.createNotification(req, res));

// 알림을 읽음으로 표시
router.patch('/:id/read', (req, res) => controller.markAsRead(req, res));

// 모든 알림을 읽음으로 표시
router.patch('/read-all', (req, res) => controller.markAllAsRead(req, res));

// 알림 삭제
router.delete('/:id', (req, res) => controller.deleteNotification(req, res));

// 모든 알림 삭제
router.delete('/', (req, res) => controller.deleteAllNotifications(req, res));

export default router;
