"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseController = void 0;
const database_1 = require("../config/database");
const Purchase_1 = require("../entities/Purchase");
const Business_1 = require("../entities/Business");
const Customer_1 = require("../entities/Customer");
const PurchaseItem_1 = require("../entities/PurchaseItem");
const joi_1 = __importDefault(require("joi"));
const purchaseRepository = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
const customerRepository = database_1.AppDataSource.getRepository(Customer_1.Customer);
const purchaseItemRepository = database_1.AppDataSource.getRepository(PurchaseItem_1.PurchaseItem);
const purchaseSchema = joi_1.default.object({
    customerId: joi_1.default.number().integer().min(1).allow(null),
    customer: joi_1.default.object({
        id: joi_1.default.number().integer().min(1),
        name: joi_1.default.string().required()
    }).allow(null),
    purchaseDate: joi_1.default.string().isoDate().required(),
    totalAmount: joi_1.default.number().min(0).required(),
    vatAmount: joi_1.default.number().min(0).default(0),
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
        totalAmount: joi_1.default.number().min(0).optional()
    })).default([])
});
class PurchaseController {
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
        }
        catch (error) {
            console.error('Purchase getAll error:', error);
            res.status(500).json({ success: false, message: '매입 목록 조회 중 오류가 발생했습니다.' });
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
        }
        catch (error) {
            console.error('Purchase getById error:', error);
            res.status(500).json({ success: false, message: '매입 조회 중 오류가 발생했습니다.' });
        }
    }
    static async create(req, res) {
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
                const items = value.items.map((item) => purchaseItemRepository.create({
                    purchaseId: savedPurchase.id,
                    productId: item.productId || null,
                    productCode: item.productCode || '',
                    productName: item.productName,
                    spec: item.spec || '',
                    unit: item.unit || '',
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    amount: item.amount
                }));
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
        }
        catch (error) {
            console.error('Purchase create error:', error);
            res.status(500).json({ success: false, message: '매입 등록 중 오류가 발생했습니다.' });
        }
    }
    static async update(req, res) {
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
                const items = value.items.map((item) => purchaseItemRepository.create({
                    purchaseId: purchase.id,
                    productId: item.productId || null,
                    productCode: item.productCode || '',
                    productName: item.productName,
                    spec: item.spec || '',
                    unit: item.unit || '',
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    amount: item.amount
                }));
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
        }
        catch (error) {
            console.error('Purchase update error:', error);
            res.status(500).json({ success: false, message: '매입 수정 중 오류가 발생했습니다.' });
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
        }
        catch (error) {
            console.error('Purchase delete error:', error);
            res.status(500).json({ success: false, message: '매입 삭제 중 오류가 발생했습니다.' });
        }
    }
}
exports.PurchaseController = PurchaseController;
//# sourceMappingURL=PurchaseController.js.map