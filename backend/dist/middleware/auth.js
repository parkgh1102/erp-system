"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const envValidator_1 = require("../config/envValidator");
const tokenBlacklist_1 = require("../utils/tokenBlacklist");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.split(' ')[1];
    // Authorization 헤더에 토큰이 없으면 쿠키에서 확인
    if (!token) {
        token = req.cookies?.authToken;
    }
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '토큰이 필요합니다.'
        });
    }
    // 블랙리스트 확인 (로그아웃된 토큰)
    if (tokenBlacklist_1.tokenBlacklist.isBlacklisted(token)) {
        return res.status(401).json({
            success: false,
            message: '로그아웃된 토큰입니다. 다시 로그인해주세요.'
        });
    }
    try {
        const env = (0, envValidator_1.getValidatedEnv)();
        const decoded = jsonwebtoken_1.default.verify(token, env.JWT_SECRET);
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            businessId: decoded.businessId || 0
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: '토큰이 만료되었습니다.'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }
        else {
            return res.status(401).json({
                success: false,
                message: '토큰 검증에 실패했습니다.'
            });
        }
    }
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.js.map