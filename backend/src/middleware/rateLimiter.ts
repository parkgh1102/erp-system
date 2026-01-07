import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { securityLogger } from './securityLogger';

// IP 주소에서 포트 번호를 제거하는 keyGenerator
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.ip || req.socket.remoteAddress || 'unknown';

  // IP:포트 형식에서 포트 제거 (IPv4)
  if (ip && ip.includes(':') && !ip.includes('::')) {
    const parts = ip.split(':');
    if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
      ip = parts[0];
    }
  }

  return ip || 'unknown';
};

export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15분
  max: 0, // 0 = 무제한
  message: {
    success: false,
    message: '너무 많은 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: '15분'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  skip: () => true, // 모든 요청 스킵 (rate limit 비활성화)
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
  max: 0, // 0 = 무제한
  message: {
    success: false,
    message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  skip: () => true, // 모든 요청 스킵 (rate limit 비활성화)
  skipSuccessfulRequests: true, // 성공한 요청은 카운트에서 제외
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 0, // 0 = 무제한
  message: {
    success: false,
    message: 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  skip: () => true, // 모든 요청 스킵 (rate limit 비활성화)
});