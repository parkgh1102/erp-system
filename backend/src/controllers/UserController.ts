import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { UserBusinessAccess } from '../entities/UserBusinessAccess';
import { Business } from '../entities/Business';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { logger } from '../utils/logger';
import { passwordSchema } from '../utils/passwordValidator';

const userRepository = AppDataSource.getRepository(User);
const accessRepository = AppDataSource.getRepository(UserBusinessAccess);
const businessRepository = AppDataSource.getRepository(Business);

// 요청자(admin)가 소유한 사업체 id 집합
async function getOwnedBusinessIds(requesterUserId: number): Promise<Set<number>> {
  const owned = await businessRepository.find({
    where: { userId: requesterUserId, isActive: true },
    select: ['id']
  });
  return new Set(owned.map(b => b.id));
}

// 대상 사용자가 해당 사업체에 속하는지 (직접 소속 또는 접근권한 보유) 확인
async function userBelongsToBusiness(targetUserId: number, businessId: number): Promise<boolean> {
  const target = await userRepository.findOne({ where: { id: targetUserId } });
  if (target?.businessId === businessId) return true;
  const access = await accessRepository.findOne({ where: { userId: targetUserId, businessId } });
  return !!access;
}

const createUserSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().pattern(/^\d{4}$/).required().messages({
    'string.pattern.base': '비밀번호는 숫자 4자리여야 합니다.'
  }),
  name: Joi.string().min(1).required(),
  role: Joi.string().valid('admin', 'sales_viewer').required(),
  businessId: Joi.number().optional(),
  businessIds: Joi.array().items(Joi.number()).optional() // 다중 사업자 접근
}).unknown(true);

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  name: Joi.string().min(2).optional(),
  phone: Joi.string().pattern(/^[0-9-+\s()]+$/).allow('').optional(),
  password: Joi.string().pattern(/^\d{4}$/).allow('', null).optional().messages({
    'string.pattern.base': '비밀번호는 숫자 4자리여야 합니다.'
  }),
  role: Joi.string().valid('admin', 'sales_viewer').optional(),
  businessId: Joi.number().optional(),
  businessIds: Joi.array().items(Joi.number()).optional(),
  isActive: Joi.boolean().optional()
});

