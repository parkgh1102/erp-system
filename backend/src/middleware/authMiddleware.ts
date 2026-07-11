import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getValidatedEnv } from '../config/envValidator';
import { tokenBlacklist } from '../utils/tokenBlacklist';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    name?: string;
    role?: string;
    businessId: number;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 쿠키에서 토큰 가져오기 (우선순위: 쿠키 > Authorization 헤더)
  const token = req.cookies.authToken ||
                (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '토큰이 필요합니다.'
    });
  }

  // 로그아웃된(블랙리스트) 토큰 차단 — auth.ts와 동일하게 무효화 보장
  if (tokenBlacklist.isBlacklisted(token)) {
    return res.status(401).json({
      success: false,
      message: '로그아웃된 토큰입니다. 다시 로그인해주세요.'
    });
  }

  try {
    const env = getValidatedEnv();
    // 알고리즘 고정(HS256)으로 알고리즘 혼동 공격 방지
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as {
      userId: number;
      email: string;
      businessId: number;
      role?: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.'
    });
  }
};