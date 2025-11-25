"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesController = void 0;
const database_1 = require("../config/database");
const Sales_1 = require("../entities/Sales");
const Business_1 = require("../entities/Business");
const Customer_1 = require("../entities/Customer");
const SalesItem_1 = require("../entities/SalesItem");
const User_1 = require("../entities/User");
const Notification_1 = require("../entities/Notification");
// import { Product } from '../entities/Product';
const joi_1 = __importDefault(require("joi"));
const AlimtalkService_1 = require("../services/AlimtalkService");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const salesRepository = database_1.AppDataSource.getRepository(Sales_1.Sales);
const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
const customerRepository = database_1.AppDataSource.getRepository(Customer_1.Customer);
const salesItemRepository = database_1.AppDataSource.getRepository(SalesItem_1.SalesItem);
const userRepository = database_1.AppDataSource.getRepository(User_1.User);
const notificationRepository = database_1.AppDataSource.getRepository(Notification_1.Notification);
// const productRepository = AppDataSource.getRepository(Product);
const salesSchema = joi_1.default.object({
    customerId: joi_1.default.number().integer().min(1).allow(null),
    customer: joi_1.default.object({
        id: joi_1.default.number().integer().min(1),
        name: joi_1.default.string().required()
    }).allow(null),
    saleDate: joi_1.default.string().isoDate().optional(),
    transactionDate: joi_1.default.string().isoDate().optional(),
    totalAmount: joi_1.default.number().min(0).required(),
    vatAmount: joi_1.default.number().min(0).default(0),
    description: joi_1.default.string().allow('', null).optional(),
    memo: joi_1.default.string().allow('', null).optional(),
    businessId: joi_1.default.number().integer().min(1).optional(),
    items: joi_1.default.array().items(joi_1.default.object({
        productId: joi_1.default.number().integer().min(1).allow(null).optional(),
        productCode: joi_1.default.string().allow('', null).optional(),
        productName: joi_1.default.string().required(),
        spec: joi_1.default.string().allow('', null).optional(),
        unit: joi_1.default.string().allow('', null).optional(),
        taxType: joi_1.default.string().allow('', null).optional(),
        quantity: joi_1.default.number().min(0.01).required(),
        unitPrice: joi_1.default.number().min(0).required(),
        amount: joi_1.default.number().min(0).required(),
        supplyAmount: joi_1.default.number().min(0).optional(),
        vatAmount: joi_1.default.number().min(0).optional(),
        totalAmount: joi_1.default.number().min(0).optional(),
        vatRate: joi_1.default.number().min(0).max(1).default(0.1).optional()
    })).default([])
});
class SalesController {
    // 역할 기반 접근 제어 적용
    static async getAll(req, res) {
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
            }
            else if (user.role === 'sales_viewer') {
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
            const sales = await salesRepository.find({
                where: { businessId: parseInt(businessId) },
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
                    signatureImage: true, // 명시적으로 포함
                    createdAt: true,
                    updatedAt: true
                },
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
        }
        catch (error) {
            console.error('Sales getAll error:', error);
            res.status(500).json({ success: false, message: '매출 목록 조회 중 오류가 발생했습니다.' });
        }
    }
    static async getById(req, res) {
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
            }
            else if (user.role === 'sales_viewer') {
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
            const sales = await salesRepository.findOne({
                where: { id: parseInt(id), businessId: parseInt(businessId) },
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
                    signatureImage: true, // 명시적으로 포함
                    createdAt: true,
                    updatedAt: true
                }
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
        }
        catch (error) {
            console.error('Sales getById error:', error);
            res.status(500).json({ success: false, message: '매출 조회 중 오류가 발생했습니다.' });
        }
    }
    static async create(req, res) {
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
            }
            else if (user.role === 'sales_viewer') {
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
            res.status(201).json({
                success: true,
                message: '매출이 등록되었습니다.',
                data: result
            });
        }
        catch (error) {
            console.error('Sales create error:', error);
            res.status(500).json({ success: false, message: '매출 등록 중 오류가 발생했습니다.' });
        }
    }
    static async update(req, res) {
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
            }
            else if (user.role === 'sales_viewer') {
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
                message: '매출이 수정되었습니다.',
                data: result
            });
        }
        catch (error) {
            console.error('Sales update error:', error);
            res.status(500).json({ success: false, message: '매출 수정 중 오류가 발생했습니다.' });
        }
    }
    static async delete(req, res) {
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
            }
            else if (user.role === 'sales_viewer') {
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
        }
        catch (error) {
            console.error('Sales delete error:', error);
            res.status(500).json({ success: false, message: '매출 삭제 중 오류가 발생했습니다.' });
        }
    }
    // 전자서명 완료 API
    static async signSales(req, res) {
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
            // sales_viewer만 전자서명 가능
            if (user.role !== 'sales_viewer') {
                return res.status(403).json({
                    success: false,
                    message: '전자서명은 매출 조회 권한을 가진 사용자만 가능합니다.'
                });
            }
            // 역할에 따른 business 접근 권한 체크
            let business;
            if (user.businessId === parseInt(businessId)) {
                business = await businessRepository.findOne({
                    where: { id: parseInt(businessId) }
                });
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
            console.log('📝 전자서명 저장:', {
                salesId: parseInt(id),
                signedBy: userId,
                signatureImageLength: signatureImage.length,
                signatureImagePreview: signatureImage.substring(0, 50)
            });
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
        }
        catch (error) {
            console.error('Sales sign error:', error);
            res.status(500).json({ success: false, message: '전자서명 중 오류가 발생했습니다.' });
        }
    }
    // 거래명세표 이미지 업로드
    static async uploadStatement(req, res) {
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
            // 이미지 저장 경로 생성
            const uploadsDir = path_1.default.join(__dirname, '../../uploads/statements');
            await promises_1.default.mkdir(uploadsDir, { recursive: true });
            // 파일명 생성 (안전한 파일명)
            const ext = path_1.default.extname(req.file.originalname) || '.jpg';
            const fileName = `statement_${Date.now()}${ext}`;
            const filePath = path_1.default.join(uploadsDir, fileName);
            // 파일 저장 (Buffer 직접 저장 - binary 모드)
            await promises_1.default.writeFile(filePath, req.file.buffer, { encoding: null });
            console.log('✅ 파일 저장 완료:', {
                filePath,
                fileName,
                savedSize: (await promises_1.default.stat(filePath)).size
            });
            // URL 생성
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/statements/${fileName}`;
            res.json({
                success: true,
                message: '이미지가 업로드되었습니다.',
                imageUrl
            });
        }
        catch (error) {
            console.error('Statement upload error:', error);
            res.status(500).json({ success: false, message: '이미지 업로드 중 오류가 발생했습니다.' });
        }
    }
    // 알림톡 전송
    static async sendAlimtalk(req, res) {
        try {
            const { businessId, id } = req.params;
            const { imageUrl } = req.body;
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
            if (!sales.customer.phone) {
                return res.status(400).json({ success: false, message: '거래처 전화번호가 등록되어 있지 않습니다.' });
            }
            // 알림톡 전송
            const sent = await AlimtalkService_1.AlimtalkService.sendESignatureStatement(sales.customer.phone, sales.customer.name, imageUrl, business.companyName);
            if (sent) {
                res.json({
                    success: true,
                    message: '알림톡이 전송되었습니다.'
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: '알림톡 전송에 실패했습니다.'
                });
            }
        }
        catch (error) {
            console.error('Alimtalk send error:', error);
            res.status(500).json({ success: false, message: '알림톡 전송 중 오류가 발생했습니다.' });
        }
    }
}
exports.SalesController = SalesController;
//# sourceMappingURL=SalesController.js.map