"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const UserBusinessAccess_1 = require("../entities/UserBusinessAccess");
const Business_1 = require("../entities/Business");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("../utils/logger");
const userRepository = database_1.AppDataSource.getRepository(User_1.User);
const accessRepository = database_1.AppDataSource.getRepository(UserBusinessAccess_1.UserBusinessAccess);
const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
const createUserSchema = joi_1.default.object({
    phone: joi_1.default.string().required(),
    password: joi_1.default.string().pattern(/^\d{4}$/).required().messages({
        'string.pattern.base': '비밀번호는 숫자 4자리여야 합니다.'
    }),
    name: joi_1.default.string().min(1).required(),
    role: joi_1.default.string().valid('admin', 'sales_viewer').required(),
    businessId: joi_1.default.number().optional(),
    businessIds: joi_1.default.array().items(joi_1.default.number()).optional() // 다중 사업자 접근
}).unknown(true);
const updateUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().optional(),
    name: joi_1.default.string().min(2).optional(),
    phone: joi_1.default.string().pattern(/^[0-9-+\s()]+$/).allow('').optional(),
    password: joi_1.default.string().pattern(/^\d{4}$/).optional().messages({
        'string.pattern.base': '비밀번호는 숫자 4자리여야 합니다.'
    }),
    role: joi_1.default.string().valid('admin', 'sales_viewer').optional(),
    businessId: joi_1.default.number().optional(),
    businessIds: joi_1.default.array().items(joi_1.default.number()).optional(),
    isActive: joi_1.default.boolean().optional()
});
exports.UserController = {
    // 사업자별 사용자 목록 조회
    async getUsers(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            // 해당 사업자에 접근 가능한 사용자 조회
            const accessList = await accessRepository.find({
                where: { businessId },
                relations: ['user']
            });
            // 기존 방식 (businessId로 직접 연결된 사용자) 도 포함
            const directUsers = await userRepository.find({
                where: { businessId },
                select: ['id', 'email', 'name', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt']
            });
            // 중복 제거하여 합치기
            const userMap = new Map();
            for (const user of directUsers) {
                userMap.set(user.id, user);
            }
            for (const access of accessList) {
                if (access.user && !userMap.has(access.user.id)) {
                    const { password, ...userWithoutPassword } = access.user;
                    userMap.set(access.user.id, userWithoutPassword);
                }
            }
            // 각 사용자의 접근 가능한 사업자 목록 조회
            const usersWithAccess = await Promise.all(Array.from(userMap.values()).map(async (user) => {
                const userAccess = await accessRepository.find({
                    where: { userId: user.id },
                    relations: ['business']
                });
                return {
                    ...user,
                    businessIds: userAccess.map(a => a.businessId),
                    businesses: userAccess.map(a => ({ id: a.business?.id, companyName: a.business?.companyName }))
                };
            }));
            res.json({
                success: true,
                data: usersWithAccess
            });
        }
        catch (error) {
            logger_1.logger.error('Get users error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '사용자 목록 조회 중 오류가 발생했습니다.'
            });
        }
    },
    // 사용자 생성
    async createUser(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const { error, value } = createUserSchema.validate(req.body);
            if (error) {
                logger_1.logger.warn('User create validation error', { errors: error.details.map(d => d.message) });
                return res.status(400).json({
                    success: false,
                    message: error.details.map(detail => detail.message).join(', '),
                    errors: error.details.map(detail => detail.message)
                });
            }
            const { password, name, phone, role, businessIds } = value;
            // 전화번호 중복 체크
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const users = await userRepository.find();
            const existingUser = users.find(u => u.phone && u.phone.replace(/[^0-9]/g, '') === cleanPhone);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: '이미 사용 중인 전화번호입니다.'
                });
            }
            // 비밀번호 해싱
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            // 사용자 생성 (전화번호를 이메일로 사용)
            const user = userRepository.create({
                email: `${cleanPhone}@phone.local`,
                password: hashedPassword,
                name,
                phone,
                role,
                businessId,
                isActive: true
            });
            const savedUser = await userRepository.save(user);
            // 다중 사업자 접근 권한 설정
            const accessBusinessIds = businessIds && businessIds.length > 0 ? businessIds : [businessId];
            for (const bizId of accessBusinessIds) {
                const access = accessRepository.create({
                    userId: savedUser.id,
                    businessId: bizId
                });
                await accessRepository.save(access);
            }
            // 비밀번호 제외하고 반환
            const { password: _, ...userWithoutPassword } = savedUser;
            res.status(201).json({
                success: true,
                data: { ...userWithoutPassword, businessIds: accessBusinessIds },
                message: '사용자가 생성되었습니다.'
            });
        }
        catch (error) {
            logger_1.logger.error('Create user error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '사용자 생성 중 오류가 발생했습니다.'
            });
        }
    },
    // 사용자 수정
    async updateUser(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const { error, value } = updateUserSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: '입력 정보를 확인해주세요.',
                    errors: error.details.map(detail => detail.message)
                });
            }
            const user = await userRepository.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }
            // 이메일 변경 시 중복 체크
            if (value.email && value.email !== user.email) {
                const existingUser = await userRepository.findOne({ where: { email: value.email } });
                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        message: '이미 사용 중인 이메일입니다.'
                    });
                }
            }
            // businessIds가 있으면 접근 권한 업데이트
            if (value.businessIds) {
                // 기존 접근 권한 삭제
                await accessRepository.delete({ userId });
                // 새 접근 권한 추가
                for (const bizId of value.businessIds) {
                    const access = accessRepository.create({
                        userId,
                        businessId: bizId
                    });
                    await accessRepository.save(access);
                }
                delete value.businessIds; // User 엔티티에는 저장하지 않음
            }
            // 비밀번호가 있으면 해싱
            if (value.password) {
                value.password = await bcryptjs_1.default.hash(value.password, 10);
            }
            // 사용자 정보 업데이트
            Object.assign(user, value);
            const updatedUser = await userRepository.save(user);
            // 접근 가능한 사업자 목록 조회
            const userAccess = await accessRepository.find({
                where: { userId },
                relations: ['business']
            });
            // 비밀번호 제외하고 반환
            const { password: _, ...userWithoutPassword } = updatedUser;
            res.json({
                success: true,
                data: {
                    ...userWithoutPassword,
                    businessIds: userAccess.map(a => a.businessId),
                    businesses: userAccess.map(a => ({ id: a.business?.id, companyName: a.business?.companyName }))
                },
                message: '사용자 정보가 수정되었습니다.'
            });
        }
        catch (error) {
            logger_1.logger.error('Update user error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '사용자 수정 중 오류가 발생했습니다.'
            });
        }
    },
    // 사용자 삭제
    async deleteUser(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const user = await userRepository.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }
            await userRepository.remove(user);
            res.json({
                success: true,
                message: '사용자가 삭제되었습니다.'
            });
        }
        catch (error) {
            logger_1.logger.error('Delete user error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '사용자 삭제 중 오류가 발생했습니다.'
            });
        }
    },
    // 사용자 비활성화/활성화
    async toggleUserStatus(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const user = await userRepository.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }
            user.isActive = !user.isActive;
            const updatedUser = await userRepository.save(user);
            // 비밀번호 제외하고 반환
            const { password: _, ...userWithoutPassword } = updatedUser;
            res.json({
                success: true,
                data: userWithoutPassword,
                message: `사용자가 ${user.isActive ? '활성화' : '비활성화'}되었습니다.`
            });
        }
        catch (error) {
            logger_1.logger.error('Toggle user status error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '사용자 상태 변경 중 오류가 발생했습니다.'
            });
        }
    }
};
//# sourceMappingURL=UserController.js.map