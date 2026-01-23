import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { PurchaseOrder } from '../entities/PurchaseOrder';
import { PurchaseOrderItem } from '../entities/PurchaseOrderItem';
import { Business } from '../entities/Business';
import { Customer } from '../entities/Customer';
import { User } from '../entities/User';
import Joi from 'joi';

const purchaseOrderRepository = AppDataSource.getRepository(PurchaseOrder);
const purchaseOrderItemRepository = AppDataSource.getRepository(PurchaseOrderItem);
const businessRepository = AppDataSource.getRepository(Business);
const customerRepository = AppDataSource.getRepository(Customer);
const userRepository = AppDataSource.getRepository(User);

const purchaseOrderSchema = Joi.object({
  supplierId: Joi.number().integer().min(1).allow(null),
  orderNumber: Joi.string().required(),
  orderDate: Joi.string().isoDate().required(),
  deliveryDate: Joi.string().isoDate().required(),
  supplyAmount: Joi.number().default(0),
  vatAmount: Joi.number().default(0),
  totalAmount: Joi.number().required(),
  memo: Joi.string().allow('', null).optional(),
  deliveryLocation: Joi.string().allow('', null).optional(),
  paymentTerms: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('draft', 'sent', 'confirmed', 'received', 'cancelled').default('draft'),
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

export class PurchaseOrderController {
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

      const purchaseOrders = await purchaseOrderRepository.find({
        where: { businessId: parseInt(businessId) },
        relations: ['supplier', 'items'],
        order: { orderDate: 'DESC', createdAt: 'DESC' }
      });

      purchaseOrders.forEach(po => {
        if (po.items) {
          po.items.sort((a, b) => a.sortOrder - b.sortOrder);
        }
      });

      res.json({
        success: true,
        data: purchaseOrders
      });
    } catch (error) {
      console.error('PurchaseOrder getAll error:', error);
      res.status(500).json({ success: false, message: '발주서 목록 조회 중 오류가 발생했습니다.' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id, businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      const purchaseOrder = await purchaseOrderRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['supplier', 'items']
      });

      if (!purchaseOrder) {
        return res.status(404).json({ success: false, message: '발주서를 찾을 수 없습니다.' });
      }

      if (purchaseOrder.items) {
        purchaseOrder.items.sort((a, b) => a.sortOrder - b.sortOrder);
      }

      res.json({ success: true, data: purchaseOrder });
    } catch (error) {
      console.error('PurchaseOrder getById error:', error);
      res.status(500).json({ success: false, message: '발주서 조회 중 오류가 발생했습니다.' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { error, value } = purchaseOrderSchema.validate(req.body);
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

      if (value.supplierId) {
        const supplier = await customerRepository.findOne({
          where: { id: value.supplierId, businessId: parseInt(businessId) }
        });
        if (!supplier) {
          return res.status(404).json({ success: false, message: '공급업체를 찾을 수 없습니다.' });
        }
      }

      const purchaseOrder = purchaseOrderRepository.create({
        businessId: parseInt(businessId),
        supplierId: value.supplierId || null,
        orderNumber: value.orderNumber,
        orderDate: value.orderDate,
        deliveryDate: value.deliveryDate,
        supplyAmount: value.supplyAmount,
        vatAmount: value.vatAmount,
        totalAmount: value.totalAmount,
        memo: value.memo || null,
        deliveryLocation: value.deliveryLocation || null,
        paymentTerms: value.paymentTerms || null,
        status: value.status
      });

      const savedPurchaseOrder = await purchaseOrderRepository.save(purchaseOrder);

      if (value.items && value.items.length > 0) {
        for (let i = 0; i < value.items.length; i++) {
          const itemData = value.items[i];
          const item = purchaseOrderItemRepository.create({
            purchaseOrderId: savedPurchaseOrder.id,
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
          await purchaseOrderItemRepository.save(item);
        }
      }

      const result = await purchaseOrderRepository.findOne({
        where: { id: savedPurchaseOrder.id },
        relations: ['supplier', 'items']
      });

      res.status(201).json({
        success: true,
        message: '발주서가 등록되었습니다.',
        data: result
      });
    } catch (error) {
      console.error('PurchaseOrder create error:', error);
      res.status(500).json({ success: false, message: '발주서 등록 중 오류가 발생했습니다.' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { error, value } = purchaseOrderSchema.validate(req.body);
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

      const purchaseOrder = await purchaseOrderRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['items']
      });

      if (!purchaseOrder) {
        return res.status(404).json({ success: false, message: '발주서를 찾을 수 없습니다.' });
      }

      if (purchaseOrder.items) {
        await purchaseOrderItemRepository.remove(purchaseOrder.items);
      }

      await purchaseOrderRepository.update(parseInt(id), {
        supplierId: value.supplierId || null,
        orderNumber: value.orderNumber,
        orderDate: value.orderDate,
        deliveryDate: value.deliveryDate,
        supplyAmount: value.supplyAmount,
        vatAmount: value.vatAmount,
        totalAmount: value.totalAmount,
        memo: value.memo || null,
        deliveryLocation: value.deliveryLocation || null,
        paymentTerms: value.paymentTerms || null,
        status: value.status
      });

      if (value.items && value.items.length > 0) {
        for (let i = 0; i < value.items.length; i++) {
          const itemData = value.items[i];
          const item = purchaseOrderItemRepository.create({
            purchaseOrderId: parseInt(id),
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
          await purchaseOrderItemRepository.save(item);
        }
      }

      const result = await purchaseOrderRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['supplier', 'items']
      });

      res.json({
        success: true,
        message: '발주서가 수정되었습니다.',
        data: result
      });
    } catch (error) {
      console.error('PurchaseOrder update error:', error);
      res.status(500).json({ success: false, message: '발주서 수정 중 오류가 발생했습니다.' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id, businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      const purchaseOrder = await purchaseOrderRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['items']
      });

      if (!purchaseOrder) {
        return res.status(404).json({ success: false, message: '발주서를 찾을 수 없습니다.' });
      }

      if (purchaseOrder.items) {
        await purchaseOrderItemRepository.remove(purchaseOrder.items);
      }

      await purchaseOrderRepository.remove(purchaseOrder);

      res.json({ success: true, message: '발주서가 삭제되었습니다.' });
    } catch (error) {
      console.error('PurchaseOrder delete error:', error);
      res.status(500).json({ success: false, message: '발주서 삭제 중 오류가 발생했습니다.' });
    }
  }

  static async getNextNumber(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const year = new Date().getFullYear();
      const prefix = `PO-${year}-`;

      const lastOrder = await purchaseOrderRepository
        .createQueryBuilder('po')
        .where('po.businessId = :businessId', { businessId: parseInt(businessId) })
        .andWhere('po.orderNumber LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('po.orderNumber', 'DESC')
        .getOne();

      let nextNumber = 1;
      if (lastOrder) {
        const lastNum = parseInt(lastOrder.orderNumber.replace(prefix, ''));
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }

      res.json({
        success: true,
        data: { orderNumber: `${prefix}${String(nextNumber).padStart(4, '0')}` }
      });
    } catch (error) {
      console.error('PurchaseOrder getNextNumber error:', error);
      res.status(500).json({ success: false, message: '발주번호 생성 중 오류가 발생했습니다.' });
    }
  }
}
