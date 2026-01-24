import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { Business } from '../entities/Business';
import { User } from '../entities/User';
import { UserBusinessAccess } from '../entities/UserBusinessAccess';
import Joi from 'joi';

const productRepository = AppDataSource.getRepository(Product);
const businessRepository = AppDataSource.getRepository(Business);
const userRepository = AppDataSource.getRepository(User);
const userBusinessAccessRepository = AppDataSource.getRepository(UserBusinessAccess);

const productSchema = Joi.object({
  productCode: Joi.string().min(1).max(50).required(),
  name: Joi.string().min(1).max(100).required(),
  spec: Joi.string().max(50).allow('', null),
  unit: Joi.string().max(20).allow('', null),
  buyPrice: Joi.number().min(0).allow(null),
  sellPrice: Joi.number().min(0).allow(null),
  category: Joi.string().max(100).allow('', null),
  taxType: Joi.string().valid('tax_separate', 'tax_inclusive', 'tax_free').default('tax_separate'),
  memo: Joi.string().allow('', null)
});

export const ProductController = {
  async create(req: Request, res: Response) {
    try {
      const { error, value } = productSchema.validate(req.body);
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
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // 역할에 따른 business 접근 권한 체크
      let business;
      if (user.role === 'admin') {
        business = await businessRepository.findOne({
          where: { id: parseInt(businessId), userId }
        });
      } else if (user.role === 'sales_viewer') {
        const hasAccess = await userBusinessAccessRepository.findOne({
          where: { userId: user.id, businessId: parseInt(businessId) }
        });
        if (hasAccess || user.businessId === parseInt(businessId)) {
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

      const existingProduct = await productRepository.findOne({
        where: {
          productCode: value.productCode,
          businessId: business.id,
          isActive: true
        }
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: '이미 등록된 품목코드입니다.'
        });
      }

      const product = productRepository.create({
        ...value,
        businessId: business.id
      });

      const savedProduct = await productRepository.save(product);

      res.status(201).json({
        success: true,
        message: '품목이 등록되었습니다.',
        data: savedProduct
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '품목 등록 중 오류가 발생했습니다.'
      });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { businessId } = req.params;
      const { page = 1, limit = 10, search } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
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
          where: { id: parseInt(businessId), userId }
        });
      } else if (user.role === 'sales_viewer') {
        // sales_viewer는 UserBusinessAccess 또는 businessId로 접근 가능
        const hasAccess = await userBusinessAccessRepository.findOne({
          where: { userId: user.id, businessId: parseInt(businessId) }
        });

        if (hasAccess || user.businessId === parseInt(businessId)) {
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

      const queryBuilder = productRepository.createQueryBuilder('product')
        .where('product.businessId = :businessId', { businessId })
        .andWhere('product.isActive = :isActive', { isActive: true });

      if (search) {
        queryBuilder.andWhere(
          '(product.name LIKE :search OR product.productCode LIKE :search OR product.category LIKE :search)',
          { search: `%${search}%` }
        );
      }

      const [products, total] = await queryBuilder
        .orderBy('product.createdAt', 'DESC')
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '품목 목록 조회 중 오류가 발생했습니다.'
      });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { businessId, id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // 역할에 따른 business 접근 권한 체크
      let business;
      if (user.role === 'admin') {
        business = await businessRepository.findOne({
          where: { id: parseInt(businessId), userId }
        });
      } else if (user.role === 'sales_viewer') {
        const hasAccess = await userBusinessAccessRepository.findOne({
          where: { userId: user.id, businessId: parseInt(businessId) }
        });
        if (hasAccess || user.businessId === parseInt(businessId)) {
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

      const product = await productRepository.findOne({
        where: { id: parseInt(id), businessId: business.id, isActive: true }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: '품목을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '품목 조회 중 오류가 발생했습니다.'
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { error, value } = productSchema.validate(req.body);
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
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // 역할에 따른 business 접근 권한 체크
      let business;
      if (user.role === 'admin') {
        business = await businessRepository.findOne({
          where: { id: parseInt(businessId), userId }
        });
      } else if (user.role === 'sales_viewer') {
        const hasAccess = await userBusinessAccessRepository.findOne({
          where: { userId: user.id, businessId: parseInt(businessId) }
        });
        if (hasAccess || user.businessId === parseInt(businessId)) {
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

      const product = await productRepository.findOne({
        where: { id: parseInt(id), businessId: business.id, isActive: true }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: '품목을 찾을 수 없습니다.'
        });
      }

      if (value.productCode !== product.productCode) {
        const existingProduct = await productRepository.findOne({
          where: {
            productCode: value.productCode,
            businessId: business.id,
            isActive: true
          }
        });

        if (existingProduct) {
          return res.status(409).json({
            success: false,
            message: '이미 등록된 품목코드입니다.'
          });
        }
      }

      Object.assign(product, value);
      const updatedProduct = await productRepository.save(product);

      res.json({
        success: true,
        message: '품목이 수정되었습니다.',
        data: updatedProduct
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '품목 수정 중 오류가 발생했습니다.'
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { businessId, id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // 역할에 따른 business 접근 권한 체크
      let business;
      if (user.role === 'admin') {
        business = await businessRepository.findOne({
          where: { id: parseInt(businessId), userId }
        });
      } else if (user.role === 'sales_viewer') {
        const hasAccess = await userBusinessAccessRepository.findOne({
          where: { userId: user.id, businessId: parseInt(businessId) }
        });
        if (hasAccess || user.businessId === parseInt(businessId)) {
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

      const product = await productRepository.findOne({
        where: { id: parseInt(id), businessId: business.id, isActive: true }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: '품목을 찾을 수 없습니다.'
        });
      }

      product.isActive = false;
      await productRepository.save(product);

      res.json({
        success: true,
        message: '품목이 삭제되었습니다.'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '품목 삭제 중 오류가 발생했습니다.'
      });
    }
  }
};