"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPController = void 0;
const database_1 = require("../config/database");
const OTP_1 = require("../entities/OTP");
const User_1 = require("../entities/User");
const AlimtalkService_1 = require("../services/AlimtalkService");
class OTPController {
    /**
     * OTP 전송 요청
     * POST /api/otp/send
     */
    static async sendOTP(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: '이메일을 입력해주세요.' });
            }
            // 사용자 확인
            const userRepository = database_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepository.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: '존재하지 않는 사용자입니다.' });
            }
            if (!user.phone) {
                return res.status(400).json({ message: '등록된 전화번호가 없습니다.' });
            }
            const otpRepository = database_1.AppDataSource.getRepository(OTP_1.OTP);
            const now = new Date();
            // 최근 OTP 조회 (같은 이메일)
            const recentOTP = await otpRepository.findOne({
                where: {
                    email,
                    verified: false,
                },
                order: { createdAt: 'DESC' },
            });
            // 새 OTP 생성
            const otpCode = AlimtalkService_1.AlimtalkService.generateOTP();
            const expiresAt = new Date(now.getTime() + 60 * 1000); // 1분 후 만료
            let otp;
            if (recentOTP && !recentOTP.verified) {
                // 기존 OTP 업데이트 (재전송)
                recentOTP.code = otpCode;
                recentOTP.expiresAt = expiresAt;
                recentOTP.sendCount += 1;
                recentOTP.attemptCount = 0; // 검증 시도 횟수 초기화
                otp = await otpRepository.save(recentOTP);
            }
            else {
                // 새 OTP 생성
                otp = otpRepository.create({
                    email,
                    phone: user.phone,
                    code: otpCode,
                    expiresAt,
                    sendCount: 1,
                    attemptCount: 0,
                    verified: false,
                });
                otp = await otpRepository.save(otp);
            }
            // 알림톡 전송
            const sent = await AlimtalkService_1.AlimtalkService.sendOTP(user.phone, otpCode);
            if (!sent) {
                console.error('알림톡 전송 실패');
                return res.status(500).json({ message: 'OTP 전송에 실패했습니다.' });
            }
            console.log('OTP 전송 성공:', { email, sendCount: otp.sendCount, expiresAt: otp.expiresAt });
            return res.json({
                message: 'OTP가 전송되었습니다.',
                expiresAt: otp.expiresAt,
                sendCount: otp.sendCount,
            });
        }
        catch (error) {
            console.error('OTP 전송 오류:', error);
            return res.status(500).json({ message: 'OTP 전송 중 오류가 발생했습니다.' });
        }
    }
    /**
     * OTP 검증
     * POST /api/otp/verify
     */
    static async verifyOTP(req, res) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ message: '이메일과 OTP 코드를 입력해주세요.' });
            }
            const otpRepository = database_1.AppDataSource.getRepository(OTP_1.OTP);
            const now = new Date();
            // 가장 최근 OTP 조회
            const otp = await otpRepository.findOne({
                where: {
                    email,
                    verified: false,
                },
                order: { createdAt: 'DESC' },
            });
            if (!otp) {
                return res.status(404).json({ message: '발급된 OTP가 없습니다.' });
            }
            // 만료 확인
            if (otp.expiresAt < now) {
                return res.status(400).json({
                    message: 'OTP가 만료되었습니다. 재전송 버튼을 눌러주세요.',
                    expired: true
                });
            }
            // OTP 코드 확인
            if (otp.code !== code) {
                otp.attemptCount += 1;
                otp.lastAttemptAt = now;
                await otpRepository.save(otp);
                return res.status(400).json({
                    message: 'OTP 코드가 일치하지 않습니다.',
                    attemptCount: otp.attemptCount
                });
            }
            // 검증 성공
            otp.verified = true;
            await otpRepository.save(otp);
            return res.json({
                message: 'OTP 검증이 완료되었습니다.',
                verified: true
            });
        }
        catch (error) {
            console.error('OTP 검증 오류:', error);
            return res.status(500).json({ message: 'OTP 검증 중 오류가 발생했습니다.' });
        }
    }
    /**
     * OTP 상태 확인
     * GET /api/otp/status/:email
     */
    static async getOTPStatus(req, res) {
        try {
            const { email } = req.params;
            const otpRepository = database_1.AppDataSource.getRepository(OTP_1.OTP);
            const now = new Date();
            // 최근 OTP 조회
            const recentOTP = await otpRepository.findOne({
                where: {
                    email,
                    verified: false,
                },
                order: { createdAt: 'DESC' },
            });
            if (!recentOTP) {
                return res.json({
                    hasOTP: false,
                });
            }
            return res.json({
                hasOTP: true,
                expiresAt: recentOTP.expiresAt,
                sendCount: recentOTP.sendCount,
                expired: recentOTP.expiresAt < now,
            });
        }
        catch (error) {
            console.error('OTP 상태 조회 오류:', error);
            return res.status(500).json({ message: 'OTP 상태 조회 중 오류가 발생했습니다.' });
        }
    }
}
exports.OTPController = OTPController;
//# sourceMappingURL=OTPController.js.map