import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Business } from '../entities/Business';
import { validate } from '../utils/validation';
import Joi from 'joi';

const businessRepository = AppDataSource.getRepository(Business);

const businessSchema = Joi.object({
  businessNumber: Joi.string().length(12).pattern(/^[0-9-]+$/).required(),
  companyName: Joi.string().max(200).required(),
  representative: Joi.string().max(100).required(),
  businessType: Joi.string().max(100).optional(),
  businessItem: Joi.string().max(100).optional(),
  address: Joi.string().max(500).optional(),
  phone: Joi.string().max(20).optional(),
  fax: Joi.string().max(20).optional(),
  email: Joi.string().email().max(100).optional(),
  homepage: Joi.string().uri().max(200).optional()
});

const businessUpdateSchema = Joi.object({
  businessNumber: Joi.string().length(12).pattern(/^[0-9-]+$/).optional(),
  companyName: Joi.string().max(200).required(),
  representative: Joi.string().max(100).required(),
  businessType: Joi.string().max(100).optional(),
  businessItem: Joi.string().max(100).optional(),
  address: Joi.string().max(500).optional(),
  phone: Joi.string().max(20).optional(),
  fax: Joi.string().max(20).optional(),
  email: Joi.string().email().max(100).optional(),
  homepage: Joi.string().uri().max(200).optional()
});

export class BusinessController {
  // 모든 사업자 조회
  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      let query = businessRepository.createQueryBuilder('business')
        .where('business.isActive = :isActive', { isActive: true });

      if (search) {
        query = query.andWhere(
          '(business.companyName LIKE :search OR business.businessNumber LIKE :search OR business.representative LIKE :search)',
          { search: `%${search}%` }
        );
      }

      const [businesses, total] = await query
        .orderBy('business.createdAt', 'DESC')
        .take(take)
        .skip(skip)
        .getManyAndCount();

      res.json({
        success: true,
        data: businesses,
        pagination: {
          page: Number(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take)
        }
      });
    } catch (error) {
      console.error('Error fetching businesses:', error);
      res.status(500).json({
        success: false,
        message: '사업자 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 특정 사업자 조회
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const business = await businessRepository.findOne({
        where: { id: Number(id), isActive: true }
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: '사업자를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: business
      });
    } catch (error) {
      console.error('Error fetching business:', error);
      res.status(500).json({
        success: false,
        message: '사업자 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 사업자 생성
  static async create(req: Request, res: Response) {
    try {
      const { error, value } = validate(businessSchema, req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다.',
          errors: error.details
        });
      }

      // 사업자번호 중복 확인
      const existingBusiness = await businessRepository.findOne({
        where: { businessNumber: value.businessNumber }
      });

      if (existingBusiness) {
        return res.status(409).json({
          success: false,
          message: '이미 등록된 사업자번호입니다.'
        });
      }

      const business = businessRepository.create(value);
      const savedBusiness = await businessRepository.save(business);

      res.status(201).json({
        success: true,
        message: '사업자가 성공적으로 등록되었습니다.',
        data: savedBusiness
      });
    } catch (error) {
      console.error('Error creating business:', error);
      res.status(500).json({
        success: false,
        message: '사업자 등록 중 오류가 발생했습니다.'
      });
    }
  }

  // 사업자 수정
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { error, value } = validate(businessUpdateSchema, req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다.',
          errors: error.details
        });
      }

      const business = await businessRepository.findOne({
        where: { id: Number(id), isActive: true }
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: '사업자를 찾을 수 없습니다.'
        });
      }

      // 사업자번호 변경 시 중복 확인
      if (value.businessNumber && value.businessNumber !== business.businessNumber) {
        const existingBusiness = await businessRepository.findOne({
          where: { businessNumber: value.businessNumber }
        });

        if (existingBusiness) {
          return res.status(409).json({
            success: false,
            message: '이미 등록된 사업자번호입니다.'
          });
        }
      }

      Object.assign(business, value);
      const updatedBusiness = await businessRepository.save(business);

      res.json({
        success: true,
        message: '사업자 정보가 성공적으로 수정되었습니다.',
        data: updatedBusiness
      });
    } catch (error) {
      console.error('Error updating business:', error);
      res.status(500).json({
        success: false,
        message: '사업자 수정 중 오류가 발생했습니다.'
      });
    }
  }

  // 사업자 삭제 (소프트 삭제)
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const business = await businessRepository.findOne({
        where: { id: Number(id), isActive: true }
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: '사업자를 찾을 수 없습니다.'
        });
      }

      business.isActive = false;
      await businessRepository.save(business);

      res.json({
        success: true,
        message: '사업자가 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      console.error('Error deleting business:', error);
      res.status(500).json({
        success: false,
        message: '사업자 삭제 중 오류가 발생했습니다.'
      });
    }
  }

  // 사업자번호 유효성 검증
  static async validateBusinessNumber(req: Request, res: Response) {
    try {
      const { businessNumber } = req.params;

      // 사업자번호 형식 검증
      if (!/^[0-9]{3}-[0-9]{2}-[0-9]{5}$/.test(businessNumber)) {
        return res.status(400).json({
          success: false,
          message: '올바른 사업자번호 형식이 아닙니다. (예: 123-45-67890)'
        });
      }

      // 중복 확인
      const existingBusiness = await businessRepository.findOne({
        where: { businessNumber }
      });

      res.json({
        success: true,
        isValid: !existingBusiness,
        message: existingBusiness ? '이미 등록된 사업자번호입니다.' : '사용 가능한 사업자번호입니다.'
      });
    } catch (error) {
      console.error('Error validating business number:', error);
      res.status(500).json({
        success: false,
        message: '사업자번호 검증 중 오류가 발생했습니다.'
      });
    }
  }
}