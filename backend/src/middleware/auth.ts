import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { getValidatedEnv } from '../config/envValidator';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.split(' ')[1];

  // Authorization 헤더에 토큰이 없으면 쿠키에서 확인
  if (!token) {
    token = req.cookies?.authToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '토큰이 필요합니다.'
    });
  }

  try {
    const env = getValidatedEnv();
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      businessId: decoded.businessId || 0
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다.'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: '토큰 검증에 실패했습니다.'
      });
    }
  }
};