"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessController = void 0;
const database_1 = require("../config/database");
const Business_1 = require("../entities/Business");
const validation_1 = require("../utils/validation");
const joi_1 = __importDefault(require("joi"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
const businessSchema = joi_1.default.object({
    businessNumber: joi_1.default.string().length(12).pattern(/^[0-9-]+$/).required(),
    companyName: joi_1.default.string().max(200).required(),
    representative: joi_1.default.string().max(100).required(),
    businessType: joi_1.default.string().max(100).optional(),
    businessItem: joi_1.default.string().max(100).optional(),
    address: joi_1.default.string().max(500).optional(),
    phone: joi_1.default.string().max(20).optional(),
    fax: joi_1.default.string().max(20).optional(),
    email: joi_1.default.string().email().max(100).optional(),
    homepage: joi_1.default.string().uri().max(200).optional()
});
const businessUpdateSchema = joi_1.default.object({
    businessNumber: joi_1.default.string().length(12).pattern(/^[0-9-]+$/).optional(),
    companyName: joi_1.default.string().max(200).required(),
    representative: joi_1.default.string().max(100).required(),
    businessType: joi_1.default.string().max(100).optional(),
    businessItem: joi_1.default.string().max(100).optional(),
    address: joi_1.default.string().max(500).optional(),
    phone: joi_1.default.string().max(20).optional(),
    fax: joi_1.default.string().max(20).optional(),
    email: joi_1.default.string().email().max(100).optional(),
    homepage: joi_1.default.string().uri().max(200).optional()
});
class BusinessController {
    // 모든 사업자 조회
    static async getAll(req, res) {
        try {
            const { page = 1, limit = 10, search } = req.query;
            const take = Number(limit);
            const skip = (Number(page) - 1) * take;
            let query = businessRepository.createQueryBuilder('business')
                .where('business.isActive = :isActive', { isActive: true });
            if (search) {
                query = query.andWhere('(business.companyName LIKE :search OR business.businessNumber LIKE :search OR business.representative LIKE :search)', { search: `%${search}%` });
            }
            const [businesses, total] = await query
                .orderBy('business.createdAt', 'DESC')
                .take(take)
                .skip(skip)
                .getManyAndCount();
            res.json({
                success: true,
                data: businesses,
                pagination: {
                    page: Number(page),
                    limit: take,
                    total,
                    totalPages: Math.ceil(total / take)
                }
            });
        }
        catch (error) {
            console.error('Error fetching businesses:', error);
            res.status(500).json({
                success: false,
                message: '사업자 목록 조회 중 오류가 발생했습니다.'
            });
        }
    }
    // 특정 사업자 조회
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const business = await businessRepository.findOne({
                where: { id: Number(id), isActive: true }
            });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '사업자를 찾을 수 없습니다.'
                });
            }
            res.json({
                success: true,
                data: business
            });
        }
        catch (error) {
            console.error('Error fetching business:', error);
            res.status(500).json({
                success: false,
                message: '사업자 조회 중 오류가 발생했습니다.'
            });
        }
    }
    // 사업자 생성
    static async create(req, res) {
        try {
            const { error, value } = (0, validation_1.validate)(businessSchema, req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: '입력 데이터가 올바르지 않습니다.',
                    errors: error.details
                });
            }
            // 사업자번호 중복 확인
            const existingBusiness = await businessRepository.findOne({
                where: { businessNumber: value.businessNumber }
            });
            if (existingBusiness) {
                return res.status(409).json({
                    success: false,
                    message: '이미 등록된 사업자번호입니다.'
                });
            }
            const business = businessRepository.create(value);
            const savedBusiness = await businessRepository.save(business);
            res.status(201).json({
                success: true,
                message: '사업자가 성공적으로 등록되었습니다.',
                data: savedBusiness
            });
        }
        catch (error) {
            console.error('Error creating business:', error);
            res.status(500).json({
                success: false,
                message: '사업자 등록 중 오류가 발생했습니다.'
            });
        }
    }
    // 사업자 수정
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { error, value } = (0, validation_1.validate)(businessUpdateSchema, req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: '입력 데이터가 올바르지 않습니다.',
                    errors: error.details
                });
            }
            const business = await businessRepository.findOne({
                where: { id: Number(id), isActive: true }
            });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '사업자를 찾을 수 없습니다.'
                });
            }
            // 사업자번호 변경 시 중복 확인
            if (value.businessNumber && value.businessNumber !== business.businessNumber) {
                const existingBusiness = await businessRepository.findOne({
                    where: { businessNumber: value.businessNumber }
                });
                if (existingBusiness) {
                    return res.status(409).json({
                        success: false,
                        message: '이미 등록된 사업자번호입니다.'
                    });
                }
            }
            Object.assign(business, value);
            const updatedBusiness = await businessRepository.save(business);
            res.json({
                success: true,
                message: '사업자 정보가 성공적으로 수정되었습니다.',
                data: updatedBusiness
            });
        }
        catch (error) {
            console.error('Error updating business:', error);
            res.status(500).json({
                success: false,
                message: '사업자 수정 중 오류가 발생했습니다.'
            });
        }
    }
    // 사업자 삭제 (소프트 삭제)
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const business = await businessRepository.findOne({
                where: { id: Number(id), isActive: true }
            });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '사업자를 찾을 수 없습니다.'
                });
            }
            business.isActive = false;
            await businessRepository.save(business);
            res.json({
                success: true,
                message: '사업자가 성공적으로 삭제되었습니다.'
            });
        }
        catch (error) {
            console.error('Error deleting business:', error);
            res.status(500).json({
                success: false,
                message: '사업자 삭제 중 오류가 발생했습니다.'
            });
        }
    }
    // 사업자번호 유효성 검증
    static async validateBusinessNumber(req, res) {
        try {
            const { businessNumber } = req.params;
            // 사업자번호 형식 검증
            if (!/^[0-9]{3}-[0-9]{2}-[0-9]{5}$/.test(businessNumber)) {
                return res.status(400).json({
                    success: false,
                    message: '올바른 사업자번호 형식이 아닙니다. (예: 123-45-67890)'
                });
            }
            // 중복 확인
            const existingBusiness = await businessRepository.findOne({
                where: { businessNumber }
            });
            res.json({
                success: true,
                isValid: !existingBusiness,
                message: existingBusiness ? '이미 등록된 사업자번호입니다.' : '사용 가능한 사업자번호입니다.'
            });
        }
        catch (error) {
            console.error('Error validating business number:', error);
            res.status(500).json({
                success: false,
                message: '사업자번호 검증 중 오류가 발생했습니다.'
            });
        }
    }
    // 도장 이미지 조회
    static async getSealImage(req, res) {
        try {
            const { id } = req.params;
            const business = await businessRepository.findOne({
                where: { id: Number(id), isActive: true }
            });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '사업자를 찾을 수 없습니다.'
                });
            }
            if (!business.sealImage) {
                return res.status(404).json({
                    success: false,
                    message: '등록된 도장 이미지가 없습니다.'
                });
            }
            // Base64 데이터인 경우 (data:image/로 시작)
            if (business.sealImage.startsWith('data:')) {
                const matches = business.sealImage.match(/^data:([^;]+);base64,(.+)$/);
                if (matches) {
                    const contentType = matches[1];
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');
                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Content-Length', buffer.length);
                    return res.send(buffer);
                }
            }
            // 파일 경로인 경우 (레거시 지원)
            const imagePath = path_1.default.join(process.cwd(), business.sealImage);
            if (!fs_1.default.existsSync(imagePath)) {
                console.warn(`Seal image file not found: ${imagePath}, clearing DB reference`);
                business.sealImage = undefined;
                await businessRepository.save(business);
                return res.status(404).json({
                    success: false,
                    message: '도장 이미지 파일을 찾을 수 없습니다.'
                });
            }
            const ext = path_1.default.extname(imagePath).toLowerCase();
            let contentType = 'image/png';
            if (ext === '.jpg' || ext === '.jpeg') {
                contentType = 'image/jpeg';
            }
            else if (ext === '.gif') {
                contentType = 'image/gif';
            }
            res.setHeader('Content-Type', contentType);
            fs_1.default.createReadStream(imagePath).pipe(res);
        }
        catch (error) {
            console.error('Error getting seal image:', error);
            res.status(500).json({
                success: false,
                message: '도장 이미지 조회 중 오류가 발생했습니다.'
            });
        }
    }
    // 도장 이미지 업로드
    static async uploadSealImage(req, res) {
        try {
            const { id } = req.params;
            const file = req.file;
            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '파일이 첨부되지 않았습니다.'
                });
            }
            const business = await businessRepository.findOne({
                where: { id: Number(id), isActive: true }
            });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '사업자를 찾을 수 없습니다.'
                });
            }
            // 기존 도장 이미지 삭제
            if (business.sealImage) {
                try {
                    const oldImagePath = path_1.default.join(process.cwd(), business.sealImage);
                    if (fs_1.default.existsSync(oldImagePath)) {
                        fs_1.default.unlinkSync(oldImagePath);
                    }
                }
                catch (err) {
                    console.warn('Failed to delete old seal image:', err);
                }
            }
            // 새 도장 이미지 저장 - Base64로 DB에 저장
            const ext = path_1.default.extname(file.originalname).toLowerCase();
            let mimeType = 'image/png';
            if (ext === '.jpg' || ext === '.jpeg')
                mimeType = 'image/jpeg';
            else if (ext === '.gif')
                mimeType = 'image/gif';
            const base64Data = `data:${mimeType};base64,${file.buffer.toString('base64')}`;
            business.sealImage = base64Data;
            const updatedBusiness = await businessRepository.save(business);
            res.json({
                success: true,
                message: '도장 이미지가 성공적으로 업로드되었습니다.',
                data: {
                    sealImage: updatedBusiness.sealImage
                }
            });
        }
        catch (error) {
            console.error('Error uploading seal image:', error?.message || error);
            res.status(500).json({
                success: false,
                message: '도장 이미지 업로드 중 오류가 발생했습니다.'
            });
        }
    }
    // 도장 이미지 삭제
    static async deleteSealImage(req, res) {
        try {
            const { id } = req.params;
            const business = await businessRepository.findOne({
                where: { id: Number(id), isActive: true }
            });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '사업자를 찾을 수 없습니다.'
                });
            }
            if (business.sealImage) {
                // 파일 경로인 경우에만 파일 삭제 시도 (Base64가 아닌 경우)
                if (!business.sealImage.startsWith('data:')) {
                    try {
                        const imagePath = path_1.default.join(process.cwd(), business.sealImage);
                        if (fs_1.default.existsSync(imagePath)) {
                            fs_1.default.unlinkSync(imagePath);
                        }
                    }
                    catch (err) {
                        console.warn('Failed to delete seal image file:', err);
                    }
                }
                business.sealImage = undefined;
                await businessRepository.save(business);
            }
            res.json({
                success: true,
                message: '도장 이미지가 삭제되었습니다.'
            });
        }
        catch (error) {
            console.error('Error deleting seal image:', error);
            res.status(500).json({
                success: false,
                message: '도장 이미지 삭제 중 오류가 발생했습니다.'
            });
        }
    }
}
exports.BusinessController = BusinessController;
//# sourceMappingURL=BusinessController.js.map