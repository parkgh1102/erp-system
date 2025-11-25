/**
 * 개선된 CSRF 보호 미들웨어
 *
 * 기존 코드를 수정하지 않고 새로운 보안 강화 설정 제공
 *
 * 주요 개선사항:
 * 1. 개발 환경에서도 CSRF 보호 활성화 (환경 변수로 선택적 비활성화)
 * 2. 더욱 강력한 토큰 생성
 * 3. 토큰 만료 시간 설정
 *
 * 적용 방법:
 * backend/src/index.ts에서 기존 csrfProtection 대신 이 파일의 함수 사용
 *
 * import { improvedCsrfProtection, getCsrfToken } from './middleware/csrfProtection.improved';
 * app.use(improvedCsrfProtection);
 */
import { Request, Response, NextFunction } from 'express';
declare module 'express-session' {
    interface SessionData {
        csrfToken?: string;
        csrfTokenCreatedAt?: number;
    }
}
/**
 * 개선된 CSRF 보호 미들웨어
 */
export declare const improvedCsrfProtection: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * 개선된 CSRF 토큰 제공 엔드포인트
 */
export declare const getCsrfToken: (req: Request, res: Response) => Response<any, Record<string, any>>;
/**
 * CSRF 토큰 갱신 엔드포인트
 */
export declare const refreshCsrfToken: (req: Request, res: Response) => Response<any, Record<string, any>>;
/**
 * CSRF 에러 핸들러
 */
export declare const csrfErrorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Double Submit Cookie 패턴 (대안)
 *
 * 세션을 사용하지 않는 환경에서 사용
 */
export declare const doubleSubmitCsrfProtection: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * CSRF 토큰 자동 갱신 미들웨어
 *
 * 토큰이 만료 임박 시 자동으로 새 토큰 발급
 */
export declare const autoRefreshCsrfToken: (req: Request, res: Response, next: NextFunction) => void;
export default improvedCsrfProtection;
//# sourceMappingURL=csrfProtection.d.ts.map