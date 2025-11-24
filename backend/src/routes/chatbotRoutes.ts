import { Router } from 'express';
import { sendMessage, getStatus } from '../controllers/ChatbotController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 챗봇 메시지 전송
router.post('/message', sendMessage);

// 챗봇 상태 확인
router.get('/status', getStatus);

export default router;
