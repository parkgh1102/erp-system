import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { securityLogger } from './securityLogger';

// 세션에 CSRF 토큰 저장을 위한 인터페이스 확장
declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
  }
}

// CSRF 토큰 생성
const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF 토큰 검증
const validateCsrfToken = (req: Request): boolean => {
  const sessionToken = req.session?.csrfToken;
  const requestToken = req.body._csrf ||
                      req.query._csrf ||
                      req.headers['x-csrf-token'] ||
                      req.headers['csrf-token'];

  return sessionToken && requestToken && sessionToken === requestToken;
};

// CSRF 보호 미들웨어
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // GET, HEAD, OPTIONS 요청은 검증하지 않음
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  if (!validateCsrfToken(req)) {
    securityLogger.log({
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

    logger.warn('CSRF token validation failed', {
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

// CSRF 토큰 제공 엔드포인트
export const getCsrfToken = (req: Request, res: Response) => {
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

// CSRF 에러 핸들러
export const csrfErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error.message.includes('CSRF')) {
    securityLogger.log({
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

    logger.warn('CSRF token validation failed', {
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

// 환경별 CSRF 보호 (개발 환경에서는 선택적)
export const conditionalCsrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 개발 환경에서는 CSRF 검증 건너뛰기 (편의성)
  if (process.env.NODE_ENV === 'development') {
    logger.info('CSRF protection disabled in development mode');
    return next();
  }

  // 프로덕션에서는 CSRF 보호 활성화
  logger.info(`CSRF protection enabled in ${process.env.NODE_ENV} mode`);
  return csrfProtection(req, res, next);
};