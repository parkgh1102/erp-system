"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ChatbotController_1 = require("../controllers/ChatbotController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 모든 라우트에 인증 미들웨어 적용
router.use(auth_1.authenticateToken);
// 챗봇 메시지 전송
router.post('/message', ChatbotController_1.sendMessage);
// 챗봇 상태 확인
router.get('/status', ChatbotController_1.getStatus);
exports.default = router;
//# sourceMappingURL=chatbotRoutes.js.map