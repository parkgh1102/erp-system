"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conditionalCsrfProtection = exports.csrfErrorHandler = exports.getCsrfToken = exports.csrfProtection = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const securityLogger_1 = require("./securityLogger");
// CSRF 토큰 생성
const generateCsrfToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
// CSRF 토큰 검증
const validateCsrfToken = (req) => {
    const sessionToken = req.session?.csrfToken;
    const requestToken = req.body._csrf ||
        req.query._csrf ||
        req.headers['x-csrf-token'] ||
        req.headers['csrf-token'];
    return sessionToken && requestToken && sessionToken === requestToken;
};
// CSRF 보호 미들웨어
const csrfProtection = (req, res, next) => {
    // GET, HEAD, OPTIONS 요청은 검증하지 않음
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    if (!validateCsrfToken(req)) {
        securityLogger_1.securityLogger.log({
            ip: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            method: req.method,
            url: req.url,
            eventType: 'CSRF_TOKEN_INVALID',
            message: 'CSRF token validation failed',
            details: {
                referer: req.headers.referer
            }
        });
        logger_1.logger.warn('CSRF token validation failed', {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            path: req.path,
            method: req.method
        });
        return res.status(403).json({
            success: false,
            message: 'CSRF 토큰이 유효하지 않습니다.',
            code: 'INVALID_CSRF_TOKEN'
        });
    }
    next();
};
exports.csrfProtection = csrfProtection;
// CSRF 토큰 제공 엔드포인트
const getCsrfToken = (req, res) => {
    if (!req.session) {
        return res.status(500).json({
            success: false,
            message: '세션이 초기화되지 않았습니다.'
        });
    }
    const token = generateCsrfToken();
    req.session.csrfToken = token;
    res.json({
        success: true,
        csrfToken: token
    });
};
exports.getCsrfToken = getCsrfToken;
// CSRF 에러 핸들러
const csrfErrorHandler = (error, req, res, next) => {
    if (error.message.includes('CSRF')) {
        securityLogger_1.securityLogger.log({
            ip: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            method: req.method,
            url: req.url,
            eventType: 'CSRF_TOKEN_INVALID',
            message: 'CSRF token validation failed',
            details: {
                referer: req.headers.referer
            }
        });
        logger_1.logger.warn('CSRF token validation failed', {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            path: req.path,
            method: req.method
        });
        return res.status(403).json({
            success: false,
            message: 'CSRF 토큰이 유효하지 않습니다.',
            code: 'INVALID_CSRF_TOKEN'
        });
    }
    next(error);
};
exports.csrfErrorHandler = csrfErrorHandler;
// 환경별 CSRF 보호 (개발 환경에서는 선택적)
const conditionalCsrfProtection = (req, res, next) => {
    // 개발 환경에서는 CSRF 검증 건너뛰기 (편의성)
    if (process.env.NODE_ENV === 'development') {
        logger_1.logger.info('CSRF protection disabled in development mode');
        return next();
    }
    // 프로덕션에서는 CSRF 보호 활성화
    logger_1.logger.info(`CSRF protection enabled in ${process.env.NODE_ENV} mode`);
    return (0, exports.csrfProtection)(req, res, next);
};
exports.conditionalCsrfProtection = conditionalCsrfProtection;
//# sourceMappingURL=csrfProtection.old.js.map