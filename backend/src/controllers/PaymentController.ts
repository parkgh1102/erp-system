import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Payment, PaymentType } from '../entities/Payment';
import { Business } from '../entities/Business';
import { Customer } from '../entities/Customer';
import { User } from '../entities/User';
import { UserBusinessAccess } from '../entities/UserBusinessAccess';
import Joi from 'joi';

const paymentRepository = AppDataSource.getRepository(Payment);
const businessRepository = AppDataSource.getRepository(Business);
const customerRepository = AppDataSource.getRepository(Customer);
const userRepository = AppDataSource.getRepository(User);
const userBusinessAccessRepository = AppDataSource.getRepository(UserBusinessAccess);

const paymentSchema = Joi.object({
  customerId: Joi.number().integer().min(1).required(),
  paymentDate: Joi.string().isoDate().required(),
  type: Joi.string().valid('receipt', 'payment').required(),
  amount: Joi.number().min(0).required(),
  memo: Joi.string().allow('', null).optional(),
  businessId: Joi.number().integer().min(1).optional()
});

export class PaymentController {
  static async getAll(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // 역할에 따른 business 접근 권한 체크 (매출/매입 컨트롤러와 동일)
      // — sales_viewer도 거래처 잔액 화면에서 수금/지급을 조회할 수 있도록 함
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

      const payments = await paymentRepository.find({
        where: { businessId: parseInt(businessId) },
        relations: ['customer'],
        order: { paymentDate: 'DESC', createdAt: 'DESC' }
      });

      res.json({
        success: true,
        data: {
          payments: payments.map(p => ({
            ...p,
            type: p.paymentType === '수금' ? 'receipt' : 'payment',
            isActive: true
          })),
          pagination: {
            total: payments.length,
            page: 1,
            limit: 100
          }
        }
      });
    } catch (error) {
      console.error('Payment getAll error:', error);
      res.status(500).json({ success: false, message: '수금/지급 목록 조회 중 오류가 발생했습니다.' });
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

      const payment = await paymentRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['customer']
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: '수금/지급 정보를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: {
          ...payment,
          type: payment.paymentType === '수금' ? 'receipt' : 'payment',
          isActive: true
        }
      });
    } catch (error) {
      console.error('Payment getById error:', error);
      res.status(500).json({ success: false, message: '수금/지급 조회 중 오류가 발생했습니다.' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { error, value } = paymentSchema.validate(req.body);
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

      // 거래처 검증
      const customer = await customerRepository.findOne({
        where: { id: value.customerId, businessId: parseInt(businessId) }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: '거래처 정보를 찾을 수 없습니다.'
        });
      }

      // 수금/지급 생성
      const payment = paymentRepository.create({
        businessId: parseInt(businessId),
        customerId: value.customerId,
        paymentDate: value.paymentDate,
        paymentType: value.type === 'receipt' ? PaymentType.RECEIPT : PaymentType.PAYMENT,
        amount: value.amount,
        memo: value.memo || undefined
      });

      const savedPayment = await paymentRepository.save(payment);

      // 생성된 데이터를 다시 조회해서 반환
      const result = await paymentRepository.findOne({
        where: { id: savedPayment.id },
        relations: ['customer']
      });

      res.status(201).json({
        success: true,
        message: '수금/지급이 등록되었습니다.',
        data: {
          ...result,
          type: result?.paymentType === '수금' ? 'receipt' : 'payment',
          isActive: true
        }
      });
    } catch (error) {
      console.error('Payment create error:', error);
      res.status(500).json({ success: false, message: '수금/지급 등록 중 오류가 발생했습니다.' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { error, value } = paymentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 정보를 확인해주세요.',
          errors: error.details.map(detail => detail.message)
        });
      }

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

      const payment = await paymentRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: '수금/지급 정보를 찾을 수 없습니다.'
        });
      }

      // 수금/지급 정보 업데이트
      await paymentRepository.update(parseInt(id), {
        customerId: value.customerId,
        paymentDate: value.paymentDate,
        paymentType: value.type === 'receipt' ? PaymentType.RECEIPT : PaymentType.PAYMENT,
        amount: value.amount,
        memo: value.memo || undefined
      });

      const result = await paymentRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['customer']
      });

      res.json({
        success: true,
        message: '수금/지급이 수정되었습니다.',
        data: {
          ...result,
          type: result?.paymentType === '수금' ? 'receipt' : 'payment',
          isActive: true
        }
      });
    } catch (error) {
      console.error('Payment update error:', error);
      res.status(500).json({ success: false, message: '수금/지급 수정 중 오류가 발생했습니다.' });
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

      const payment = await paymentRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: '수금/지급 정보를 찾을 수 없습니다.'
        });
      }

      await paymentRepository.remove(payment);

      res.json({
        success: true,
        message: '수금/지급이 삭제되었습니다.'
      });
    } catch (error) {
      console.error('Payment delete error:', error);
      res.status(500).json({ success: false, message: '수금/지급 삭제 중 오류가 발생했습니다.' });
    }
  }
}
