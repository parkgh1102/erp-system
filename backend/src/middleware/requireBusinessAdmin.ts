import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { AppDataSource } from '../config/database';
import { Business } from '../entities/Business';
import { User } from '../entities/User';
import { logger } from '../utils/logger';

/**
 * 사업체 관리자(소유자) 전용 미들웨어.
 * 사용자 관리 등 admin 권한이 필요한 작업에 사용한다.
 * - 인증된 사용자가 role === 'admin' 이어야 하고
 * - 해당 :businessId 사업체의 소유자(business.userId === userId)여야 한다.
 * sales_viewer 등은 거부된다. (businessAccessMiddleware 와 달리 소유 admin 만 통과)
 */
export const requireBusinessAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.params.businessId || req.params.id;
    const userId = req.user?.userId;

    if (!businessId) {
      return res.status(400).json({ success: false, message: '필수 파라미터가 누락되었습니다.' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: '사용자 인증 정보가 필요합니다.' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const businessRepository = AppDataSource.getRepository(Business);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '이 작업을 수행할 권한이 없습니다.' });
    }

    // 소유한 사업체인지 확인
    const business = await businessRepository.findOne({
      where: { id: Number(businessId), userId, isActive: true }
    });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: '사업자를 찾을 수 없거나 접근 권한이 없습니다.'
      });
    }

    next();
  } catch (error) {
    logger.error('사업체 관리자 권한 확인 오류:', error as Error);
    return res.status(500).json({ success: false, message: '권한 확인 중 오류가 발생했습니다.' });
  }
};
