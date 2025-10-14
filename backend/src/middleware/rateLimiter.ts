import rateLimit from 'express-rate-limit';
import { securityLogger } from './securityLogger';

export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15분
  max: process.env.NODE_ENV === 'development' ? 1000 : parseInt(process.env.RATE_LIMIT_MAX || '100'), // 개발환경에서는 1000개 요청
  message: {
    success: false,
    message: '너무 많은 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: '15분'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.logRateLimit(req);
    res.status(429).json({
      success: false,
      message: '너무 많은 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
    });
  }
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // 개발환경에서는 100회, 운영환경에서는 10회
  message: {
    success: false,
    message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 성공한 요청은 카운트에서 제외
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 개발환경에서는 분당 1000회
  message: {
    success: false,
    message: 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});