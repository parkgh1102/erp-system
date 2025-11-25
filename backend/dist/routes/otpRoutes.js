"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OTPController_1 = require("../controllers/OTPController");
const router = (0, express_1.Router)();
// OTP 전송
router.post('/send', OTPController_1.OTPController.sendOTP);
// OTP 검증
router.post('/verify', OTPController_1.OTPController.verifyOTP);
// OTP 상태 확인
router.get('/status/:email', OTPController_1.OTPController.getOTPStatus);
exports.default = router;
//# sourceMappingURL=otpRoutes.js.map