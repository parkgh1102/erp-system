import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { logger } from '../utils/logger';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * 조회 전용 역할(sales_viewer)의 쓰기(생성/수정/삭제)를 서버측에서 차단.
 * JWT에는 role이 없으므로 사용자 role을 DB에서 조회한다.
 * 프론트의 isSalesViewer 가드만으로는 API 직접 호출을 막지 못하므로 서버에서 방어한다.
 * (읽기(GET)는 통과 — sales_viewer의 정상 조회는 허용)
 */
export const requireWriteRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!WRITE_METHODS.includes(req.method)) return next();

  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '사용자 인증 정보가 필요합니다.' });
    }

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
    if (user?.role === 'sales_viewer') {
      return res.status(403).json({
        success: false,
        message: '조회 전용 권한으로는 이 작업을 수행할 수 없습니다.'
      });
    }

    next();
  } catch (error) {
    logger.error('쓰기 권한 확인 오류:', error as Error);
    return res.status(500).json({ success: false, message: '권한 확인 중 오류가 발생했습니다.' });
  }
};
