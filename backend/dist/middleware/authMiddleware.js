"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const envValidator_1 = require("../config/envValidator");
const authMiddleware = (req, res, next) => {
    // 쿠키에서 토큰 가져오기 (우선순위: 쿠키 > Authorization 헤더)
    const token = req.cookies.authToken ||
        (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '토큰이 필요합니다.'
        });
    }
    try {
        const env = (0, envValidator_1.getValidatedEnv)();
        const decoded = jsonwebtoken_1.default.verify(token, env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            message: '유효하지 않은 토큰입니다.'
        });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map