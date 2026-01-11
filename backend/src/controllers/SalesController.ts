import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Sales } from '../entities/Sales';
import { Business } from '../entities/Business';
import { Customer } from '../entities/Customer';
import { SalesItem } from '../entities/SalesItem';
import { User } from '../entities/User';
import { Notification } from '../entities/Notification';
import { UserBusinessAccess } from '../entities/UserBusinessAccess';
// import { Product } from '../entities/Product';
import Joi from 'joi';
import { AlimtalkService } from '../services/AlimtalkService';
import { CloudinaryService } from '../services/CloudinaryService';

const salesRepository = AppDataSource.getRepository(Sales);
const businessRepository = AppDataSource.getRepository(Business);
const customerRepository = AppDataSource.getRepository(Customer);
const salesItemRepository = AppDataSource.getRepository(SalesItem);
const userRepository = AppDataSource.getRepository(User);
const notificationRepository = AppDataSource.getRepository(Notification);
const userBusinessAccessRepository = AppDataSource.getRepository(UserBusinessAccess);
// const productRepository = AppDataSource.getRepository(Product);

const salesSchema = Joi.object({
  customerId: Joi.number().integer().min(1).allow(null),
  customer: Joi.object({
    id: Joi.number().integer().min(1),
    name: Joi.string().required()
  }).allow(null),
  saleDate: Joi.string().isoDate().optional(),
  transactionDate: Joi.string().isoDate().optional(),
  totalAmount: Joi.number().required(),
  vatAmount: Joi.number().default(0),
  description: Joi.string().allow('', null).optional(),
  memo: Joi.string().allow('', null).optional(),
  bankAccount: Joi.string().allow('', null).optional(),
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
      totalAmount: Joi.number().optional(),
      vatRate: Joi.number().min(0).max(1).default(0.1).optional()
    })
  ).default([])
});

export class SalesController {
  // 역할 기반 접근 제어 적용
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

      console.log('🔍 Sales getAll - User info:', {
        userId: user.id,
        role: user.role,
        userBusinessId: user.businessId,
        requestedBusinessId: parseInt(businessId),
        match: user.businessId === parseInt(businessId)
      });

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

      const sales = await salesRepository.find({
        where: { businessId: parseInt(businessId) },
        relations: ['customer', 'items', 'items.product', 'signedByUser'],
        order: { transactionDate: 'DESC', createdAt: 'DESC' }
      });

      // 서명 이미지 조회 로그
      const signedSales = sales.filter(s => s.signatureImage);
      console.log('📊 매출 조회 완료:', {
        전체매출수: sales.length,
        서명된매출수: signedSales.length,
        서명된매출들: signedSales.map(s => ({
          id: s.id,
          signedBy: s.signedBy,
          signatureImageLength: s.signatureImage?.length || 0
        }))
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

      const sales = await salesRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['customer', 'items', 'items.product', 'signedByUser']
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
        memo: value.memo || null,
        bankAccount: value.bankAccount || null
      });

      const savedSales = await salesRepository.save(sales);

      // 거래 항목들 생성
      if (value.items && value.items.length > 0) {
        const items = [];
        for (const itemData of value.items) {
          // 프론트엔드에서 보낸 값이 있으면 사용, 없으면 계산
          const defaultAmount = itemData.quantity * itemData.unitPrice;
          const supplyAmount = itemData.supplyAmount !== undefined ? itemData.supplyAmount : (itemData.amount || defaultAmount);

          // 면세 여부 확인
          const isTaxFree = itemData.taxType === 'tax_free';
          // 면세인 경우 세액은 0, 아니면 프론트엔드 값 또는 10% 계산
          const taxAmount = isTaxFree ? 0 : (itemData.vatAmount !== undefined ? itemData.vatAmount : Math.round(supplyAmount * 0.1));

          const item = salesItemRepository.create({
            salesId: savedSales.id,
            productId: itemData.productId || null,
            itemName: itemData.productName,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            supplyAmount: supplyAmount,
            taxAmount: taxAmount,
            specification: itemData.spec || itemData.specification || null,
            unit: itemData.unit || null
          });
          items.push(item);
        }
        await salesItemRepository.save(items);
      }

