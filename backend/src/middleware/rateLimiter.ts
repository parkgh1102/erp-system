import rateLimit from 'express-rate-limit';
import { securityLogger } from './securityLogger';

// trust proxy=1 (index.ts)라 req.ip는 실제 클라이언트 IP → per-IP 제한이 정상 동작
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15분

// 전역 안전망 (DoS/폭주 방지). 정상 사용자에 영향 없도록 넉넉하게.
export const generalRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10), // IP당 15분 1000회
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.logRateLimit(req);
    res.status(429).json({
      success: false,
      message: '너무 많은 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: Math.ceil(WINDOW_MS / 1000)
    });
  }
});

// 인증 엔드포인트 (/api/auth) — 브루트포스/OTP 스팸 방지. 성공/실패 모두 카운트.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10), // IP당 15분 20회
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.logRateLimit(req);
    res.status(429).json({
      success: false,
      message: '인증 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: 900
    });
  }
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: parseInt(process.env.API_RATE_LIMIT_MAX || '300', 10), // IP당 1분 300회
  standardHeaders: true,
  legacyHeaders: false,
});
