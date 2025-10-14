import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        userId: number;
        email: string;
        businessId: number;
        role?: string;
    };
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authMiddleware.d.ts.map