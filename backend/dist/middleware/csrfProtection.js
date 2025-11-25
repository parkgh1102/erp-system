"use strict";
/**
 * 개선된 CSRF 보호 미들웨어
 *
 * 기존 코드를 수정하지 않고 새로운 보안 강화 설정 제공
 *
 * 주요 개선사항:
 * 1. 개발 환경에서도 CSRF 보호 활성화 (환경 변수로 선택적 비활성화)
 * 2. 더욱 강력한 토큰 생성
 * 3. 토큰 만료 시간 설정
 *
 * 적용 방법:
 * backend/src/index.ts에서 기존 csrfProtection 대신 이 파일의 함수 사용
 *
 * import { improvedCsrfProtection, getCsrfToken } from './middleware/csrfProtection.improved';
 * app.use(improvedCsrfProtection);
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoRefreshCsrfToken = exports.doubleSubmitCsrfProtection = exports.csrfErrorHandler = exports.refreshCsrfToken = exports.getCsrfToken = exports.improvedCsrfProtection = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const securityLogger_1 = require("./securityLogger");
const errorCodes_1 = require("../constants/errorCodes");
// CSRF 토큰 만료 시간 (1시간)
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000;
/**
 * 강력한 CSRF 토큰 생성 (64바이트)
 */
const generateCsrfToken = () => {
    return crypto_1.default.randomBytes(64).toString('hex');
};
/**
 * CSRF 토큰 검증 (만료 시간 포함)
 */
const validateCsrfToken = (req) => {
    const sessionToken = req.session?.csrfToken;
    const tokenCreatedAt = req.session?.csrfTokenCreatedAt;
    const requestToken = req.body._csrf ||
        req.query._csrf ||
        req.headers['x-csrf-token'] ||
        req.headers['csrf-token'];
    // 토큰이 없는 경우
    if (!sessionToken || !requestToken) {
        return false;
    }
    // 토큰이 일치하지 않는 경우
    if (sessionToken !== requestToken) {
        return false;
    }
    // 토큰 만료 확인
    if (tokenCreatedAt) {
        const now = Date.now();
        if (now - tokenCreatedAt > CSRF_TOKEN_EXPIRY) {
            logger_1.logger.warn('CSRF token expired', {
                createdAt: new Date(tokenCreatedAt),
                now: new Date(now),
                age: now - tokenCreatedAt
            });
            return false;
        }
    }
    return true;
};
/**
 * 개선된 CSRF 보호 미들웨어
 */
const improvedCsrfProtection = (req, res, next) => {
    // GET, HEAD, OPTIONS 요청은 검증하지 않음
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    // 환경 변수로 명시적 비활성화 (개발 편의)
    if (process.env.DISABLE_CSRF === 'true') {
        logger_1.logger.warn('⚠️  CSRF protection is DISABLED by environment variable');
        return next();
    }
    // 특정 경로 제외 (필요한 경우)
    const excludedPaths = [
        '/api/webhooks',
        '/api/health'
    ];
    if (excludedPaths.some(path => req.path.startsWith(path))) {
        return next();
    }
    // CSRF 토큰 검증
    if (!validateCsrfToken(req)) {
        securityLogger_1.securityLogger.log({
            ip: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            method: req.method,
            url: req.url,
            eventType: 'CSRF_TOKEN_INVALID',
            message: 'CSRF token validation failed',
            details: {
                referer: req.headers.referer,
                hasSessionToken: !!req.session?.csrfToken,
                hasRequestToken: !!(req.body._csrf ||
                    req.query._csrf ||
                    req.headers['x-csrf-token'] ||
                    req.headers['csrf-token'])
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
            code: errorCodes_1.ErrorCodes.CSRF_TOKEN_INVALID
        });
    }
    next();
};
exports.improvedCsrfProtection = improvedCsrfProtection;
/**
 * 개선된 CSRF 토큰 제공 엔드포인트
 */
const getCsrfToken = (req, res) => {
    if (!req.session) {
        return res.status(500).json({
            success: false,
            message: '세션이 초기화되지 않았습니다.',
            code: errorCodes_1.ErrorCodes.SRV_INTERNAL_ERROR
        });
    }
    // 기존 토큰이 있고 아직 유효한 경우 재사용
    if (req.session.csrfToken && req.session.csrfTokenCreatedAt) {
        const now = Date.now();
        if (now - req.session.csrfTokenCreatedAt < CSRF_TOKEN_EXPIRY) {
            return res.json({
                success: true,
                csrfToken: req.session.csrfToken,
                expiresIn: CSRF_TOKEN_EXPIRY - (now - req.session.csrfTokenCreatedAt)
            });
        }
    }
    // 새 토큰 생성
    const token = generateCsrfToken();
    req.session.csrfToken = token;
    req.session.csrfTokenCreatedAt = Date.now();
    res.json({
        success: true,
        csrfToken: token,
        expiresIn: CSRF_TOKEN_EXPIRY
    });
};
exports.getCsrfToken = getCsrfToken;
/**
 * CSRF 토큰 갱신 엔드포인트
 */
const refreshCsrfToken = (req, res) => {
    if (!req.session) {
        return res.status(500).json({
            success: false,
            message: '세션이 초기화되지 않았습니다.',
            code: errorCodes_1.ErrorCodes.SRV_INTERNAL_ERROR
        });
    }
    const token = generateCsrfToken();
    req.session.csrfToken = token;
    req.session.csrfTokenCreatedAt = Date.now();
    res.json({
        success: true,
        csrfToken: token,
        expiresIn: CSRF_TOKEN_EXPIRY
    });
};
exports.refreshCsrfToken = refreshCsrfToken;
/**
 * CSRF 에러 핸들러
 */
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
                referer: req.headers.referer,
                error: error.message
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
            code: errorCodes_1.ErrorCodes.CSRF_TOKEN_INVALID
        });
    }
    next(error);
};
exports.csrfErrorHandler = csrfErrorHandler;
/**
 * Double Submit Cookie 패턴 (대안)
 *
 * 세션을 사용하지 않는 환경에서 사용
 */
const doubleSubmitCsrfProtection = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    const cookieToken = req.cookies['XSRF-TOKEN'];
    const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({
            success: false,
            message: 'CSRF 토큰이 유효하지 않습니다.',
            code: errorCodes_1.ErrorCodes.CSRF_TOKEN_INVALID
        });
    }
    next();
};
exports.doubleSubmitCsrfProtection = doubleSubmitCsrfProtection;
/**
 * CSRF 토큰 자동 갱신 미들웨어
 *
 * 토큰이 만료 임박 시 자동으로 새 토큰 발급
 */
const autoRefreshCsrfToken = (req, res, next) => {
    if (!req.session?.csrfToken || !req.session?.csrfTokenCreatedAt) {
        return next();
    }
    const now = Date.now();
    const age = now - req.session.csrfTokenCreatedAt;
    // 토큰이 30분 이상 되었으면 자동 갱신
    if (age > 30 * 60 * 1000) {
        const newToken = generateCsrfToken();
        req.session.csrfToken = newToken;
        req.session.csrfTokenCreatedAt = now;
        // 응답 헤더에 새 토큰 전달
        res.setHeader('X-CSRF-Token', newToken);
        logger_1.logger.debug('CSRF token auto-refreshed', {
            userId: req.session.userId,
            oldAge: age
        });
    }
    next();
};
exports.autoRefreshCsrfToken = autoRefreshCsrfToken;
exports.default = exports.improvedCsrfProtection;
//# sourceMappingURL=csrfProtection.js.map