      // 생성된 데이터를 다시 조회해서 반환
      const result = await salesRepository.findOne({
        where: { id: savedSales.id },
        relations: ['customer', 'items', 'items.product', 'signedByUser']
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

      // 날짜 처리 (saleDate가 있으면 사용, 없으면 transactionDate 사용)
      const transactionDate = value.saleDate || value.transactionDate;

      // 매출 정보 업데이트
      await salesRepository.update(parseInt(id), {
        customerId: value.customerId || null,
        transactionDate: transactionDate,
        totalAmount: value.totalAmount,
        vatAmount: value.vatAmount,
        description: value.description || null,
        memo: value.memo || null,
        bankAccount: value.bankAccount || null
      });

      // 새로운 항목들 생성
      if (value.items && value.items.length > 0) {
        const items = [];
        for (const itemData of value.items) {
          // 프론트엔드에서 보낸 값이 있으면 사용, 없으면 계산
          const defaultAmount = itemData.quantity * itemData.unitPrice;
          const supplyAmount = itemData.supplyAmount !== undefined ? itemData.supplyAmount : (itemData.amount || defaultAmount);

          // 면세 여부 확인
          const isTaxFree = itemData.taxType === 'tax_free';
          // 면세인 경우 세액은 0, 아니면 프론트엔드 값 또는 10% 계산
          const taxAmount = isTaxFree ? 0 : (itemData.vatAmount !== undefined ? itemData.vatAmount : Math.round(supplyAmount * 0.1));

          const item = salesItemRepository.create({
            salesId: parseInt(id),
            productId: itemData.productId || null,
            itemName: itemData.productName,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            supplyAmount: supplyAmount,
            taxAmount: taxAmount,
            specification: itemData.spec || itemData.specification || null,
            unit: itemData.unit || null
          });
          items.push(item);
        }
        await salesItemRepository.save(items);
      }

      const result = await salesRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['customer', 'items', 'items.product', 'signedByUser']
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

  // 전자서명 완료 API
  static async signSales(req: Request, res: Response) {
    try {
      const { id, businessId } = req.params;
      const { signatureImage } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      if (!signatureImage) {
        return res.status(400).json({ success: false, message: '서명 이미지가 필요합니다.' });
      }

      // 사용자 조회
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      // 역할에 따른 business 접근 권한 체크
      let business;
      if (user.role === 'admin') {
        // admin은 자신이 소유한 business에 접근 가능
        business = await businessRepository.findOne({
          where: { id: parseInt(businessId), userId }
        });
      } else if (user.role === 'sales_viewer') {
        // sales_viewer는 할당된 business에 접근 가능
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

      // 매출 정보 조회
      const sales = await salesRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['customer']
      });

      if (!sales) {
        return res.status(404).json({
          success: false,
          message: '매출 정보를 찾을 수 없습니다.'
        });
      }

      // 이미 서명된 경우 체크
      if (sales.signedBy) {
        return res.status(400).json({
          success: false,
          message: '이미 전자서명이 완료된 매출입니다.'
        });
      }

      // 전자서명 정보 업데이트
      if (process.env.NODE_ENV !== 'production') {
        console.log('📝 전자서명 저장:', {
          salesId: parseInt(id),
          signedBy: userId,
          hasSignatureImage: !!signatureImage
        });
      }

      await salesRepository.update(parseInt(id), {
        signedBy: userId,
        signedAt: new Date(),
        signatureImage: signatureImage
      });

      // business 소유자(admin) 조회
      const adminUser = await userRepository.findOne({
        where: { id: business.userId }
      });

      if (adminUser) {
        // admin에게 알림 생성
        const adminNotification = notificationRepository.create({
          userId: adminUser.id,
          type: 'e_signature',
          title: '새로운 전자서명',
          message: `새로운 전자서명이 있습니다.\n담당자: ${user.name}\n날짜: ${new Date().toLocaleString('ko-KR')}`,
          relatedId: sales.id,
          relatedType: 'sales',
          isRead: false
        });
        await notificationRepository.save(adminNotification);
      }

      // sales_viewer 본인에게도 알림 생성
      const userNotification = notificationRepository.create({
        userId: user.id,
        type: 'e_signature',
        title: '전자서명 완료',
        message: `전자서명이 완료되었습니다.\n날짜: ${new Date().toLocaleString('ko-KR')}`,
        relatedId: sales.id,
        relatedType: 'sales',
        isRead: false
      });
      await notificationRepository.save(userNotification);

      // 업데이트된 데이터 조회
      const result = await salesRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['customer', 'items', 'items.product', 'signedByUser'],
        select: {
          id: true,
          businessId: true,
          customerId: true,
          transactionDate: true,
          totalAmount: true,
          vatAmount: true,
          description: true,
          memo: true,
          signedBy: true,
          signedAt: true,
          signatureImage: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        success: true,
        message: '전자서명이 완료되었습니다.',
        data: result
      });
    } catch (error) {
      console.error('Sales sign error:', error);
      res.status(500).json({ success: false, message: '전자서명 중 오류가 발생했습니다.' });
    }
  }

