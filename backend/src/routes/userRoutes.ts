import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';
import { requireBusinessAdmin } from '../middleware/requireBusinessAdmin';

const router: Router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 사업자별 사용자 관리 API — 해당 사업체의 소유 admin 만 접근 가능 (타 사업체 접근 차단)
router.get('/:businessId/users', requireBusinessAdmin, UserController.getUsers);
router.post('/:businessId/users', requireBusinessAdmin, UserController.createUser);
router.put('/:businessId/users/:userId', requireBusinessAdmin, UserController.updateUser);
router.delete('/:businessId/users/:userId', requireBusinessAdmin, UserController.deleteUser);
router.patch('/:businessId/users/:userId/toggle-status', requireBusinessAdmin, UserController.toggleUserStatus);

export default router;
