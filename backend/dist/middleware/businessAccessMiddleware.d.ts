import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
export declare const businessAccessMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=businessAccessMiddleware.d.ts.map