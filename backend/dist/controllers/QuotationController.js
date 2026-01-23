"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationController = void 0;
const database_1 = require("../config/database");
const Quotation_1 = require("../entities/Quotation");
const QuotationItem_1 = require("../entities/QuotationItem");
const Business_1 = require("../entities/Business");
const Customer_1 = require("../entities/Customer");
const User_1 = require("../entities/User");
const joi_1 = __importDefault(require("joi"));
const quotationRepository = database_1.AppDataSource.getRepository(Quotation_1.Quotation);
const quotationItemRepository = database_1.AppDataSource.getRepository(QuotationItem_1.QuotationItem);
const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
const customerRepository = database_1.AppDataSource.getRepository(Customer_1.Customer);
const userRepository = database_1.AppDataSource.getRepository(User_1.User);
const quotationSchema = joi_1.default.object({
    customerId: joi_1.default.number().integer().min(1).allow(null),
    quotationNumber: joi_1.default.string().required(),
    quotationDate: joi_1.default.string().isoDate().required(),
    validUntil: joi_1.default.string().isoDate().required(),
    supplyAmount: joi_1.default.number().default(0),
    vatAmount: joi_1.default.number().default(0),
    totalAmount: joi_1.default.number().required(),
    memo: joi_1.default.string().allow('', null).optional(),
    paymentTerms: joi_1.default.string().allow('', null).optional(),
    deliveryTerms: joi_1.default.string().allow('', null).optional(),
    status: joi_1.default.string().valid('draft', 'sent', 'accepted', 'rejected', 'expired').default('draft'),
    items: joi_1.default.array().items(joi_1.default.object({
        productId: joi_1.default.number().integer().min(1).allow(null).optional(),
        itemName: joi_1.default.string().required(),
        specification: joi_1.default.string().allow('', null).optional(),
        unit: joi_1.default.string().allow('', null).optional(),
        quantity: joi_1.default.number().required(),
        unitPrice: joi_1.default.number().required(),
        supplyAmount: joi_1.default.number().required(),
        vatAmount: joi_1.default.number().default(0),
        remark: joi_1.default.string().allow('', null).optional()
    })).default([])
});
class QuotationController {
    static async getAll(req, res) {
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
        }
        catch (error) {
            console.error('Quotation getAll error:', error);
            res.status(500).json({ success: false, message: '견적서 목록 조회 중 오류가 발생했습니다.' });
        }
    }
    static async getById(req, res) {
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
        }
        catch (error) {
            console.error('Quotation getById error:', error);
            res.status(500).json({ success: false, message: '견적서 조회 중 오류가 발생했습니다.' });
        }
    }
    static async create(req, res) {
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
        }
        catch (error) {
            console.error('Quotation create error:', error);
            res.status(500).json({ success: false, message: '견적서 등록 중 오류가 발생했습니다.' });
        }
    }
    static async update(req, res) {
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
        }
        catch (error) {
            console.error('Quotation update error:', error);
            res.status(500).json({ success: false, message: '견적서 수정 중 오류가 발생했습니다.' });
        }
    }
    static async delete(req, res) {
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
        }
        catch (error) {
            console.error('Quotation delete error:', error);
            res.status(500).json({ success: false, message: '견적서 삭제 중 오류가 발생했습니다.' });
        }
    }
    static async getNextNumber(req, res) {
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
        }
        catch (error) {
            console.error('Quotation getNextNumber error:', error);
            res.status(500).json({ success: false, message: '견적번호 생성 중 오류가 발생했습니다.' });
        }
    }
}
exports.QuotationController = QuotationController;
//# sourceMappingURL=QuotationController.js.map