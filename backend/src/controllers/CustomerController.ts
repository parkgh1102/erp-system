import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Customer } from '../entities/Customer';
import { Business } from '../entities/Business';
import { User } from '../entities/User';
import { logger } from '../utils/logger';
import Joi from 'joi';

const customerRepository = AppDataSource.getRepository(Customer);
const businessRepository = AppDataSource.getRepository(Business);
const userRepository = AppDataSource.getRepository(User);

const customerSchema = Joi.object({
  customerCode: Joi.string().max(50).allow('', null).optional(),
  name: Joi.string().min(1).max(200).required(),
  businessNumber: Joi.string().allow('', null).optional().custom((value, helpers) => {
    if (!value) return value;
    const cleaned = value.replace(/-/g, '');
    if (!/^\d{10}$/.test(cleaned)) {
      return helpers.error('any.invalid');
    }
    return cleaned;
  }),
  customerType: Joi.string().valid('매출처', '매입처', '기타', 'sales', 'purchase', 'other').default('기타'),
  phone: Joi.string().max(20).allow('', null).optional(),
  email: Joi.string().email().max(100).allow('', null).optional(),
  address: Joi.string().max(500).allow('', null).optional(),
  representative: Joi.string().max(100).allow('', null).optional(),
  // 추가 필드들 (엔티티에 없지만 프론트엔드에서 전송되는 필드들 - 무시됨)
  fax: Joi.string().max(20).allow('', null).optional(),
  managerContact: Joi.string().max(100).allow('', null).optional(),
  businessType: Joi.string().max(100).allow('', null).optional(),
  businessItem: Joi.string().max(100).allow('', null).optional(),
  memo: Joi.string().max(500).allow('', null).optional()
}).options({ stripUnknown: true });

