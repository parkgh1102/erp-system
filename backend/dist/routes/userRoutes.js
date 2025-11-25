"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 모든 라우트에 인증 미들웨어 적용
router.use(auth_1.authenticateToken);
// 사업자별 사용자 관리 API
router.get('/:businessId/users', UserController_1.UserController.getUsers);
router.post('/:businessId/users', UserController_1.UserController.createUser);
router.put('/:businessId/users/:userId', UserController_1.UserController.updateUser);
router.delete('/:businessId/users/:userId', UserController_1.UserController.deleteUser);
router.patch('/:businessId/users/:userId/toggle-status', UserController_1.UserController.toggleUserStatus);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map