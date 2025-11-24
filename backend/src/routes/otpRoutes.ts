import { Router } from 'express';
import { OTPController } from '../controllers/OTPController';

const router = Router();

// OTP 전송
router.post('/send', OTPController.sendOTP);

// OTP 검증
router.post('/verify', OTPController.verifyOTP);

// OTP 상태 확인
router.get('/status/:email', OTPController.getOTPStatus);

export default router;
