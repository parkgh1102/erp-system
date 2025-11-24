import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 사업자별 사용자 관리 API
router.get('/:businessId/users', UserController.getUsers);
router.post('/:businessId/users', UserController.createUser);
router.put('/:businessId/users/:userId', UserController.updateUser);
router.delete('/:businessId/users/:userId', UserController.deleteUser);
router.patch('/:businessId/users/:userId/toggle-status', UserController.toggleUserStatus);

export default router;
