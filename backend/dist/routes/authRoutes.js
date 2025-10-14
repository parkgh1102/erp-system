"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.post('/signup', AuthController_1.AuthController.signup);
router.post('/login', AuthController_1.AuthController.login);
router.post('/refresh-token', AuthController_1.AuthController.refreshToken);
router.post('/logout', AuthController_1.AuthController.logout);
router.get('/check-email', AuthController_1.AuthController.checkEmailAvailability);
router.get('/profile', auth_1.authenticateToken, AuthController_1.AuthController.getProfile);
router.put('/profile', auth_1.authenticateToken, AuthController_1.AuthController.updateProfile);
router.put('/change-password', auth_1.authenticateToken, AuthController_1.AuthController.changePassword);
router.post('/upload-avatar', auth_1.authenticateToken, upload_1.avatarUpload.single('avatar'), AuthController_1.AuthController.uploadAvatar);
// 아이디/비밀번호 찾기
router.post('/find-username', AuthController_1.AuthController.findUsername);
router.post('/verify-password-reset', AuthController_1.AuthController.verifyPasswordReset);
router.post('/reset-password', AuthController_1.AuthController.resetPassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map