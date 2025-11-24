import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ActivityLog } from '../entities/ActivityLog';
import { User } from '../entities/User';

export class ActivityLogController {
  private activityLogRepository = AppDataSource.getRepository(ActivityLog);
  private userRepository = AppDataSource.getRepository(User);

  // 활동 로그 생성
  async createLog(req: Request, res: Response): Promise<Response> {
    try {
      const { actionType, entity, entityId, description, metadata } = req.body;
      const userId = (req as any).userId;
      const businessId = (req as any).businessId;

      const log = this.activityLogRepository.create({
        actionType,
        entity,
        entityId,
        description,
        metadata,
        userId,
        businessId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      await this.activityLogRepository.save(log);

      return res.status(201).json({
        success: true,
        message: '활동 로그가 생성되었습니다.',
        data: { log }
      });
    } catch (error) {
      console.error('활동 로그 생성 오류:', error);
      return res.status(500).json({
        success: false,
        message: '활동 로그 생성에 실패했습니다.'
      });
    }
  }

  // 사용자의 활동 로그 조회
  async getUserLogs(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const { limit = 50, offset = 0 } = req.query;

      const [logs, total] = await this.activityLogRepository.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: Number(limit),
        skip: Number(offset),
        relations: ['user', 'business']
      });

      return res.status(200).json({
        success: true,
        data: {
          logs,
          total,
          limit: Number(limit),
          offset: Number(offset)
        }
      });
    } catch (error) {
      console.error('활동 로그 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '활동 로그 조회에 실패했습니다.'
      });
    }
  }

  // 최근 활동 로그 조회 (설정 페이지용)
  async getRecentLogs(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;

      const logs = await this.activityLogRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 10,
        relations: ['user', 'business']
      });

      return res.status(200).json({
        success: true,
        data: { logs }
      });
    } catch (error) {
      console.error('최근 활동 로그 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '최근 활동 로그 조회에 실패했습니다.'
      });
    }
  }

  // 비즈니스의 활동 로그 조회 (관리자용)
  async getBusinessLogs(req: Request, res: Response): Promise<Response> {
    try {
      const businessId = Number(req.params.businessId);
      const { limit = 100, offset = 0, actionType, entity } = req.query;

      const queryBuilder = this.activityLogRepository
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user')
        .where('log.businessId = :businessId', { businessId })
        .orderBy('log.createdAt', 'DESC')
        .take(Number(limit))
        .skip(Number(offset));

      if (actionType) {
        queryBuilder.andWhere('log.actionType = :actionType', { actionType });
      }

      if (entity) {
        queryBuilder.andWhere('log.entity = :entity', { entity });
      }

      const [logs, total] = await queryBuilder.getManyAndCount();

      return res.status(200).json({
        success: true,
        data: {
          logs,
          total,
          limit: Number(limit),
          offset: Number(offset)
        }
      });
    } catch (error) {
      console.error('비즈니스 활동 로그 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '비즈니스 활동 로그 조회에 실패했습니다.'
      });
    }
  }

  // 활동 로그 삭제 (관리자용)
  async deleteLog(req: Request, res: Response): Promise<Response> {
    try {
      const logId = Number(req.params.id);

      const log = await this.activityLogRepository.findOne({
        where: { id: logId }
      });

      if (!log) {
        return res.status(404).json({
          success: false,
          message: '활동 로그를 찾을 수 없습니다.'
        });
      }

      await this.activityLogRepository.remove(log);

      return res.status(200).json({
        success: true,
        message: '활동 로그가 삭제되었습니다.'
      });
    } catch (error) {
      console.error('활동 로그 삭제 오류:', error);
      return res.status(500).json({
        success: false,
        message: '활동 로그 삭제에 실패했습니다.'
      });
    }
  }
}

// 활동 로그 기록 헬퍼 함수
export const logActivity = async (
  actionType: string,
  entity: string,
  entityId: number | undefined,
  description: string,
  req: Request,
  metadata?: any
) => {
  try {
    const activityLogRepository = AppDataSource.getRepository(ActivityLog);
    const userId = (req as any).userId;
    const businessId = (req as any).businessId;

    const log = activityLogRepository.create({
      actionType,
      entity,
      entityId,
      description,
      metadata,
      userId,
      businessId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    await activityLogRepository.save(log);
  } catch (error) {
    console.error('활동 로그 기록 오류:', error);
  }
};
