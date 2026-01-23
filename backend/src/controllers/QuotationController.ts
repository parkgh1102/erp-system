import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Quotation } from '../entities/Quotation';
import { QuotationItem } from '../entities/QuotationItem';
import { Business } from '../entities/Business';
import { Customer } from '../entities/Customer';
import { User } from '../entities/User';
import Joi from 'joi';

const quotationRepository = AppDataSource.getRepository(Quotation);
const quotationItemRepository = AppDataSource.getRepository(QuotationItem);
const businessRepository = AppDataSource.getRepository(Business);
const customerRepository = AppDataSource.getRepository(Customer);
const userRepository = AppDataSource.getRepository(User);

const quotationSchema = Joi.object({
  customerId: Joi.number().integer().min(1).allow(null),
  quotationNumber: Joi.string().required(),
  quotationDate: Joi.string().isoDate().required(),
  validUntil: Joi.string().isoDate().required(),
  supplyAmount: Joi.number().default(0),
  vatAmount: Joi.number().default(0),
  totalAmount: Joi.number().required(),
  memo: Joi.string().allow('', null).optional(),
  paymentTerms: Joi.string().allow('', null).optional(),
  deliveryTerms: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('draft', 'sent', 'accepted', 'rejected', 'expired').default('draft'),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().min(1).allow(null).optional(),
      itemName: Joi.string().required(),
      specification: Joi.string().allow('', null).optional(),
      unit: Joi.string().allow('', null).optional(),
      quantity: Joi.number().required(),
      unitPrice: Joi.number().required(),
      supplyAmount: Joi.number().required(),
      vatAmount: Joi.number().default(0),
      remark: Joi.string().allow('', null).optional()
    })
  ).default([])
});

export class QuotationController {
  static async getAll(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      const business = await businessRepository.findOne({
        where: { id: parseInt(businessId) }
      });

      if (!business) {
        return res.status(404).json({ success: false, message: '사업자 정보를 찾을 수 없습니다.' });
      }

      const quotations = await quotationRepository.find({
        where: { businessId: parseInt(businessId) },
        relations: ['customer', 'items'],
        order: { quotationDate: 'DESC', createdAt: 'DESC' }
      });

      quotations.forEach(q => {
        if (q.items) {
          q.items.sort((a, b) => a.sortOrder - b.sortOrder);
        }
      });

      res.json({
        success: true,
        data: quotations
      });
    } catch (error) {
      console.error('Quotation getAll error:', error);
      res.status(500).json({ success: false, message: '견적서 목록 조회 중 오류가 발생했습니다.' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id, businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      const quotation = await quotationRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['customer', 'items']
      });

      if (!quotation) {
        return res.status(404).json({ success: false, message: '견적서를 찾을 수 없습니다.' });
      }

      if (quotation.items) {
        quotation.items.sort((a, b) => a.sortOrder - b.sortOrder);
      }

      res.json({ success: true, data: quotation });
    } catch (error) {
      console.error('Quotation getById error:', error);
      res.status(500).json({ success: false, message: '견적서 조회 중 오류가 발생했습니다.' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { error, value } = quotationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 정보를 확인해주세요.',
          errors: error.details.map(d => d.message)
        });
      }

