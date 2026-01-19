"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (message, meta) => {
        // 성능 로그는 프로덕션에서도 출력
        if (message.includes('⚡') || message.includes('성능')) {
            console.log('[INFO]', message, meta || '');
        }
        else if (process.env.NODE_ENV === 'development') {
            console.log('[INFO]', message, meta ? sanitizeLogData(meta) : '');
        }
    },
    error: (message, error) => {
        console.error('[ERROR]', message, error instanceof Error ? error.message : error);
    },
    warn: (message, meta) => {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[WARN]', message, meta ? sanitizeLogData(meta) : '');
        }
    },
    debug: (message, meta) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug('[DEBUG]', message, meta ? sanitizeLogData(meta) : '');
        }
    }
};
// 민감정보 제거 함수
const sanitizeLogData = (data) => {
    if (!data || typeof data !== 'object') {
        return data;
    }
    const sensitiveFields = ['password', 'token', 'email', 'phone', 'businessNumber'];
    const sanitized = { ...data };
    sensitiveFields.forEach(field => {
        if (field in sanitized) {
            if (field === 'email') {
                sanitized[field] = sanitized[field] ? '***@***.***' : undefined;
            }
            else {
                sanitized[field] = '***';
            }
        }
    });
    return sanitized;
};
//# sourceMappingURL=logger.js.map