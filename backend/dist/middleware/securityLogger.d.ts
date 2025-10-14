import { Request, Response, NextFunction } from 'express';
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
declare class SecurityLogger {
    private logPath;
    constructor();
    private ensureLogDirectory;
    private formatLogEntry;
    log(event: Omit<SecurityEvent, 'timestamp'>): void;
    logAuthFailure(req: Request, message: string, details?: Record<string, unknown>): void;
    logAuthSuccess(req: Request, userId: number): void;
    logRateLimit(req: Request): void;
    logSuspiciousActivity(req: Request, message: string, details?: Record<string, unknown>): void;
    logError(req: Request, error: Error, statusCode: number): void;
    logPasswordReset(userId: number, email: string): void;
}
export declare const securityLogger: SecurityLogger;
export declare const securityMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=securityLogger.d.ts.map