export const CustomerController = {
  async create(req: Request, res: Response) {
    try {
      const { error, value } = customerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 정보를 확인해주세요.',
          errors: error.details.map(detail => detail.message)
        });
      }

      const userId = req.user?.userId;
      const { businessId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // 역할에 따른 business 접근 권한 체크
      let business;
      if (user.role === 'admin') {
        // admin은 business 소유자여야 함
        business = await businessRepository.findOne({
          where: {
            id: parseInt(businessId),
            userId
          }
        });
      } else if (user.role === 'sales_viewer') {
        // sales_viewer는 businessId로 할당된 business에 접근 가능
        if (user.businessId === parseInt(businessId)) {
          business = await businessRepository.findOne({
            where: { id: parseInt(businessId) }
          });
        }
      }

      if (!business) {
        return res.status(404).json({
          success: false,
          message: '사업자 정보를 찾을 수 없습니다.'
        });
      }

      // customerCode 자동 생성
      const maxCustomerCode = await customerRepository.createQueryBuilder('customer')
        .select('MAX(CAST(SUBSTRING(customer.customerCode, 2) AS INTEGER))', 'maxCode')
        .where('customer.businessId = :businessId', { businessId: business.id })
        .andWhere('customer.customerCode LIKE :pattern', { pattern: 'C%' })
        .getRawOne();

      const nextNumber = (maxCustomerCode.maxCode || 0) + 1;
      const customerCode = `C${nextNumber.toString().padStart(4, '0')}`;

      if (value.businessNumber) {
        const existingCustomer = await customerRepository.findOne({
          where: {
            businessNumber: value.businessNumber,
            businessId: business.id,
            isActive: true
          }
        });

        if (existingCustomer) {
          return res.status(409).json({
            success: false,
            message: '이미 등록된 사업자번호입니다.'
          });
        }
      }

      const customer = customerRepository.create({
        ...value,
        customerCode,
        businessId: business.id
      });

      const savedCustomer = await customerRepository.save(customer);

      res.status(201).json({
        success: true,
        message: '거래처가 등록되었습니다.',
        data: savedCustomer
      });
    } catch (error) {
      logger.error('Create customer error:', error as Error);
      res.status(500).json({
        success: false,
        message: '거래처 등록 중 오류가 발생했습니다.'
      });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { businessId } = req.params;
      const { page = 1, limit = 10, search, type, sortField, sortOrder } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // 역할에 따른 business 접근 권한 체크
      let business;
      if (user.role === 'admin') {
        // admin은 business 소유자여야 함
        business = await businessRepository.findOne({
          where: {
            id: parseInt(businessId),
            userId
          }
        });
      } else if (user.role === 'sales_viewer') {
        // sales_viewer는 businessId로 할당된 business에 접근 가능
        if (user.businessId === parseInt(businessId)) {
          business = await businessRepository.findOne({
            where: { id: parseInt(businessId) }
          });
        }
      }

      if (!business) {
        return res.status(404).json({
          success: false,
          message: '사업자 정보를 찾을 수 없습니다.'
        });
      }

      const queryBuilder = customerRepository.createQueryBuilder('customer')
        .where('customer.businessId = :businessId', { businessId })
        .andWhere('customer.isActive = :isActive', { isActive: true });

      if (search) {
        queryBuilder.andWhere(
          '(customer.name LIKE :search OR customer.businessNumber LIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (type) {
        queryBuilder.andWhere('customer.customerType = :type', { type });
      }

      // 정렬 처리
      if (sortField && sortOrder) {
        const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
        queryBuilder.orderBy(`customer.${sortField}`, orderDirection as 'ASC' | 'DESC');
      } else {
        queryBuilder.orderBy('customer.createdAt', 'DESC');
      }

      const [customers, total] = await queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get customers error:', error as Error);
      res.status(500).json({
        success: false,
        message: '거래처 목록 조회 중 오류가 발생했습니다.'
      });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { businessId, id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // 역할에 따른 business 접근 권한 체크
      let business;
      if (user.role === 'admin') {
        // admin은 business 소유자여야 함
        business = await businessRepository.findOne({
          where: {
            id: parseInt(businessId),
            userId
          }
        });
      } else if (user.role === 'sales_viewer') {
        // sales_viewer는 businessId로 할당된 business에 접근 가능
        if (user.businessId === parseInt(businessId)) {
          business = await businessRepository.findOne({
            where: { id: parseInt(businessId) }
          });
        }
      }

      if (!business) {
        return res.status(404).json({
          success: false,
          message: '사업자 정보를 찾을 수 없습니다.'
        });
      }

      const customer = await customerRepository.findOne({
        where: { id: parseInt(id), businessId: business.id, isActive: true }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: '거래처를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      logger.error('Get customer error:', error as Error);
      res.status(500).json({
        success: false,
        message: '거래처 조회 중 오류가 발생했습니다.'
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { error, value } = customerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 정보를 확인해주세요.',
          errors: error.details.map(detail => detail.message)
        });
      }

      const userId = req.user?.userId;
      const { businessId, id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // 역할에 따른 business 접근 권한 체크
      let business;
      if (user.role === 'admin') {
        // admin은 business 소유자여야 함
        business = await businessRepository.findOne({
          where: {
            id: parseInt(businessId),
            userId
          }
        });
      } else if (user.role === 'sales_viewer') {
        // sales_viewer는 businessId로 할당된 business에 접근 가능
        if (user.businessId === parseInt(businessId)) {
          business = await businessRepository.findOne({
            where: { id: parseInt(businessId) }
          });
        }
      }

      if (!business) {
        return res.status(404).json({
          success: false,
          message: '사업자 정보를 찾을 수 없습니다.'
        });
      }

      const customer = await customerRepository.findOne({
        where: { id: parseInt(id), businessId: business.id, isActive: true }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: '거래처를 찾을 수 없습니다.'
        });
      }

      if (value.businessNumber) {
        if (value.businessNumber !== customer.businessNumber) {
          const existingCustomer = await customerRepository.findOne({
            where: {
              businessNumber: value.businessNumber,
              businessId: business.id,
              isActive: true
            }
          });

          if (existingCustomer) {
            return res.status(409).json({
              success: false,
              message: '이미 등록된 사업자번호입니다.'
            });
          }
        }
      }

      Object.assign(customer, value);
      const updatedCustomer = await customerRepository.save(customer);

      res.json({
        success: true,
        message: '거래처가 수정되었습니다.',
        data: updatedCustomer
      });
    } catch (error) {
      logger.error('Update customer error:', error as Error);
      res.status(500).json({
        success: false,
        message: '거래처 수정 중 오류가 발생했습니다.'
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { businessId, id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // 역할에 따른 business 접근 권한 체크
      let business;
      if (user.role === 'admin') {
        // admin은 business 소유자여야 함
        business = await businessRepository.findOne({
          where: {
            id: parseInt(businessId),
            userId
          }
        });
      } else if (user.role === 'sales_viewer') {
        // sales_viewer는 businessId로 할당된 business에 접근 가능
        if (user.businessId === parseInt(businessId)) {
          business = await businessRepository.findOne({
            where: { id: parseInt(businessId) }
          });
        }
      }

      if (!business) {
        return res.status(404).json({
          success: false,
          message: '사업자 정보를 찾을 수 없습니다.'
        });
      }

      const customer = await customerRepository.findOne({
        where: { id: parseInt(id), businessId: business.id, isActive: true }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: '거래처를 찾을 수 없습니다.'
        });
      }

      customer.isActive = false;
      await customerRepository.save(customer);

      res.json({
        success: true,
        message: '거래처가 삭제되었습니다.'
      });
    } catch (error) {
      logger.error('Delete customer error:', error as Error);
      res.status(500).json({
        success: false,
        message: '거래처 삭제 중 오류가 발생했습니다.'
      });
    }
  },

  async deleteAll(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { businessId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // admin만 전체 삭제 가능
      if (user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '권한이 없습니다.' });
      }

      // business 소유자 확인
      const business = await businessRepository.findOne({
        where: {
          id: parseInt(businessId),
          userId
        }
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: '사업자 정보를 찾을 수 없습니다.'
        });
      }

      // 해당 business의 모든 거래처 삭제
      const result = await customerRepository.delete({ businessId: business.id });

      res.json({
        success: true,
        message: `${result.affected || 0}개의 거래처가 삭제되었습니다.`,
        count: result.affected || 0
      });
    } catch (error) {
      logger.error('Delete all customers error:', error as Error);
      res.status(500).json({
        success: false,
        message: '거래처 전체 삭제 중 오류가 발생했습니다.'
      });
    }
  }
};