import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Business } from '../entities/Business';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { securityLogger } from '../middleware/securityLogger';
import { passwordSchema, changePasswordSchema } from '../utils/passwordValidator';
import { logger } from '../utils/logger';
import { getValidatedEnv } from '../config/envValidator';
import { JwtPayload } from '../types';
import fs from 'fs';
import path from 'path';

const userRepository = AppDataSource.getRepository(User);
const businessRepository = AppDataSource.getRepository(Business);

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordSchema.required(),
  name: Joi.string().min(2).required(),
  phone: Joi.string().pattern(/^[0-9-+\s()]+$/).allow(''),
  businessInfo: Joi.object({
    businessNumber: Joi.string().pattern(/^\d{3}-\d{2}-\d{5}$/).required(),
    companyName: Joi.string().min(1).max(200).required(),
    representative: Joi.string().min(1).max(100).required(),
    businessType: Joi.string().max(100).allow(''),
    businessItem: Joi.string().max(100).allow(''),
    address: Joi.string().max(500).allow(''),
    phone: Joi.string().pattern(/^[0-9-+\s()]+$/).max(20).allow(''),
    fax: Joi.string().pattern(/^[0-9-+\s()]+$/).max(20).allow('')
  }).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const AuthController = {
  async signup(req: Request, res: Response) {
    try {
      logger.info('Signup request received');

      const { error, value } = signupSchema.validate(req.body);
      if (error) {
        logger.warn('Signup validation failed', { errorCount: error.details.length });
        return res.status(400).json({
          success: false,
          message: '입력 정보를 확인해주세요.',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { email, password, name, phone, businessInfo } = value;

      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '이미 사용 중인 이메일입니다.'
        });
      }

      const existingBusiness = await businessRepository.findOne({
        where: { businessNumber: businessInfo.businessNumber.replace(/-/g, '') }
      });
      if (existingBusiness) {
        return res.status(409).json({
          success: false,
          message: '이미 등록된 사업자번호입니다.'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = userRepository.create({
        email,
        password: hashedPassword,
        name,
        phone
      });

      const savedUser = await userRepository.save(user);

      const business = businessRepository.create({
        userId: savedUser.id,
        businessNumber: businessInfo.businessNumber.replace(/-/g, ''),
        companyName: businessInfo.companyName,
        representative: businessInfo.representative,
        businessType: businessInfo.businessType,
        businessItem: businessInfo.businessItem,
        address: businessInfo.address,
        phone: businessInfo.phone,
        fax: businessInfo.fax
      });

      await businessRepository.save(business);

      const env = getValidatedEnv();
      const token = jwt.sign(
        { userId: savedUser.id, email: savedUser.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: savedUser.id, email: savedUser.email, type: 'refresh' },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
      );

      logger.info('Signup completed successfully');

      // HttpOnly 쿠키로 토큰 설정
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000 // 15분
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
      });

      res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: {
          token,
          user: {
            id: savedUser.id,
            email: savedUser.email,
            name: savedUser.name,
            phone: savedUser.phone
          }
        }
      });
    } catch (error: unknown) {
      logger.error('Signup error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '회원가입 중 오류가 발생했습니다.'
      });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '이메일과 비밀번호를 입력해주세요.'
        });
      }

      const { email, password } = value;

      const user = await userRepository.findOne({
        where: { email, isActive: true },
        relations: ['businesses']
      });

      if (!user) {
        securityLogger.logAuthFailure(req, 'Login failed: User not found', { email });
        return res.status(401).json({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        securityLogger.logAuthFailure(req, 'Login failed: Invalid password', { email, userId: user.id });
        return res.status(401).json({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // 로그인 성공 로깅
      securityLogger.logAuthSuccess(req, user.id);

      const env = getValidatedEnv();
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'refresh' },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
      );

      // HttpOnly 쿠키로 토큰 설정
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000 // 15분
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
      });

      res.json({
        success: true,
        message: '로그인되었습니다.',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            businesses: user.businesses
          }
        }
      });
    } catch (error: unknown) {
      logger.error('Login error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '로그인 중 오류가 발생했습니다.'
      });
    }
  },

  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['businesses']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar ? `/uploads/avatars/${user.avatar}` : null,
          businesses: user.businesses
        }
      });
    } catch (error: unknown) {
      logger.error('Get profile error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '프로필 조회 중 오류가 발생했습니다.'
      });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { name, phone } = req.body;

      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      user.name = name || user.name;
      user.phone = phone || user.phone;

      await userRepository.save(user);

      res.json({
        success: true,
        message: '프로필이 업데이트되었습니다.',
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone
        }
      });
    } catch (error: unknown) {
      logger.error('Update profile error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '프로필 업데이트 중 오류가 발생했습니다.'
      });
    }
  },

  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      // Joi 스키마로 검증
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { currentPassword, newPassword } = value;

      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: '현재 비밀번호가 올바르지 않습니다.'
        });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedNewPassword;

      await userRepository.save(user);

      res.json({
        success: true,
        message: '비밀번호가 변경되었습니다.'
      });
    } catch (error: unknown) {
      logger.error('Change password error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '비밀번호 변경 중 오류가 발생했습니다.'
      });
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: '리프레시 토큰이 필요합니다.'
        });
      }

      const env = getValidatedEnv();
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload & { type: string };

      if (decoded.type !== 'refresh') {
        return res.status(403).json({
          success: false,
          message: '유효하지 않은 리프레시 토큰입니다.'
        });
      }

      const user = await userRepository.findOne({
        where: { id: decoded.userId, isActive: true }
      });

      if (!user) {
        return res.status(403).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'refresh' },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
      );

      // HttpOnly 쿠키로 새 토큰 설정
      res.cookie('authToken', newToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000 // 15분
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
      });

      res.json({
        success: true,
        message: '토큰이 갱신되었습니다.'
      });
    } catch (error: unknown) {
      logger.error('Refresh token error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(403).json({
        success: false,
        message: '토큰 갱신에 실패했습니다.'
      });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      // 쿠키 삭제
      res.clearCookie('authToken');
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: '로그아웃되었습니다.'
      });
    } catch (error: unknown) {
      logger.error('Logout error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '로그아웃 중 오류가 발생했습니다.'
      });
    }
  },

  async checkEmailAvailability(req: Request, res: Response) {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: '이메일을 입력해주세요.'
        });
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '올바른 이메일 형식이 아닙니다.',
          available: false
        });
      }

      const existingUser = await userRepository.findOne({ where: { email } });

      const isAvailable = !existingUser;

      res.json({
        success: true,
        available: isAvailable,
        message: isAvailable ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.'
      });
    } catch (error: unknown) {
      logger.error('Email availability check error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '이메일 중복 확인 중 오류가 발생했습니다.',
        available: false
      });
    }
  },

  async uploadAvatar(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: '이미지 파일을 선택해주세요.'
        });
      }

      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 기존 아바타 파일 삭제 (선택사항)
      if (user.avatar) {
        const oldFilePath = path.join(__dirname, '../../uploads/avatars', user.avatar);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // 파일명만 저장 (경로는 제외)
      user.avatar = file.filename;
      await userRepository.save(user);

      const avatarUrl = `/uploads/avatars/${file.filename}`;

      res.json({
        success: true,
        message: '프로필 사진이 업데이트되었습니다.',
        data: {
          avatar: avatarUrl
        }
      });
    } catch (error: unknown) {
      logger.error('Avatar upload error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '프로필 사진 업로드 중 오류가 발생했습니다.'
      });
    }
  },

  // 아이디 찾기
  async findUsername(req: Request, res: Response) {
    try {
      const { companyName, businessNumber, phone } = req.body;

      if (!companyName || !businessNumber) {
        return res.status(400).json({
          success: false,
          message: '회사명과 사업자등록번호를 입력해주세요.'
        });
      }

      // 사업자 정보로 사업체 찾기
      const cleanedBusinessNumber = businessNumber.replace(/[^0-9]/g, '');
      const cleanedPhone = phone ? phone.replace(/[^0-9]/g, '') : null;

      // 먼저 회사명과 사업자번호로 검색
      const businesses = await businessRepository.find({
        where: {
          companyName,
          businessNumber: cleanedBusinessNumber
        },
        relations: ['user']
      });

      if (businesses.length === 0) {
        return res.status(404).json({
          success: false,
          message: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
        });
      }

      // 전화번호가 제공된 경우 추가 필터링
      let business = businesses[0];
      if (cleanedPhone && businesses.length > 1) {
        const matchedBusiness = businesses.find(b =>
          b.phone && b.phone.replace(/[^0-9]/g, '') === cleanedPhone
        );
        if (matchedBusiness) {
          business = matchedBusiness;
        }
      }

      if (!business) {
        return res.status(404).json({
          success: false,
          message: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
        });
      }

      // 이메일 일부 마스킹 (보안)
      const email = business.user.email;
      const [localPart, domain] = email.split('@');
      const maskedEmail = localPart.length > 3
        ? localPart.substring(0, 3) + '***@' + domain
        : localPart.substring(0, 1) + '***@' + domain;

      logger.info('Username found successfully');

      res.json({
        success: true,
        data: {
          email: maskedEmail,
          fullEmail: email,
          name: business.user.name
        }
      });
    } catch (error: unknown) {
      logger.error('Find username error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '아이디 찾기 중 오류가 발생했습니다.'
      });
    }
  },

  // 비밀번호 재설정을 위한 정보 확인
  async verifyPasswordReset(req: Request, res: Response) {
    try {
      const { email, companyName, businessNumber, phone } = req.body;

      logger.info('Password reset verification request', { email, companyName, businessNumber, hasPhone: !!phone });

      if (!email || !companyName || !businessNumber) {
        return res.status(400).json({
          success: false,
          message: '이메일, 회사명, 사업자등록번호를 입력해주세요.'
        });
      }

      // 사용자 찾기
      const user = await userRepository.findOne({
        where: { email },
        relations: ['businesses']
      });

      if (!user) {
        logger.warn('User not found for password reset', { email });
        return res.status(404).json({
          success: false,
          message: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
        });
      }

      logger.info('User found, checking businesses', {
        userId: user.id,
        businessCount: user.businesses.length,
        businesses: user.businesses.map(b => ({
          companyName: b.companyName,
          businessNumber: b.businessNumber
        }))
      });

      // 사업자 정보 확인
      const cleanedBusinessNumber = businessNumber.replace(/[^0-9]/g, '');
      const cleanedPhone = phone ? phone.replace(/[^0-9]/g, '') : null;

      const business = user.businesses.find(b => {
        const businessMatches = b.companyName === companyName &&
                               b.businessNumber === cleanedBusinessNumber;

        // 전화번호가 제공된 경우 전화번호도 확인
        if (cleanedPhone && b.phone) {
          return businessMatches && b.phone.replace(/[^0-9]/g, '') === cleanedPhone;
        }

        return businessMatches;
      });

      if (!business) {
        logger.warn('Business not matched for password reset', {
          email,
          companyName,
          businessNumber: cleanedBusinessNumber,
          phone: cleanedPhone
        });
        return res.status(404).json({
          success: false,
          message: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
        });
      }

      // 임시 토큰 생성 (5분 유효)
      const env = getValidatedEnv();
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      logger.info('Password reset verified successfully', { userId: user.id });

      res.json({
        success: true,
        data: {
          resetToken,
          email: user.email
        }
      });
    } catch (error: unknown) {
      logger.error('Verify password reset error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '비밀번호 찾기 중 오류가 발생했습니다.'
      });
    }
  },

  // 비밀번호 재설정
  async resetPassword(req: Request, res: Response) {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '필수 정보가 누락되었습니다.'
        });
      }

      // 비밀번호 유효성 검사
      const { error } = passwordSchema.validate(newPassword);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // 토큰 검증
      const env = getValidatedEnv();
      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(resetToken, env.JWT_SECRET) as JwtPayload;
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: '유효하지 않거나 만료된 토큰입니다.'
        });
      }

      // 사용자 찾기
      const user = await userRepository.findOne({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 새 비밀번호 해시화 및 저장
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await userRepository.save(user);

      securityLogger.logPasswordReset(user.id, user.email);
      logger.info('Password reset successfully', { userId: user.id });

      res.json({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.'
      });
    } catch (error: unknown) {
      logger.error('Reset password error occurred', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '비밀번호 재설정 중 오류가 발생했습니다.'
      });
    }
  }
};