import { Request, Response, NextFunction } from 'express';
declare module 'express-session' {
    interface SessionData {
        csrfToken?: string;
    }
}
export declare const csrfProtection: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const getCsrfToken: (req: Request, res: Response) => Response<any, Record<string, any>>;
export declare const csrfErrorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const conditionalCsrfProtection: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=csrfProtection.d.ts.map