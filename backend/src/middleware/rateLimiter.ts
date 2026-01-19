import rateLimit from 'express-rate-limit';
import { securityLogger } from './securityLogger';

// 프로덕션 환경에서만 Rate Limit 활성화
const isProduction = process.env.NODE_ENV === 'production';

export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15분
  max: isProduction ? 1000 : 0, // 프로덕션: 15분당 1000회, 개발: 무제한
  message: {
    success: false,
    message: '너무 많은 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: '15분'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction, // 개발 환경에서만 비활성화
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
  max: isProduction ? 10 : 0, // 프로덕션: 15분당 10회 로그인 시도, 개발: 무제한
  message: {
    success: false,
    message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction, // 개발 환경에서만 비활성화
  skipSuccessfulRequests: true, // 성공한 요청은 카운트에서 제외
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: isProduction ? 300 : 0, // 프로덕션: 1분당 300회, 개발: 무제한
  message: {
    success: false,
    message: 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction, // 개발 환경에서만 비활성화
});