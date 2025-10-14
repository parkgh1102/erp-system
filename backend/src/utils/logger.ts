export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[INFO]', message, meta ? sanitizeLogData(meta) : '');
    }
  },

  error: (message: string, error?: Error | string) => {
    console.error('[ERROR]', message, error instanceof Error ? error.message : error);
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[WARN]', message, meta ? sanitizeLogData(meta) : '');
    }
  },

  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[DEBUG]', message, meta ? sanitizeLogData(meta) : '');
    }
  }
};

// 민감정보 제거 함수
const sanitizeLogData = (data: Record<string, unknown>): Record<string, unknown> => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'email', 'phone', 'businessNumber'];
  const sanitized = { ...data };

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      if (field === 'email') {
        sanitized[field] = sanitized[field] ? '***@***.***' : undefined;
      } else {
        sanitized[field] = '***';
      }
    }
  });

  return sanitized;
};