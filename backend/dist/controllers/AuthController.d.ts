import { Request, Response } from 'express';
export declare const AuthController: {
    signup(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    changePassword(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    logout(req: Request, res: Response): Promise<void>;
    checkEmailAvailability(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    uploadAvatar(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    findUsername(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    verifyPasswordReset(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    resetPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=AuthController.d.ts.map