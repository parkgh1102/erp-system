import { Request, Response } from 'express';
export declare const AuthController: {
    signup(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    changePassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    logout(req: Request, res: Response): Promise<void>;
    checkEmailAvailability(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    uploadAvatar(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    findUsername(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    verifyPasswordReset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    resetPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=AuthController.d.ts.map