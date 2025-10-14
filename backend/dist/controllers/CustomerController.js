"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const database_1 = require("../config/database");
const Customer_1 = require("../entities/Customer");
const Business_1 = require("../entities/Business");
const logger_1 = require("../utils/logger");
const joi_1 = __importDefault(require("joi"));
const customerRepository = database_1.AppDataSource.getRepository(Customer_1.Customer);
const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
const customerSchema = joi_1.default.object({
    customerCode: joi_1.default.string().max(50).allow('', null).optional(),
    name: joi_1.default.string().min(1).max(200).required(),
    businessNumber: joi_1.default.string().allow('', null).optional().custom((value, helpers) => {
        if (!value)
            return value;
        const cleaned = value.replace(/-/g, '');
        if (!/^\d{10}$/.test(cleaned)) {
            return helpers.error('any.invalid');
        }
        return cleaned;
    }),
    customerType: joi_1.default.string().valid('매출처', '매입처', '기타', 'sales', 'purchase', 'other').default('기타'),
    phone: joi_1.default.string().max(20).allow('', null).optional(),
    email: joi_1.default.string().email().max(100).allow('', null).optional(),
    address: joi_1.default.string().max(500).allow('', null).optional(),
    representative: joi_1.default.string().max(100).allow('', null).optional(),
    // 추가 필드들 (엔티티에 없지만 프론트엔드에서 전송되는 필드들 - 무시됨)
    fax: joi_1.default.string().max(20).allow('', null).optional(),
    managerContact: joi_1.default.string().max(100).allow('', null).optional(),
    businessType: joi_1.default.string().max(100).allow('', null).optional(),
    businessItem: joi_1.default.string().max(100).allow('', null).optional(),
    memo: joi_1.default.string().max(500).allow('', null).optional()
}).options({ stripUnknown: true });
exports.CustomerController = {
    async create(req, res) {
        try {
            const { error, value } = customerSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: '입력 정보를 확인해주세요.',
                    errors: error.details.map(detail => detail.message)
                });
            }
            const userId = req.user?.userId;
            const { businessId } = req.params;
            // Business lookup
            let business;
            if (userId) {
                business = await businessRepository.findOne({
                    where: { id: parseInt(businessId), userId }
                });
            }
            else {
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
            // customerCode 자동 생성
            const maxCustomerCode = await customerRepository.createQueryBuilder('customer')
                .select('MAX(CAST(SUBSTRING(customer.customerCode, 2) AS INTEGER))', 'maxCode')
                .where('customer.businessId = :businessId', { businessId: business.id })
                .andWhere('customer.customerCode LIKE :pattern', { pattern: 'C%' })
                .getRawOne();
            const nextNumber = (maxCustomerCode.maxCode || 0) + 1;
            const customerCode = `C${nextNumber.toString().padStart(4, '0')}`;
            if (value.businessNumber) {
                const existingCustomer = await customerRepository.findOne({
                    where: {
                        businessNumber: value.businessNumber,
                        businessId: business.id,
                        isActive: true
                    }
                });
                if (existingCustomer) {
                    return res.status(409).json({
                        success: false,
                        message: '이미 등록된 사업자번호입니다.'
                    });
                }
            }
            const customer = customerRepository.create({
                ...value,
                customerCode,
                businessId: business.id
            });
            const savedCustomer = await customerRepository.save(customer);
            res.status(201).json({
                success: true,
                message: '거래처가 등록되었습니다.',
                data: savedCustomer
            });
        }
        catch (error) {
            logger_1.logger.error('Create customer error:', error);
            res.status(500).json({
                success: false,
                message: '거래처 등록 중 오류가 발생했습니다.'
            });
        }
    },
    async getAll(req, res) {
        try {
            const userId = req.user?.userId;
            const { businessId } = req.params;
            const { page = 1, limit = 10, search, type, sortField, sortOrder } = req.query;
            // 개발 환경에서는 userId 체크 생략
            let business;
            if (userId) {
                business = await businessRepository.findOne({
                    where: { id: parseInt(businessId), userId }
                });
            }
            else {
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
            const queryBuilder = customerRepository.createQueryBuilder('customer')
                .where('customer.businessId = :businessId', { businessId })
                .andWhere('customer.isActive = :isActive', { isActive: true });
            if (search) {
                queryBuilder.andWhere('(customer.name LIKE :search OR customer.businessNumber LIKE :search)', { search: `%${search}%` });
            }
            if (type) {
                queryBuilder.andWhere('customer.customerType = :type', { type });
            }
            // 정렬 처리
            if (sortField && sortOrder) {
                const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
                queryBuilder.orderBy(`customer.${sortField}`, orderDirection);
            }
            else {
                queryBuilder.orderBy('customer.createdAt', 'DESC');
            }
            const [customers, total] = await queryBuilder
                .skip((Number(page) - 1) * Number(limit))
                .take(Number(limit))
                .getManyAndCount();
            res.json({
                success: true,
                data: {
                    customers,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit))
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get customers error:', error);
            res.status(500).json({
                success: false,
                message: '거래처 목록 조회 중 오류가 발생했습니다.'
            });
        }
    },
    async getById(req, res) {
        try {
            const userId = req.user?.userId;
            const { businessId, id } = req.params;
            // Business lookup
            let business;
            if (userId) {
                business = await businessRepository.findOne({
                    where: { id: parseInt(businessId), userId }
                });
            }
            else {
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
            const customer = await customerRepository.findOne({
                where: { id: parseInt(id), businessId: business.id, isActive: true }
            });
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: '거래처를 찾을 수 없습니다.'
                });
            }
            res.json({
                success: true,
                data: customer
            });
        }
        catch (error) {
            logger_1.logger.error('Get customer error:', error);
            res.status(500).json({
                success: false,
                message: '거래처 조회 중 오류가 발생했습니다.'
            });
        }
    },
    async update(req, res) {
        try {
            const { error, value } = customerSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: '입력 정보를 확인해주세요.',
                    errors: error.details.map(detail => detail.message)
                });
            }
            const userId = req.user?.userId;
            const { businessId, id } = req.params;
            // Business lookup
            let business;
            if (userId) {
                business = await businessRepository.findOne({
                    where: { id: parseInt(businessId), userId }
                });
            }
            else {
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
            const customer = await customerRepository.findOne({
                where: { id: parseInt(id), businessId: business.id, isActive: true }
            });
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: '거래처를 찾을 수 없습니다.'
                });
            }
            if (value.businessNumber) {
                if (value.businessNumber !== customer.businessNumber) {
                    const existingCustomer = await customerRepository.findOne({
                        where: {
                            businessNumber: value.businessNumber,
                            businessId: business.id,
                            isActive: true
                        }
                    });
                    if (existingCustomer) {
                        return res.status(409).json({
                            success: false,
                            message: '이미 등록된 사업자번호입니다.'
                        });
                    }
                }
            }
            Object.assign(customer, value);
            const updatedCustomer = await customerRepository.save(customer);
            res.json({
                success: true,
                message: '거래처가 수정되었습니다.',
                data: updatedCustomer
            });
        }
        catch (error) {
            logger_1.logger.error('Update customer error:', error);
            res.status(500).json({
                success: false,
                message: '거래처 수정 중 오류가 발생했습니다.'
            });
        }
    },
    async delete(req, res) {
        try {
            const userId = req.user?.userId;
            const { businessId, id } = req.params;
            // Business lookup
            let business;
            if (userId) {
                business = await businessRepository.findOne({
                    where: { id: parseInt(businessId), userId }
                });
            }
            else {
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
            const customer = await customerRepository.findOne({
                where: { id: parseInt(id), businessId: business.id, isActive: true }
            });
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: '거래처를 찾을 수 없습니다.'
                });
            }
            customer.isActive = false;
            await customerRepository.save(customer);
            res.json({
                success: true,
                message: '거래처가 삭제되었습니다.'
            });
        }
        catch (error) {
            logger_1.logger.error('Delete customer error:', error);
            res.status(500).json({
                success: false,
                message: '거래처 삭제 중 오류가 발생했습니다.'
            });
        }
    }
};
//# sourceMappingURL=CustomerController.js.map