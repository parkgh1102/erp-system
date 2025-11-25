"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ActivityLogController_1 = require("../controllers/ActivityLogController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
const controller = new ActivityLogController_1.ActivityLogController();
// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware_1.authMiddleware);
// 사용자의 활동 로그 조회
router.get('/user', (req, res) => controller.getUserLogs(req, res));
// 최근 활동 로그 조회 (설정 페이지용)
router.get('/recent', (req, res) => controller.getRecentLogs(req, res));
// 비즈니스의 활동 로그 조회 (관리자용)
router.get('/business/:businessId', (req, res) => controller.getBusinessLogs(req, res));
// 활동 로그 생성 (수동)
router.post('/', (req, res) => controller.createLog(req, res));
// 활동 로그 삭제
router.delete('/:id', (req, res) => controller.deleteLog(req, res));
exports.default = router;
//# sourceMappingURL=activityLogRoutes.js.map