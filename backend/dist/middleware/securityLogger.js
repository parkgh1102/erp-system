"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = exports.securityLogger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 민감 정보 필터링 함수
const sanitizeSensitiveData = (data) => {
    if (!data || typeof data !== 'object')
        return data;
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'session'];
    const sanitized = { ...data };
    for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            sanitized[key] = '[REDACTED]';
        }
    }
    return sanitized;
};
class SecurityLogger {
    constructor() {
        this.logPath = path_1.default.join(process.cwd(), 'logs', 'security.log');
        this.ensureLogDirectory();
    }
    ensureLogDirectory() {
        const logDir = path_1.default.dirname(this.logPath);
        if (!fs_1.default.existsSync(logDir)) {
            fs_1.default.mkdirSync(logDir, { recursive: true });
        }
    }
    formatLogEntry(event) {
        return JSON.stringify({
            ...event,
            timestamp: new Date().toISOString()
        }) + '\n';
    }
    log(event) {
        const logEntry = this.formatLogEntry({
            ...event,
            timestamp: new Date().toISOString()
        });
        fs_1.default.appendFileSync(this.logPath, logEntry);
        // 콘솔에도 출력 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
            console.warn('🚨 Security Event:', event);
        }
    }
    logAuthFailure(req, message, details) {
        this.log({
            ip: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            method: req.method,
            url: req.url,
            eventType: 'AUTH_FAILURE',
            message,
            details
        });
    }
    logAuthSuccess(req, userId) {
        this.log({
            ip: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            method: req.method,
            url: req.url,
            userId,
            eventType: 'AUTH_SUCCESS',
            message: 'Authentication successful'
        });
    }
    logRateLimit(req) {
        this.log({
            ip: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            method: req.method,
            url: req.url,
            eventType: 'RATE_LIMIT',
            message: 'Rate limit exceeded'
        });
    }
    logSuspiciousActivity(req, message, details) {
        this.log({
            ip: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            method: req.method,
            url: req.url,
            eventType: 'SUSPICIOUS_ACTIVITY',
            message,
            details
        });
    }
    logError(req, error, statusCode) {
        this.log({
            ip: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            method: req.method,
            url: req.url,
            statusCode,
            eventType: 'ERROR',
            message: error.message,
            details: process.env.NODE_ENV === 'development' && error.stack ? { stack: error.stack } : undefined
        });
    }
    logPasswordReset(userId, email) {
        this.log({
            ip: 'system',
            userAgent: 'system',
            method: 'PASSWORD_RESET',
            url: '/auth/reset-password',
            userId,
            eventType: 'AUTH_SUCCESS',
            message: `Password reset successful for user ${email}`,
            details: { email }
        });
    }
}
exports.securityLogger = new SecurityLogger();
// 보안 이벤트 미들웨어
const securityMiddleware = (req, res, next) => {
    // 의심스러운 활동 감지
    const suspiciousPatterns = [
        /\.\.\//, // 경로 순회 시도
        /<script/i, // XSS 시도
        /union.*select/i, // SQL 인젝션 시도
        /exec\s*\(/i, // 코드 실행 시도
    ];
    const fullUrl = req.url + JSON.stringify(req.body);
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(fullUrl));
    if (hasSuspiciousPattern) {
        exports.securityLogger.logSuspiciousActivity(req, 'Suspicious pattern detected', {
            url: req.url,
            body: sanitizeSensitiveData(req.body),
            query: sanitizeSensitiveData(req.query)
        });
    }
    // 원래 응답 함수들을 감싸기
    const originalJson = res.json;
    res.json = function (data) {
        if (res.statusCode >= 400) {
            exports.securityLogger.logError(req, new Error(`HTTP ${res.statusCode}`), res.statusCode);
        }
        return originalJson.call(this, data);
    };
    next();
};
exports.securityMiddleware = securityMiddleware;
//# sourceMappingURL=securityLogger.js.map