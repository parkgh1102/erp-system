"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const database_1 = require("../config/database");
const Payment_1 = require("../entities/Payment");
const Business_1 = require("../entities/Business");
const Customer_1 = require("../entities/Customer");
const joi_1 = __importDefault(require("joi"));
const paymentRepository = database_1.AppDataSource.getRepository(Payment_1.Payment);
const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
const customerRepository = database_1.AppDataSource.getRepository(Customer_1.Customer);
const paymentSchema = joi_1.default.object({
    customerId: joi_1.default.number().integer().min(1).required(),
    paymentDate: joi_1.default.string().isoDate().required(),
    type: joi_1.default.string().valid('receipt', 'payment').required(),
    amount: joi_1.default.number().min(0).required(),
    memo: joi_1.default.string().allow('', null).optional(),
    businessId: joi_1.default.number().integer().min(1).optional()
});
class PaymentController {
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
        }
        catch (error) {
            console.error('Payment getAll error:', error);
            res.status(500).json({ success: false, message: '수금/지급 목록 조회 중 오류가 발생했습니다.' });
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
        }
        catch (error) {
            console.error('Payment getById error:', error);
            res.status(500).json({ success: false, message: '수금/지급 조회 중 오류가 발생했습니다.' });
        }
    }
    static async create(req, res) {
        try {
            console.log('📊 Payment create - request body:', JSON.stringify(req.body, null, 2));
            const { error, value } = paymentSchema.validate(req.body);
            if (error) {
                console.log('❌ Payment validation failed:', error.details.map(detail => detail.message));
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
                paymentType: value.type === 'receipt' ? Payment_1.PaymentType.RECEIPT : Payment_1.PaymentType.PAYMENT,
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
        }
        catch (error) {
            console.error('Payment create error:', error);
            res.status(500).json({ success: false, message: '수금/지급 등록 중 오류가 발생했습니다.' });
        }
    }
    static async update(req, res) {
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
                paymentType: value.type === 'receipt' ? Payment_1.PaymentType.RECEIPT : Payment_1.PaymentType.PAYMENT,
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
        }
        catch (error) {
            console.error('Payment update error:', error);
            res.status(500).json({ success: false, message: '수금/지급 수정 중 오류가 발생했습니다.' });
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
        }
        catch (error) {
            console.error('Payment delete error:', error);
            res.status(500).json({ success: false, message: '수금/지급 삭제 중 오류가 발생했습니다.' });
        }
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=PaymentController.js.map