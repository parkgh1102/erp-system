import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

interface SecurityEvent {
  timestamp: string;
  ip: string;
  userAgent: string;
  method: string;
  url: string;
  statusCode?: number;
  userId?: number;
  eventType: 'AUTH_FAILURE' | 'AUTH_SUCCESS' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY' | 'ERROR' | 'CSRF_TOKEN_INVALID';
  message: string;
  details?: Record<string, unknown>;
}

class SecurityLogger {
  private logPath: string;

  constructor() {
    this.logPath = path.join(process.cwd(), 'logs', 'security.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private formatLogEntry(event: SecurityEvent): string {
    return JSON.stringify({
      ...event,
      timestamp: new Date().toISOString()
    }) + '\n';
  }

  log(event: Omit<SecurityEvent, 'timestamp'>) {
    const logEntry = this.formatLogEntry({
      ...event,
      timestamp: new Date().toISOString()
    });

    fs.appendFileSync(this.logPath, logEntry);

    // 콘솔에도 출력 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 Security Event:', event);
    }
  }

  logAuthFailure(req: Request, message: string, details?: Record<string, unknown>) {
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

  logAuthSuccess(req: Request, userId: number) {
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

  logRateLimit(req: Request) {
    this.log({
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      method: req.method,
      url: req.url,
      eventType: 'RATE_LIMIT',
      message: 'Rate limit exceeded'
    });
  }

  logSuspiciousActivity(req: Request, message: string, details?: Record<string, unknown>) {
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

  logError(req: Request, error: Error, statusCode: number) {
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

  logPasswordReset(userId: number, email: string) {
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

export const securityLogger = new SecurityLogger();

// 보안 이벤트 미들웨어
export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
    securityLogger.logSuspiciousActivity(req, 'Suspicious pattern detected', {
      url: req.url,
      body: req.body,
      query: req.query
    });
  }

  // 원래 응답 함수들을 감싸기
  const originalJson = res.json;
  res.json = function(data: unknown) {
    if (res.statusCode >= 400) {
      securityLogger.logError(req, new Error(`HTTP ${res.statusCode}`), res.statusCode);
    }
    return originalJson.call(this, data);
  };

  next();
};