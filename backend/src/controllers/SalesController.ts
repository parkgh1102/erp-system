import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Sales } from '../entities/Sales';
import { Business } from '../entities/Business';
import { Customer } from '../entities/Customer';
import { SalesItem } from '../entities/SalesItem';
// import { Product } from '../entities/Product';
import Joi from 'joi';

const salesRepository = AppDataSource.getRepository(Sales);
const businessRepository = AppDataSource.getRepository(Business);
const customerRepository = AppDataSource.getRepository(Customer);
const salesItemRepository = AppDataSource.getRepository(SalesItem);
// const productRepository = AppDataSource.getRepository(Product);

const salesSchema = Joi.object({
  customerId: Joi.number().integer().min(1).allow(null),
  customer: Joi.object({
    id: Joi.number().integer().min(1),
    name: Joi.string().required()
  }).allow(null),
  saleDate: Joi.string().isoDate().optional(),
  transactionDate: Joi.string().isoDate().optional(),
  totalAmount: Joi.number().min(0).required(),
  vatAmount: Joi.number().min(0).default(0),
  description: Joi.string().allow('', null).optional(),
  memo: Joi.string().allow('', null).optional(),
  businessId: Joi.number().integer().min(1).optional(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().min(1).allow(null).optional(),
      productCode: Joi.string().allow('', null).optional(),
      productName: Joi.string().required(),
      spec: Joi.string().allow('', null).optional(),
      unit: Joi.string().allow('', null).optional(),
      taxType: Joi.string().allow('', null).optional(),
      quantity: Joi.number().min(0.01).required(),
      unitPrice: Joi.number().min(0).required(),
      amount: Joi.number().min(0).required(),
      supplyAmount: Joi.number().min(0).optional(),
      vatAmount: Joi.number().min(0).optional(),
      totalAmount: Joi.number().min(0).optional(),
      vatRate: Joi.number().min(0).max(1).default(0.1).optional()
    })
  ).default([])
});

export class SalesController {
  static async getAll(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

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

      const sales = await salesRepository.find({
        where: { businessId: parseInt(businessId) },
        relations: ['customer', 'items', 'items.product'],
        order: { transactionDate: 'DESC', createdAt: 'DESC' }
      });

      res.json({
        success: true,
        data: {
          sales: sales,
          pagination: {
            total: sales.length,
            page: 1,
            limit: 100
          }
        }
      });
    } catch (error) {
      console.error('Sales getAll error:', error);
      res.status(500).json({ success: false, message: '매출 목록 조회 중 오류가 발생했습니다.' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id, businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

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

      const sales = await salesRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['customer', 'items', 'items.product']
      });

      if (!sales) {
        return res.status(404).json({
          success: false,
          message: '매출 정보를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: sales
      });
    } catch (error) {
      console.error('Sales getById error:', error);
      res.status(500).json({ success: false, message: '매출 조회 중 오류가 발생했습니다.' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { error, value } = salesSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 정보를 확인해주세요.',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

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

      // 거래처 ID 추출 (customer 객체가 있으면 사용, 없으면 customerId 사용)
      const customerId = value.customer?.id || value.customerId || null;

      // 거래처 검증
      if (customerId) {
        const customer = await customerRepository.findOne({
          where: { id: customerId, businessId: parseInt(businessId) }
        });

        if (!customer) {
          return res.status(404).json({
            success: false,
            message: '거래처 정보를 찾을 수 없습니다.'
          });
        }
      }

      // 날짜 처리 (saleDate가 있으면 사용, 없으면 transactionDate 사용)
      const transactionDate = value.saleDate || value.transactionDate;

      // 매출 생성
      const sales = salesRepository.create({
        businessId: parseInt(businessId),
        customerId: customerId,
        transactionDate: transactionDate,
        totalAmount: value.totalAmount,
        vatAmount: value.vatAmount,
        description: value.description || null,
        memo: value.memo || null
      });

      const savedSales = await salesRepository.save(sales);

      // 거래 항목들 생성
      if (value.items && value.items.length > 0) {
        const items = [];
        for (const itemData of value.items) {
          const supplyAmount = itemData.amount || itemData.totalPrice || (itemData.quantity * itemData.unitPrice);
          const vatRate = itemData.vatRate || 0.1;
          const item = salesItemRepository.create({
            salesId: savedSales.id,
            productId: itemData.productId || null,
            itemName: itemData.productName,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            supplyAmount: supplyAmount,
            taxAmount: supplyAmount * vatRate
          });
          items.push(item);
        }
        await salesItemRepository.save(items);
      }

      // 생성된 데이터를 다시 조회해서 반환
      const result = await salesRepository.findOne({
        where: { id: savedSales.id },
        relations: ['customer', 'items', 'items.product']
      });

      res.status(201).json({
        success: true,
        message: '매출이 등록되었습니다.',
        data: result
      });
    } catch (error) {
      console.error('Sales create error:', error);
      res.status(500).json({ success: false, message: '매출 등록 중 오류가 발생했습니다.' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      console.log('📊 ====== SALES UPDATE START ======');
      console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
      console.log('📊 Items in request:', req.body.items);

      const { error, value } = salesSchema.validate(req.body);

      if (error) {
        console.log('❌ VALIDATION FAILED:', error.details.map(detail => detail.message));
        return res.status(400).json({
          success: false,
          message: '입력 정보를 확인해주세요.',
          errors: error.details.map(detail => detail.message)
        });
      }

      console.log('✅ Validation passed');

      const { id, businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

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

      const sales = await salesRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['items']
      });

      if (!sales) {
        return res.status(404).json({
          success: false,
          message: '매출 정보를 찾을 수 없습니다.'
        });
      }

      // 기존 항목들 삭제
      if (sales.items) {
        await salesItemRepository.remove(sales.items);
      }

      // 매출 정보 업데이트
      await salesRepository.update(parseInt(id), {
        customerId: value.customerId || null,
        transactionDate: value.transactionDate,
        totalAmount: value.totalAmount,
        vatAmount: value.vatAmount,
        description: value.description || null,
        memo: value.memo || null
      });

      // 새로운 항목들 생성
      if (value.items && value.items.length > 0) {
        const items = [];
        for (const itemData of value.items) {
          const supplyAmount = itemData.amount || itemData.totalPrice || (itemData.quantity * itemData.unitPrice);
          const vatRate = itemData.vatRate || 0.1;
          const item = salesItemRepository.create({
            salesId: parseInt(id),
            productId: itemData.productId || null,
            itemName: itemData.productName,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            supplyAmount: supplyAmount,
            taxAmount: supplyAmount * vatRate
          });
          items.push(item);
        }
        await salesItemRepository.save(items);
      }

      const result = await salesRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['customer', 'items', 'items.product']
      });

      res.json({
        success: true,
        message: '매출이 수정되었습니다.',
        data: result
      });
    } catch (error) {
      console.error('Sales update error:', error);
      res.status(500).json({ success: false, message: '매출 수정 중 오류가 발생했습니다.' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id, businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

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

      const sales = await salesRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['items']
      });

      if (!sales) {
        return res.status(404).json({
          success: false,
          message: '매출 정보를 찾을 수 없습니다.'
        });
      }

      // 관련 항목들도 함께 삭제
      if (sales.items) {
        await salesItemRepository.remove(sales.items);
      }

      await salesRepository.remove(sales);

      res.json({
        success: true,
        message: '매출이 삭제되었습니다.'
      });
    } catch (error) {
      console.error('Sales delete error:', error);
      res.status(500).json({ success: false, message: '매출 삭제 중 오류가 발생했습니다.' });
    }
  }
}