      const { businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      const business = await businessRepository.findOne({
        where: { id: parseInt(businessId) }
      });

      if (!business) {
        return res.status(404).json({ success: false, message: '사업자 정보를 찾을 수 없습니다.' });
      }

      if (value.customerId) {
        const customer = await customerRepository.findOne({
          where: { id: value.customerId, businessId: parseInt(businessId) }
        });
        if (!customer) {
          return res.status(404).json({ success: false, message: '거래처를 찾을 수 없습니다.' });
        }
      }

      const quotation = quotationRepository.create({
        businessId: parseInt(businessId),
        customerId: value.customerId || null,
        quotationNumber: value.quotationNumber,
        quotationDate: value.quotationDate,
        validUntil: value.validUntil,
        supplyAmount: value.supplyAmount,
        vatAmount: value.vatAmount,
        totalAmount: value.totalAmount,
        memo: value.memo || null,
        paymentTerms: value.paymentTerms || null,
        deliveryTerms: value.deliveryTerms || null,
        status: value.status
      });

      const savedQuotation = await quotationRepository.save(quotation);

      if (value.items && value.items.length > 0) {
        for (let i = 0; i < value.items.length; i++) {
          const itemData = value.items[i];
          const item = quotationItemRepository.create({
            quotationId: savedQuotation.id,
            productId: itemData.productId || null,
            itemName: itemData.itemName,
            specification: itemData.specification || null,
            unit: itemData.unit || null,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            supplyAmount: itemData.supplyAmount,
            vatAmount: itemData.vatAmount || 0,
            remark: itemData.remark || null,
            sortOrder: i
          });
          await quotationItemRepository.save(item);
        }
      }

      const result = await quotationRepository.findOne({
        where: { id: savedQuotation.id },
        relations: ['customer', 'items']
      });

      res.status(201).json({
        success: true,
        message: '견적서가 등록되었습니다.',
        data: result
      });
    } catch (error) {
      console.error('Quotation create error:', error);
      res.status(500).json({ success: false, message: '견적서 등록 중 오류가 발생했습니다.' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { error, value } = quotationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 정보를 확인해주세요.',
          errors: error.details.map(d => d.message)
        });
      }

      const { id, businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      const quotation = await quotationRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['items']
      });

      if (!quotation) {
        return res.status(404).json({ success: false, message: '견적서를 찾을 수 없습니다.' });
      }

      if (quotation.items) {
        await quotationItemRepository.remove(quotation.items);
      }

      await quotationRepository.update(parseInt(id), {
        customerId: value.customerId || null,
        quotationNumber: value.quotationNumber,
        quotationDate: value.quotationDate,
        validUntil: value.validUntil,
        supplyAmount: value.supplyAmount,
        vatAmount: value.vatAmount,
        totalAmount: value.totalAmount,
        memo: value.memo || null,
        paymentTerms: value.paymentTerms || null,
        deliveryTerms: value.deliveryTerms || null,
        status: value.status
      });

      if (value.items && value.items.length > 0) {
        for (let i = 0; i < value.items.length; i++) {
          const itemData = value.items[i];
          const item = quotationItemRepository.create({
            quotationId: parseInt(id),
            productId: itemData.productId || null,
            itemName: itemData.itemName,
            specification: itemData.specification || null,
            unit: itemData.unit || null,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            supplyAmount: itemData.supplyAmount,
            vatAmount: itemData.vatAmount || 0,
            remark: itemData.remark || null,
            sortOrder: i
          });
          await quotationItemRepository.save(item);
        }
      }

      const result = await quotationRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['customer', 'items']
      });

      res.json({
        success: true,
        message: '견적서가 수정되었습니다.',
        data: result
      });
    } catch (error) {
      console.error('Quotation update error:', error);
      res.status(500).json({ success: false, message: '견적서 수정 중 오류가 발생했습니다.' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id, businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      const quotation = await quotationRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['items']
      });

      if (!quotation) {
        return res.status(404).json({ success: false, message: '견적서를 찾을 수 없습니다.' });
      }

      if (quotation.items) {
        await quotationItemRepository.remove(quotation.items);
      }

      await quotationRepository.remove(quotation);

      res.json({ success: true, message: '견적서가 삭제되었습니다.' });
    } catch (error) {
      console.error('Quotation delete error:', error);
      res.status(500).json({ success: false, message: '견적서 삭제 중 오류가 발생했습니다.' });
    }
  }

  static async getNextNumber(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const year = new Date().getFullYear();
      const prefix = `QT-${year}-`;

      const lastQuotation = await quotationRepository
        .createQueryBuilder('q')
        .where('q.businessId = :businessId', { businessId: parseInt(businessId) })
        .andWhere('q.quotationNumber LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('q.quotationNumber', 'DESC')
        .getOne();

      let nextNumber = 1;
      if (lastQuotation) {
        const lastNum = parseInt(lastQuotation.quotationNumber.replace(prefix, ''));
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }

      res.json({
        success: true,
        data: { quotationNumber: `${prefix}${String(nextNumber).padStart(4, '0')}` }
      });
    } catch (error) {
      console.error('Quotation getNextNumber error:', error);
      res.status(500).json({ success: false, message: '견적번호 생성 중 오류가 발생했습니다.' });
    }
  }
}
