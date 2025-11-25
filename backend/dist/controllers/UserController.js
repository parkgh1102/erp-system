"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("../utils/logger");
const userRepository = database_1.AppDataSource.getRepository(User_1.User);
const createUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
    name: joi_1.default.string().min(2).required(),
    phone: joi_1.default.string().pattern(/^[0-9-+\s()]+$/).allow(''),
    role: joi_1.default.string().valid('admin', 'sales_viewer').required(),
    businessId: joi_1.default.number().optional()
});
const updateUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().optional(),
    name: joi_1.default.string().min(2).optional(),
    phone: joi_1.default.string().pattern(/^[0-9-+\s()]+$/).allow('').optional(),
    role: joi_1.default.string().valid('admin', 'sales_viewer').optional(),
    businessId: joi_1.default.number().optional(),
    isActive: joi_1.default.boolean().optional()
});
exports.UserController = {
    // 사업자별 사용자 목록 조회
    async getUsers(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const users = await userRepository.find({
                where: { businessId },
                select: ['id', 'email', 'name', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt']
            });
            res.json({
                success: true,
                data: users
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
                return res.status(400).json({
                    success: false,
                    message: '입력 정보를 확인해주세요.',
                    errors: error.details.map(detail => detail.message)
                });
            }
            const { email, password, name, phone, role } = value;
            // 이메일 중복 체크
            const existingUser = await userRepository.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: '이미 사용 중인 이메일입니다.'
                });
            }
            // 비밀번호 해싱
            const hashedPassword = await bcrypt_1.default.hash(password, 12);
            // 사용자 생성
            const user = userRepository.create({
                email,
                password: hashedPassword,
                name,
                phone,
                role,
                businessId,
                isActive: true
            });
            const savedUser = await userRepository.save(user);
            // 비밀번호 제외하고 반환
            const { password: _, ...userWithoutPassword } = savedUser;
            res.status(201).json({
                success: true,
                data: userWithoutPassword,
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
            // 사용자 정보 업데이트
            Object.assign(user, value);
            const updatedUser = await userRepository.save(user);
            // 비밀번호 제외하고 반환
            const { password: _, ...userWithoutPassword } = updatedUser;
            res.json({
                success: true,
                data: userWithoutPassword,
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