import { Request, Response } from 'express';
export declare class OTPController {
    /**
     * OTP 전송 요청
     * POST /api/otp/send
     */
    static sendOTP(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * OTP 검증
     * POST /api/otp/verify
     */
    static verifyOTP(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * OTP 상태 확인
     * GET /api/otp/status/:email
     */
    static getOTPStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=OTPController.d.ts.map