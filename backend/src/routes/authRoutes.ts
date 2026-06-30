import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';
import { avatarUpload } from '../middleware/upload';

const router: Router = Router();

router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.get('/check-email', AuthController.checkEmailAvailability);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.put('/change-password', authenticateToken, AuthController.changePassword);
router.post('/upload-avatar', authenticateToken, avatarUpload.single('avatar'), AuthController.uploadAvatar);

// 아이디/비밀번호 찾기
router.post('/find-username', AuthController.findUsername);
router.post('/verify-password-reset', AuthController.verifyPasswordReset);
// 사용자(매출조회) 전화번호 기반 비밀번호 재설정 요청
router.post('/request-phone-reset', AuthController.requestPhonePasswordReset);
router.post('/confirm-password-reset-otp', AuthController.confirmPasswordResetOtp);
router.post('/reset-password', AuthController.resetPassword);

export default router;