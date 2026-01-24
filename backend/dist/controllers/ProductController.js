"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const database_1 = require("../config/database");
const Product_1 = require("../entities/Product");
const Business_1 = require("../entities/Business");
const joi_1 = __importDefault(require("joi"));
const productRepository = database_1.AppDataSource.getRepository(Product_1.Product);
const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
const productSchema = joi_1.default.object({
    productCode: joi_1.default.string().min(1).max(50).required(),
    name: joi_1.default.string().min(1).max(100).required(),
    spec: joi_1.default.string().max(50).allow('', null),
    unit: joi_1.default.string().max(20).allow('', null),
    buyPrice: joi_1.default.number().min(0).allow(null),
    sellPrice: joi_1.default.number().min(0).allow(null),
    category: joi_1.default.string().max(100).allow('', null),
    taxType: joi_1.default.string().valid('tax_separate', 'tax_inclusive', 'tax_free').default('tax_separate'),
    memo: joi_1.default.string().allow('', null)
});
exports.ProductController = {
    async create(req, res) {
        try {
            const { error, value } = productSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: '입력 정보를 확인해주세요.',
                    errors: error.details.map(detail => detail.message)
                });
            }
            const userId = req.user?.userId;
            const { businessId } = req.params;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다.'
                });
            }
            const business = await businessRepository.findOne({
                where: { id: parseInt(businessId), userId }
            });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '사업자 정보를 찾을 수 없습니다.'
                });
            }
            const existingProduct = await productRepository.findOne({
                where: {
                    productCode: value.productCode,
                    businessId: business.id,
                    isActive: true
                }
            });
            if (existingProduct) {
                return res.status(409).json({
                    success: false,
                    message: '이미 등록된 품목코드입니다.'
                });
            }
            const product = productRepository.create({
                ...value,
                businessId: business.id
            });
            const savedProduct = await productRepository.save(product);
            res.status(201).json({
                success: true,
                message: '품목이 등록되었습니다.',
                data: savedProduct
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: '품목 등록 중 오류가 발생했습니다.'
            });
        }
    },
    async getAll(req, res) {
        try {
            const userId = req.user?.userId;
            const { businessId } = req.params;
            const { page = 1, limit = 10, search } = req.query;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다.'
                });
            }
            const business = await businessRepository.findOne({
                where: { id: parseInt(businessId), userId }
            });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '사업자 정보를 찾을 수 없습니다.'
                });
            }
            const queryBuilder = productRepository.createQueryBuilder('product')
                .where('product.businessId = :businessId', { businessId })
                .andWhere('product.isActive = :isActive', { isActive: true });
            if (search) {
                queryBuilder.andWhere('(product.name LIKE :search OR product.productCode LIKE :search OR product.category LIKE :search)', { search: `%${search}%` });
            }
            const [products, total] = await queryBuilder
                .orderBy('product.createdAt', 'DESC')
                .skip((Number(page) - 1) * Number(limit))
                .take(Number(limit))
                .getManyAndCount();
            res.json({
                success: true,
                data: {
                    products,
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
            res.status(500).json({
                success: false,
                message: '품목 목록 조회 중 오류가 발생했습니다.'
            });
        }
    },
    async getById(req, res) {
        try {
            const userId = req.user?.userId;
            const { businessId, id } = req.params;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다.'
                });
            }
            const business = await businessRepository.findOne({
                where: { id: parseInt(businessId), userId }
            });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '사업자 정보를 찾을 수 없습니다.'
                });
            }
            const product = await productRepository.findOne({
                where: { id: parseInt(id), businessId: business.id, isActive: true }
            });
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: '품목을 찾을 수 없습니다.'
                });
            }
            res.json({
                success: true,
                data: product
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: '품목 조회 중 오류가 발생했습니다.'
            });
        }
    },
    async update(req, res) {
        try {
            const { error, value } = productSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: '입력 정보를 확인해주세요.',
                    errors: error.details.map(detail => detail.message)
                });
            }
            const userId = req.user?.userId;
            const { businessId, id } = req.params;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다.'
                });
            }
            const business = await businessRepository.findOne({
                where: { id: parseInt(businessId), userId }
            });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '사업자 정보를 찾을 수 없습니다.'
                });
            }
            const product = await productRepository.findOne({
                where: { id: parseInt(id), businessId: business.id, isActive: true }
            });
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: '품목을 찾을 수 없습니다.'
                });
            }
            if (value.productCode !== product.productCode) {
                const existingProduct = await productRepository.findOne({
                    where: {
                        productCode: value.productCode,
                        businessId: business.id,
                        isActive: true
                    }
                });
                if (existingProduct) {
                    return res.status(409).json({
                        success: false,
                        message: '이미 등록된 품목코드입니다.'
                    });
                }
            }
            Object.assign(product, value);
            const updatedProduct = await productRepository.save(product);
            res.json({
                success: true,
                message: '품목이 수정되었습니다.',
                data: updatedProduct
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: '품목 수정 중 오류가 발생했습니다.'
            });
        }
    },
    async delete(req, res) {
        try {
            const userId = req.user?.userId;
            const { businessId, id } = req.params;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다.'
                });
            }
            const business = await businessRepository.findOne({
                where: { id: parseInt(businessId), userId }
            });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '사업자 정보를 찾을 수 없습니다.'
                });
            }
            const product = await productRepository.findOne({
                where: { id: parseInt(id), businessId: business.id, isActive: true }
            });
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: '품목을 찾을 수 없습니다.'
                });
            }
            product.isActive = false;
            await productRepository.save(product);
            res.json({
                success: true,
                message: '품목이 삭제되었습니다.'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: '품목 삭제 중 오류가 발생했습니다.'
            });
        }
    }
};
//# sourceMappingURL=ProductController.js.map