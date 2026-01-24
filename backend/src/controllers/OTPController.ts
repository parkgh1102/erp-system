import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { OTP } from '../entities/OTP';
import { User } from '../entities/User';
import { AlimtalkService } from '../services/AlimtalkService';
import { LessThan, MoreThan } from 'typeorm';

export class OTPController {
  /**
   * OTP 전송 요청
   * POST /api/otp/send
   */
  static async sendOTP(req: Request, res: Response) {
    try {
      const { email, phone } = req.body;

      if (!email && !phone) {
        return res.status(400).json({ message: '이메일 또는 전화번호를 입력해주세요.' });
      }

      // 사용자 확인 (이메일 또는 전화번호로 조회)
      const userRepository = AppDataSource.getRepository(User);
      let user: User | null = null;

      if (email) {
        user = await userRepository.findOne({ where: { email } });
      } else if (phone) {
        // 전화번호 정규화 후 검색
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        user = await userRepository
          .createQueryBuilder('user')
          .where('REPLACE(REPLACE(REPLACE(user.phone, \'-\', \'\'), \' \', \'\'), \'.\', \'\') = :phone', { phone: cleanPhone })
          .getOne();
      }

      if (!user) {
        return res.status(404).json({ message: '존재하지 않는 사용자입니다.' });
      }

      if (!user.phone) {
        return res.status(400).json({ message: '등록된 전화번호가 없습니다.' });
      }

      const otpRepository = AppDataSource.getRepository(OTP);
      const now = new Date();

      // 최근 OTP 조회 (사용자 이메일 기준)
      const recentOTP = await otpRepository.findOne({
        where: {
          email: user.email,
          verified: false,
        },
        order: { createdAt: 'DESC' },
      });

      // 새 OTP 생성
      const otpCode = AlimtalkService.generateOTP();
      const expiresAt = new Date(now.getTime() + 60 * 1000); // 1분 후 만료

      let otp: OTP;

      if (recentOTP && !recentOTP.verified) {
        // 기존 OTP 업데이트 (재전송)
        recentOTP.code = otpCode;
        recentOTP.expiresAt = expiresAt;
        recentOTP.sendCount += 1;
        recentOTP.attemptCount = 0; // 검증 시도 횟수 초기화
        otp = await otpRepository.save(recentOTP);
      } else {
        // 새 OTP 생성
        otp = otpRepository.create({
          email: user.email,
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
      const sent = await AlimtalkService.sendOTP(user.phone, otpCode);

      if (!sent) {
        console.error('알림톡 전송 실패');
        return res.status(500).json({ message: 'OTP 전송에 실패했습니다.' });
      }

      return res.json({
        message: 'OTP가 전송되었습니다.',
        expiresAt: otp.expiresAt,
        sendCount: otp.sendCount,
      });
    } catch (error) {
      console.error('OTP 전송 오류:', error);
      return res.status(500).json({ message: 'OTP 전송 중 오류가 발생했습니다.' });
    }
  }

  /**
   * OTP 검증
   * POST /api/otp/verify
   */
  static async verifyOTP(req: Request, res: Response) {
    try {
      const { email, phone, code } = req.body;

      if ((!email && !phone) || !code) {
        return res.status(400).json({ message: '이메일(또는 전화번호)과 OTP 코드를 입력해주세요.' });
      }

      const otpRepository = AppDataSource.getRepository(OTP);
      const userRepository = AppDataSource.getRepository(User);
      const now = new Date();

      // 사용자 조회 (이메일 또는 전화번호로)
      let userEmail = email;
      if (!userEmail && phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const user = await userRepository
          .createQueryBuilder('user')
          .where('REPLACE(REPLACE(REPLACE(user.phone, \'-\', \'\'), \' \', \'\'), \'.\', \'\') = :phone', { phone: cleanPhone })
          .getOne();
        if (user) {
          userEmail = user.email;
        }
      }

      if (!userEmail) {
        return res.status(404).json({ message: '존재하지 않는 사용자입니다.' });
      }

      // 가장 최근 OTP 조회
      const otp = await otpRepository.findOne({
        where: {
          email: userEmail,
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
    } catch (error) {
      console.error('OTP 검증 오류:', error);
      return res.status(500).json({ message: 'OTP 검증 중 오류가 발생했습니다.' });
    }
  }

  /**
   * OTP 상태 확인
   * GET /api/otp/status/:email
   */
  static async getOTPStatus(req: Request, res: Response) {
    try {
      const { email } = req.params;

      const otpRepository = AppDataSource.getRepository(OTP);
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
    } catch (error) {
      console.error('OTP 상태 조회 오류:', error);
      return res.status(500).json({ message: 'OTP 상태 조회 중 오류가 발생했습니다.' });
    }
  }
}