  // 거래명세표 이미지 업로드
  static async uploadStatement(req: Request, res: Response) {
    try {
      const { businessId, id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      // 파일이 없는 경우
      if (!req.file) {
        return res.status(400).json({ success: false, message: '이미지 파일이 필요합니다.' });
      }

      // 디버깅: 파일 정보 로깅
      console.log('📤 업로드된 파일 정보:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer.length,
        first20Bytes: Array.from(req.file.buffer.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')
      });

      // JPG 파일 시그니처 검증 (FF D8 FF)
      if (req.file.buffer[0] !== 0xFF || req.file.buffer[1] !== 0xD8 || req.file.buffer[2] !== 0xFF) {
        console.error('❌ 잘못된 JPG 헤더:', Array.from(req.file.buffer.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        return res.status(400).json({ success: false, message: 'JPG 파일 형식이 올바르지 않습니다.' });
      }

      // 사업체 조회
      const business = await businessRepository.findOne({
        where: { id: parseInt(businessId) }
      });

      if (!business) {
        return res.status(404).json({ success: false, message: '사업체를 찾을 수 없습니다.' });
      }

      // 매출 조회
      const sales = await salesRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) }
      });

      if (!sales) {
        return res.status(404).json({ success: false, message: '매출 정보를 찾을 수 없습니다.' });
      }

      // Cloudinary에 이미지 업로드
      const fileName = `statement_${businessId}_${id}_${Date.now()}`;
      const imageUrl = await CloudinaryService.uploadImage(req.file.buffer, fileName);

      if (!imageUrl) {
        return res.status(500).json({
          success: false,
          message: 'Cloudinary 이미지 업로드에 실패했습니다. 환경변수를 확인하세요.'
        });
      }

      console.log('✅ Cloudinary 업로드 완료:', { imageUrl, fileName });

      res.json({
        success: true,
        message: '이미지가 업로드되었습니다.',
        imageUrl
      });
    } catch (error) {
      console.error('Statement upload error:', error);
      res.status(500).json({ success: false, message: '이미지 업로드 중 오류가 발생했습니다.' });
    }
  }

  // 알림톡 전송
  static async sendAlimtalk(req: Request, res: Response) {
    try {
      const { businessId, id } = req.params;
      const { imageUrl, phoneNumber } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      }

      if (!imageUrl) {
        return res.status(400).json({ success: false, message: '이미지 URL이 필요합니다.' });
      }

      // 사업체 조회
      const business = await businessRepository.findOne({
        where: { id: parseInt(businessId) },
        relations: ['user']
      });

      if (!business) {
        return res.status(404).json({ success: false, message: '사업체를 찾을 수 없습니다.' });
      }

      // 매출 조회
      const sales = await salesRepository.findOne({
        where: { id: parseInt(id), businessId: parseInt(businessId) },
        relations: ['customer']
      });

      if (!sales) {
        return res.status(404).json({ success: false, message: '매출 정보를 찾을 수 없습니다.' });
      }

      if (!sales.customer) {
        return res.status(400).json({ success: false, message: '거래처 정보를 찾을 수 없습니다.' });
      }

      // 전화번호: 요청에서 받은 번호 우선, 없으면 거래처 번호 사용
      const targetPhone = phoneNumber || sales.customer.phone;

      if (!targetPhone) {
        return res.status(400).json({ success: false, message: '전화번호가 필요합니다.' });
      }

      // 전화번호 형식 검증 (한국 전화번호)
      const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
      const phoneRegex = /^(01[0-9]|02|0[3-9][0-9])[0-9]{7,8}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)'
        });
      }

      // 알림톡 전송
      const sent = await AlimtalkService.sendESignatureStatement(
        targetPhone,
        sales.customer.name,
        imageUrl,
        business.companyName
      );

      if (sent) {
        res.json({
          success: true,
          message: '알림톡이 전송되었습니다.'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '알림톡 전송에 실패했습니다.'
        });
      }
    } catch (error) {
      console.error('Alimtalk send error:', error);
      res.status(500).json({ success: false, message: '알림톡 전송 중 오류가 발생했습니다.' });
    }
  }
}