export const UserController = {
  // 사업자별 사용자 목록 조회
  async getUsers(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);

      // 해당 사업자에 접근 가능한 사용자 조회
      const accessList = await accessRepository.find({
        where: { businessId },
        relations: ['user']
      });

      // 기존 방식 (businessId로 직접 연결된 사용자) 도 포함
      const directUsers = await userRepository.find({
        where: { businessId },
        select: ['id', 'email', 'name', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt']
      });

      // 중복 제거하여 합치기
      const userMap = new Map();
      for (const user of directUsers) {
        userMap.set(user.id, user);
      }
      for (const access of accessList) {
        if (access.user && !userMap.has(access.user.id)) {
          const { password, ...userWithoutPassword } = access.user;
          userMap.set(access.user.id, userWithoutPassword);
        }
      }

      // 각 사용자의 접근 가능한 사업자 목록 조회
      const usersWithAccess = await Promise.all(
        Array.from(userMap.values()).map(async (user) => {
          const userAccess = await accessRepository.find({
            where: { userId: user.id },
            relations: ['business']
          });
          return {
            ...user,
            businessIds: userAccess.map(a => a.businessId),
            businesses: userAccess.map(a => ({ id: a.business?.id, companyName: a.business?.companyName }))
          };
        })
      );

      res.json({
        success: true,
        data: usersWithAccess
      });
    } catch (error: unknown) {
      logger.error('Get users error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '사용자 목록 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 사용자 생성
  async createUser(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);
      const { error, value } = createUserSchema.validate(req.body);

      if (error) {
        logger.warn('User create validation error', { errors: error.details.map(d => d.message) });
        return res.status(400).json({
          success: false,
          message: error.details.map(detail => detail.message).join(', '),
          errors: error.details.map(detail => detail.message)
        });
      }

      const { password, name, phone, role, businessIds } = value;

      // 전화번호 중복 체크
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const users = await userRepository.find();
      const existingUser = users.find(u => u.phone && u.phone.replace(/[^0-9]/g, '') === cleanPhone);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '이미 사용 중인 전화번호입니다.'
        });
      }

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 10);

      // 사용자 생성 (전화번호를 이메일로 사용)
      const user = userRepository.create({
        email: `${cleanPhone}@phone.local`,
        password: hashedPassword,
        name,
        phone,
        role,
        businessId,
        isActive: true
      });

      const savedUser = await userRepository.save(user);

      // 다중 사업자 접근 권한 설정 — 요청자(admin)가 소유한 사업체로만 제한 (권한 상승 차단)
      const requesterId = (req as any).user?.userId;
      const ownedIds = await getOwnedBusinessIds(requesterId);
      const requestedIds: number[] = businessIds && businessIds.length > 0 ? businessIds : [businessId];
      let accessBusinessIds = requestedIds.filter((id: number) => ownedIds.has(id));
      if (accessBusinessIds.length === 0) accessBusinessIds = [businessId]; // 최소 현재 사업체
      for (const bizId of accessBusinessIds) {
        const access = accessRepository.create({
          userId: savedUser.id,
          businessId: bizId
        });
        await accessRepository.save(access);
      }

      // 비밀번호 제외하고 반환
      const { password: _, ...userWithoutPassword } = savedUser;

      res.status(201).json({
        success: true,
        data: { ...userWithoutPassword, businessIds: accessBusinessIds },
        message: '사용자가 생성되었습니다.'
      });
    } catch (error: unknown) {
      logger.error('Create user error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '사용자 생성 중 오류가 발생했습니다.'
      });
    }
  },

  // 사용자 수정
  async updateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const { error, value } = updateUserSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 정보를 확인해주세요.',
          errors: error.details.map(detail => detail.message)
        });
      }

      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 대상 사용자가 요청자의 사업체에 속하는지 확인 (타 사업체 사용자 수정 차단)
      const reqBusinessId = parseInt(req.params.businessId);
      if (!(await userBelongsToBusiness(userId, reqBusinessId))) {
        return res.status(403).json({
          success: false,
          message: '이 사용자를 수정할 권한이 없습니다.'
        });
      }

      // 이메일 변경 시 중복 체크
      if (value.email && value.email !== user.email) {
        const existingUser = await userRepository.findOne({ where: { email: value.email } });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: '이미 사용 중인 이메일입니다.'
          });
        }
      }

      // businessIds가 있으면 접근 권한 업데이트 — 요청자가 소유한 사업체로만 제한
      if (value.businessIds) {
        const requesterId = (req as any).user?.userId;
        const ownedIds = await getOwnedBusinessIds(requesterId);
        const filtered: number[] = value.businessIds.filter((id: number) => ownedIds.has(id));
        // 요청자 소유 사업체에 대한 기존 접근만 제거 후 재설정 (타 admin 이 부여한 접근은 보존)
        for (const ownedId of ownedIds) {
          await accessRepository.delete({ userId, businessId: ownedId });
        }
        for (const bizId of filtered) {
          await accessRepository.save(accessRepository.create({ userId, businessId: bizId }));
        }
        delete value.businessIds; // User 엔티티에는 저장하지 않음
      }

      // 비밀번호가 있으면 해싱, 빈 문자열이면 제거
      if (value.password && value.password.trim()) {
        value.password = await bcrypt.hash(value.password, 10);
      } else {
        delete value.password;
      }

      // 사용자 정보 업데이트
      Object.assign(user, value);
      const updatedUser = await userRepository.save(user);

      // 접근 가능한 사업자 목록 조회
      const userAccess = await accessRepository.find({
        where: { userId },
        relations: ['business']
      });

      // 비밀번호 제외하고 반환
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        success: true,
        data: {
          ...userWithoutPassword,
          businessIds: userAccess.map(a => a.businessId),
          businesses: userAccess.map(a => ({ id: a.business?.id, companyName: a.business?.companyName }))
        },
        message: '사용자 정보가 수정되었습니다.'
      });
    } catch (error: unknown) {
      logger.error('Update user error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '사용자 수정 중 오류가 발생했습니다.'
      });
    }
  },

  // 사용자 삭제
  async deleteUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);

      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 대상 사용자가 요청자의 사업체에 속하는지 확인
      if (!(await userBelongsToBusiness(userId, parseInt(req.params.businessId)))) {
        return res.status(403).json({
          success: false,
          message: '이 사용자를 삭제할 권한이 없습니다.'
        });
      }

      await userRepository.remove(user);

      res.json({
        success: true,
        message: '사용자가 삭제되었습니다.'
      });
    } catch (error: unknown) {
      logger.error('Delete user error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '사용자 삭제 중 오류가 발생했습니다.'
      });
    }
  },

  // 사용자 비활성화/활성화
  async toggleUserStatus(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);

      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 대상 사용자가 요청자의 사업체에 속하는지 확인
      if (!(await userBelongsToBusiness(userId, parseInt(req.params.businessId)))) {
        return res.status(403).json({
          success: false,
          message: '이 사용자를 변경할 권한이 없습니다.'
        });
      }

      user.isActive = !user.isActive;
      const updatedUser = await userRepository.save(user);

      // 비밀번호 제외하고 반환
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        success: true,
        data: userWithoutPassword,
        message: `사용자가 ${user.isActive ? '활성화' : '비활성화'}되었습니다.`
      });
    } catch (error: unknown) {
      logger.error('Toggle user status error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '사용자 상태 변경 중 오류가 발생했습니다.'
      });
    }
  }
};
