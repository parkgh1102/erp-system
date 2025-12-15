import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Purchase } from '../entities/Purchase';
import { Business } from '../entities/Business';
import { Customer } from '../entities/Customer';
import { PurchaseItem } from '../entities/PurchaseItem';
import Joi from 'joi';

const purchaseRepository = AppDataSource.getRepository(Purchase);
const businessRepository = AppDataSource.getRepository(Business);
const customerRepository = AppDataSource.getRepository(Customer);
const purchaseItemRepository = AppDataSource.getRepository(PurchaseItem);

const purchaseSchema = Joi.object({
  customerId: Joi.number().integer().min(1).allow(null),
  customer: Joi.object({
    id: Joi.number().integer().min(1),
    name: Joi.string().required()
  }).allow(null),
  purchaseDate: Joi.string().isoDate().required(),
  totalAmount: Joi.number().min(0).required(),
  vatAmount: Joi.number().min(0).default(0),
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
      quantity: Joi.number().required(),
      unitPrice: Joi.number().required(),
      amount: Joi.number().required(),
      supplyAmount: Joi.number().optional(),
      vatAmount: Joi.number().optional(),
      totalAmount: Joi.number().optional()
    })
  ).default([])
});

export class PurchaseController {
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

      const purchases = await purchaseRepository.find({
        where: { businessId: parseInt(businessId) },
        relations: ['customer', 'items', 'items.product'],
        order: { purchaseDate: 'DESC', createdAt: 'DESC' }
      });

      res.json({
        success: true,
        data: {
          purchases: purchases,
          pagination: {
            total: purchases.length,
            page: 1,
            limit: 100
          }
        }
      });
    } catch (error) {
      console.error('Purchase getAll error:', error);
      res.status(500).json({ success: false, message: '매입 목록 조회 중 오류가 발생했습니다.' });
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

      const purchase = await purchaseRepository.findOne({
        where: {
          id: parseInt(id),
          businessId: parseInt(businessId)
        },
        relations: ['customer', 'items', 'items.product']
      });

      if (!purchase) {
        return res.status(404).json({
          success: false,
          message: '매입 정보를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: purchase
      });
    } catch (error) {
      console.error('Purchase getById error:', error);
      res.status(500).json({ success: false, message: '매입 조회 중 오류가 발생했습니다.' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      const { error, value } = purchaseSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
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

      let customer = null;
      if (value.customerId) {
        customer = await customerRepository.findOne({
          where: {
            id: value.customerId,
            businessId: parseInt(businessId)
          }
        });
      }

      const purchase = purchaseRepository.create({
        businessId: parseInt(businessId),
        customerId: customer?.id || null,
        purchaseDate: value.purchaseDate,
        totalAmount: value.totalAmount,
        vatAmount: value.vatAmount || 0,
        memo: value.memo || null,
        isActive: true
      });

      const savedPurchase = await purchaseRepository.save(purchase);

      if (value.items && value.items.length > 0) {
        const items = value.items.map((item: any) =>
          purchaseItemRepository.create({
            purchaseId: savedPurchase.id,
            productId: item.productId || null,
            productCode: item.productCode || '',
            productName: item.productName,
            spec: item.spec || '',
            unit: item.unit || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount
          })
        );

        await purchaseItemRepository.save(items);
      }

      const createdPurchase = await purchaseRepository.findOne({
        where: { id: savedPurchase.id },
        relations: ['customer', 'items']
      });

      res.status(201).json({
        success: true,
        message: '매입이 등록되었습니다.',
        data: createdPurchase
      });
    } catch (error) {
      console.error('Purchase create error:', error);
      res.status(500).json({ success: false, message: '매입 등록 중 오류가 발생했습니다.' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id, businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      const { error, value } = purchaseSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
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

      const purchase = await purchaseRepository.findOne({
        where: {
          id: parseInt(id),
          businessId: parseInt(businessId)
        },
        relations: ['items']
      });

      if (!purchase) {
        return res.status(404).json({
          success: false,
          message: '매입 정보를 찾을 수 없습니다.'
        });
      }

      let customer = null;
      if (value.customerId) {
        customer = await customerRepository.findOne({
          where: {
            id: value.customerId,
            businessId: parseInt(businessId)
          }
        });
      }

      purchase.customerId = customer?.id || null;
      purchase.purchaseDate = value.purchaseDate;
      purchase.totalAmount = value.totalAmount;
      purchase.vatAmount = value.vatAmount || 0;
      purchase.memo = value.memo || null;

      await purchaseRepository.save(purchase);

      if (purchase.items && purchase.items.length > 0) {
        await purchaseItemRepository.delete({ purchaseId: purchase.id });
      }

      if (value.items && value.items.length > 0) {
        const items = value.items.map((item: any) =>
          purchaseItemRepository.create({
            purchaseId: purchase.id,
            productId: item.productId || null,
            productCode: item.productCode || '',
            productName: item.productName,
            spec: item.spec || '',
            unit: item.unit || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount
          })
        );

        await purchaseItemRepository.save(items);
      }

      const updatedPurchase = await purchaseRepository.findOne({
        where: { id: purchase.id },
        relations: ['customer', 'items']
      });

      res.json({
        success: true,
        message: '매입이 수정되었습니다.',
        data: updatedPurchase
      });
    } catch (error) {
      console.error('Purchase update error:', error);
      res.status(500).json({ success: false, message: '매입 수정 중 오류가 발생했습니다.' });
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

      const purchase = await purchaseRepository.findOne({
        where: {
          id: parseInt(id),
          businessId: parseInt(businessId)
        }
      });

      if (!purchase) {
        return res.status(404).json({
          success: false,
          message: '매입 정보를 찾을 수 없습니다.'
        });
      }

      await purchaseItemRepository.delete({ purchaseId: purchase.id });
      await purchaseRepository.remove(purchase);

      res.json({
        success: true,
        message: '매입이 삭제되었습니다.'
      });
    } catch (error) {
      console.error('Purchase delete error:', error);
      res.status(500).json({ success: false, message: '매입 삭제 중 오류가 발생했습니다.' });
    }
  }
}
