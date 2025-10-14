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
// import { Product } from '../entities/Product';
const joi_1 = __importDefault(require("joi"));
const salesRepository = database_1.AppDataSource.getRepository(Sales_1.Sales);
const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
const customerRepository = database_1.AppDataSource.getRepository(Customer_1.Customer);
const salesItemRepository = database_1.AppDataSource.getRepository(SalesItem_1.SalesItem);
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
    static async getAll(req, res) {
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
        }
        catch (error) {
            console.error('Sales delete error:', error);
            res.status(500).json({ success: false, message: '매출 삭제 중 오류가 발생했습니다.' });
        }
    }
}
exports.SalesController = SalesController;
//# sourceMappingURL=SalesController.js.map