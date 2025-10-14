import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getValidatedEnv } from '../config/envValidator';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    businessId: number;
    role?: string;
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

  try {
    const env = getValidatedEnv();
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: number;
      email: string;
      businessId: number;
      role?: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: '유효하지 않은 토큰입니다.'
    });
  }
};