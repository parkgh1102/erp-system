"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Business_1 = require("../entities/Business");
const CompanySettings_1 = require("../entities/CompanySettings");
const UserBusinessAccess_1 = require("../entities/UserBusinessAccess");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const securityLogger_1 = require("../middleware/securityLogger");
const passwordValidator_1 = require("../utils/passwordValidator");
const logger_1 = require("../utils/logger");
const envValidator_1 = require("../config/envValidator");
const ActivityLogController_1 = require("./ActivityLogController");
const AlimtalkService_1 = require("../services/AlimtalkService");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const userRepository = database_1.AppDataSource.getRepository(User_1.User);
const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
const companySettingsRepository = database_1.AppDataSource.getRepository(CompanySettings_1.CompanySettings);
const signupSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: passwordValidator_1.passwordSchema.required(),
    name: joi_1.default.string().min(2).required(),
    phone: joi_1.default.string().pattern(/^[0-9-+\s()]+$/).required(),
    businessInfo: joi_1.default.object({
        businessNumber: joi_1.default.string().pattern(/^\d{3}-\d{2}-\d{5}$/).required(),
        companyName: joi_1.default.string().min(1).max(200).required(),
        representative: joi_1.default.string().min(1).max(100).required(),
        businessType: joi_1.default.string().max(100).allow(''),
        businessItem: joi_1.default.string().max(100).allow(''),
        address: joi_1.default.string().max(500).allow(''),
        phone: joi_1.default.string().pattern(/^[0-9-+\s()]+$/).max(20).allow(''),
        fax: joi_1.default.string().pattern(/^[0-9-+\s()]+$/).max(20).allow('')
    }).required()
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().allow('', null).optional(),
    phone: joi_1.default.string().pattern(/^[0-9-]+$/).allow('', null).optional(),
    password: joi_1.default.string().required()
}).or('email', 'phone');
exports.AuthController = {
    async signup(req, res) {
        try {
            logger_1.logger.info('Signup request received');
            const { error, value } = signupSchema.validate(req.body);
            if (error) {
                logger_1.logger.warn('Signup validation failed', { errorCount: error.details.length });
                return res.status(400).json({
                    success: false,
                    message: '입력 정보를 확인해주세요.',
                    errors: error.details.map(detail => detail.message)
                });
            }
            const { email, password, name, phone, businessInfo } = value;
            const existingUser = await userRepository.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: '이미 사용 중인 이메일입니다.'
                });
            }
            const existingBusiness = await businessRepository.findOne({
                where: { businessNumber: businessInfo.businessNumber.replace(/-/g, '') }
            });
            if (existingBusiness) {
                return res.status(409).json({
                    success: false,
                    message: '이미 등록된 사업자번호입니다.'
                });
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            const user = userRepository.create({
                email,
                password: hashedPassword,
                name,
                phone
            });
            const savedUser = await userRepository.save(user);
            const business = businessRepository.create({
                userId: savedUser.id,
                businessNumber: businessInfo.businessNumber.replace(/-/g, ''),
                companyName: businessInfo.companyName,
                representative: businessInfo.representative,
                businessType: businessInfo.businessType,
                businessItem: businessInfo.businessItem,
                address: businessInfo.address,
                phone: businessInfo.phone,
                fax: businessInfo.fax
            });
            await businessRepository.save(business);
            // 기본 보안 설정 저장 (2단계 인증 기본값: ON)
            const defaultSettings = [
                { businessId: business.id, settingKey: 'twoFactorAuth', settingValue: 'true' },
                { businessId: business.id, settingKey: 'sessionTimeout', settingValue: '8h' }
            ];
            for (const setting of defaultSettings) {
                const newSetting = companySettingsRepository.create(setting);
                await companySettingsRepository.save(newSetting);
            }
            // 회원가입 환영 알림톡 전송 (비동기로 처리하여 응답 지연 방지)
            AlimtalkService_1.AlimtalkService.sendWelcome(savedUser.phone, savedUser.name, businessInfo.companyName)
                .then((sent) => {
                if (sent) {
                    logger_1.logger.info('회원가입 환영 알림톡 전송 성공', { userId: savedUser.id, phone: savedUser.phone });
                }
                else {
                    logger_1.logger.warn('회원가입 환영 알림톡 전송 실패', { userId: savedUser.id, phone: savedUser.phone });
                }
            })
                .catch((error) => {
                logger_1.logger.error('회원가입 환영 알림톡 전송 중 오류', error);
            });
            const env = (0, envValidator_1.getValidatedEnv)();
            const token = jsonwebtoken_1.default.sign({ userId: savedUser.id, email: savedUser.email, businessId: business.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: savedUser.id, email: savedUser.email, businessId: business.id, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
            logger_1.logger.info('Signup completed successfully');
            // HttpOnly 쿠키로 토큰 설정
            res.cookie('authToken', token, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 15 * 60 * 1000 // 15분
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
            });
            res.status(201).json({
                success: true,
                message: '회원가입이 완료되었습니다.',
                data: {
                    token,
                    user: {
                        id: savedUser.id,
                        email: savedUser.email,
                        name: savedUser.name,
                        phone: savedUser.phone
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Signup error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '회원가입 중 오류가 발생했습니다.'
            });
        }
    },
    async login(req, res) {
        try {
            const { error, value } = loginSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message || '이메일/전화번호와 비밀번호를 입력해주세요.'
                });
            }
            const { email, phone, password } = value;
            const env = (0, envValidator_1.getValidatedEnv)();
            // 1단계: 사용자 검색 (relations 없이 빠르게)
            let user = null;
            if (email) {
                user = await userRepository.findOne({
                    where: { email, isActive: true }
                });
            }
            else if (phone) {
                // 전화번호 정규화 후 LIKE 패턴으로 검색 (더 빠름)
                const cleanPhone = phone.replace(/[^0-9]/g, '');
                // 다양한 형식 지원: 01012345678, 010-1234-5678, 010.1234.5678
                user = await userRepository
                    .createQueryBuilder('user')
                    .where('user.isActive = :isActive', { isActive: true })
                    .andWhere('REPLACE(REPLACE(REPLACE(user.phone, \'-\', \'\'), \' \', \'\'), \'.\', \'\') = :phone', { phone: cleanPhone })
                    .getOne();
            }
            if (!user) {
                securityLogger_1.securityLogger.logAuthFailure(req, 'Login failed: User not found', { email, phone });
                return res.status(401).json({
                    success: false,
                    message: '아이디 또는 비밀번호가 틀립니다.'
                });
            }
            // 2단계: 비밀번호 검증 (가장 CPU 집약적)
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                securityLogger_1.securityLogger.logAuthFailure(req, 'Login failed: Invalid password', { email, phone, userId: user.id });
                return res.status(401).json({
                    success: false,
                    message: '아이디 또는 비밀번호가 틀립니다.'
                });
            }
            // 로그인 성공 로깅 (비동기)
            securityLogger_1.securityLogger.logAuthSuccess(req, user.id);
            // 3단계: 병렬 쿼리 실행 (businesses + settings + sales_viewer 권한)
            const businessId = user.businessId || 0;
            const accessRepository = database_1.AppDataSource.getRepository(UserBusinessAccess_1.UserBusinessAccess);
            // 병렬 Promise 배열 구성
            const parallelQueries = [
                // 비즈니스 조회 (admin용)
                user.role === 'admin'
                    ? businessRepository.find({ where: { userId: user.id, isActive: true } })
                    : Promise.resolve([]),
                // 보안 설정 조회
                companySettingsRepository
                    .createQueryBuilder('settings')
                    .where('settings.businessId = :businessId', { businessId: businessId || 1 })
                    .andWhere('settings.settingKey IN (:...keys)', { keys: ['sessionTimeout', 'twoFactorAuth'] })
                    .getMany()
                    .catch(() => []),
                // sales_viewer 권한 조회
                user.role === 'sales_viewer'
                    ? accessRepository
                        .createQueryBuilder('access')
                        .innerJoinAndSelect('access.business', 'business')
                        .where('access.userId = :userId', { userId: user.id })
                        .andWhere('business.isActive = :isActive', { isActive: true })
                        .select([
                        'access.id',
                        'business.id', 'business.businessNumber', 'business.companyName',
                        'business.representative', 'business.businessType', 'business.businessItem',
                        'business.address', 'business.phone', 'business.fax'
                    ])
                        .getMany()
                    : Promise.resolve([])
            ];
            const [businesses, settings, accessList] = await Promise.all(parallelQueries);
            // 비즈니스 설정
            if (user.role === 'admin') {
                user.businesses = businesses;
            }
            else if (user.role === 'sales_viewer') {
                if (accessList.length > 0) {
                    user.businesses = accessList.map((a) => a.business).filter((b) => b);
                }
                else if (user.businessId) {
                    const business = await businessRepository.findOne({
                        where: { id: user.businessId, isActive: true }
                    });
                    user.businesses = business ? [business] : [];
                }
                else {
                    user.businesses = [];
                }
            }
            // businessId 최종 결정
            const finalBusinessId = user.businessId || user.businesses?.[0]?.id || 0;
            // 보안 설정 파싱
            let sessionTimeoutHours = 8;
            let twoFactorAuth = true;
            let sessionTimeout = '8h';
            const MAX_SESSION_TIMEOUT_HOURS = 24; // 최대 24시간
            const settingsMap = new Map(settings.map((s) => [s.settingKey, s.settingValue]));
            const timeoutValue = settingsMap.get('sessionTimeout');
            if (timeoutValue) {
                sessionTimeout = timeoutValue;
                const hours = parseInt(timeoutValue.replace('h', ''));
                if (!isNaN(hours) && hours > 0) {
                    sessionTimeoutHours = Math.min(hours, MAX_SESSION_TIMEOUT_HOURS);
                }
            }
            const twoFactorValue = settingsMap.get('twoFactorAuth');
            if (twoFactorValue !== undefined) {
                twoFactorAuth = twoFactorValue === 'true';
            }
            // 활동 로그 기록 (비동기 - 응답 차단 안함)
            (0, ActivityLogController_1.logActivity)('login', 'user', user.id, '사용자가 로그인했습니다.', req, { email: user.email })
                .catch(err => logger_1.logger.error('Activity log error:', err));
            const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, businessId: finalBusinessId }, env.JWT_SECRET, { expiresIn: `${sessionTimeoutHours}h` });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, businessId: finalBusinessId, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: `${sessionTimeoutHours * 2}h` });
            // HttpOnly 쿠키로 토큰 설정
            const cookieMaxAge = sessionTimeoutHours * 60 * 60 * 1000;
            res.cookie('authToken', token, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: cookieMaxAge
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: cookieMaxAge * 2
            });
            // try {
            //   const SecuritySettings = (await import('../entities/SecuritySettings')).SecuritySettings;
            //   const securitySettingsRepo = AppDataSource.getRepository(SecuritySettings);
            //   const settings = await securitySettingsRepo.findOne({
            //     where: { userId: user.id }
            //   });
            //   if (settings) {
            //     twoFactorAuth = settings.twoFactorAuth;
            //     sessionTimeout = settings.sessionTimeout || '24h';
            //   }
            // } catch (err) {
            //   // 보안 설정 조회 실패 시 기본값 사용
            //   logger.error('Security settings query error:', err);
            // }
            res.json({
                success: true,
                message: '로그인되었습니다.',
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        phone: user.phone,
                        role: user.role,
                        businesses: user.businesses
                    },
                    security: {
                        twoFactorAuth,
                        sessionTimeout
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Login error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '로그인 중 오류가 발생했습니다.'
            });
        }
    },
    async getProfile(req, res) {
        try {
            const userId = req.user?.userId;
            const user = await userRepository.findOne({
                where: { id: userId },
                relations: ['businesses']
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }
            // sales_viewer인 경우 businessId로 비즈니스 정보 조회
            if (user.role === 'sales_viewer' && user.businessId) {
                const business = await businessRepository.findOne({
                    where: { id: user.businessId }
                });
                if (business) {
                    user.businesses = [business];
                }
            }
            res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    role: user.role,
                    avatar: user.avatar ? `/uploads/avatars/${user.avatar}` : null,
                    businesses: user.businesses,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get profile error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '프로필 조회 중 오류가 발생했습니다.'
            });
        }
    },
    async updateProfile(req, res) {
        try {
            const userId = req.user?.userId;
            const { name, phone } = req.body;
            const user = await userRepository.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }
            user.name = name || user.name;
            user.phone = phone || user.phone;
            await userRepository.save(user);
            res.json({
                success: true,
                message: '프로필이 업데이트되었습니다.',
                data: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Update profile error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '프로필 업데이트 중 오류가 발생했습니다.'
            });
        }
    },
    async changePassword(req, res) {
        try {
            const userId = req.user?.userId;
            // Joi 스키마로 검증
            const { error, value } = passwordValidator_1.changePasswordSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }
            const { currentPassword, newPassword } = value;
            const user = await userRepository.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: '현재 비밀번호가 올바르지 않습니다.'
                });
            }
            const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
            user.password = hashedNewPassword;
            await userRepository.save(user);
            res.json({
                success: true,
                message: '비밀번호가 변경되었습니다.'
            });
        }
        catch (error) {
            logger_1.logger.error('Change password error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '비밀번호 변경 중 오류가 발생했습니다.'
            });
        }
    },
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: '리프레시 토큰이 필요합니다.'
                });
            }
            const env = (0, envValidator_1.getValidatedEnv)();
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env.JWT_REFRESH_SECRET);
            if (decoded.type !== 'refresh') {
                return res.status(403).json({
                    success: false,
                    message: '유효하지 않은 리프레시 토큰입니다.'
                });
            }
            const user = await userRepository.findOne({
                where: { id: decoded.userId, isActive: true },
                relations: ['businesses']
            });
            if (!user) {
                return res.status(403).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }
            // businessId 결정: sales_viewer는 user.businessId, admin은 첫 번째 비즈니스
            const businessId = user.businessId || user.businesses[0]?.id || 0;
            // 세션 타임아웃 설정 조회
            let sessionTimeoutHours = 8; // 기본값 8시간
            if (businessId) {
                const settingsRepository = database_1.AppDataSource.getRepository(CompanySettings_1.CompanySettings);
                const settings = await settingsRepository.findOne({
                    where: { businessId, settingKey: 'sessionTimeout' }
                });
                if (settings && settings.settingValue) {
                    const timeoutValue = settings.settingValue;
                    const hours = parseInt(timeoutValue.replace('h', ''));
                    if (!isNaN(hours) && hours > 0) {
                        sessionTimeoutHours = hours;
                    }
                }
            }
            const newToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, businessId }, env.JWT_SECRET, { expiresIn: `${sessionTimeoutHours}h` });
            const newRefreshToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, businessId, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
            // HttpOnly 쿠키로 새 토큰 설정 (세션 타임아웃 반영)
            res.cookie('authToken', newToken, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: sessionTimeoutHours * 60 * 60 * 1000 // 설정된 시간
            });
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
            });
            res.json({
                success: true,
                message: '토큰이 갱신되었습니다.',
                data: {
                    token: newToken
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Refresh token error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(403).json({
                success: false,
                message: '토큰 갱신에 실패했습니다.'
            });
        }
    },
    async logout(req, res) {
        try {
            // 쿠키 삭제
            res.clearCookie('authToken');
            res.clearCookie('refreshToken');
            res.json({
                success: true,
                message: '로그아웃되었습니다.'
            });
        }
        catch (error) {
            logger_1.logger.error('Logout error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '로그아웃 중 오류가 발생했습니다.'
            });
        }
    },
    async checkEmailAvailability(req, res) {
        try {
            const { email } = req.query;
            if (!email || typeof email !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: '이메일을 입력해주세요.'
                });
            }
            // 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: '올바른 이메일 형식이 아닙니다.',
                    available: false
                });
            }
            const existingUser = await userRepository.findOne({ where: { email } });
            const isAvailable = !existingUser;
            res.json({
                success: true,
                available: isAvailable,
                message: isAvailable ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.'
            });
        }
        catch (error) {
            logger_1.logger.error('Email availability check error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '이메일 중복 확인 중 오류가 발생했습니다.',
                available: false
            });
        }
    },
    async uploadAvatar(req, res) {
        try {
            const userId = req.user?.userId;
            const file = req.file;
            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '이미지 파일을 선택해주세요.'
                });
            }
            const user = await userRepository.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }
            // 기존 아바타 파일 삭제 (선택사항)
            if (user.avatar) {
                const oldFilePath = path_1.default.join(__dirname, '../../uploads/avatars', user.avatar);
                if (fs_1.default.existsSync(oldFilePath)) {
                    fs_1.default.unlinkSync(oldFilePath);
                }
            }
            // 파일명만 저장 (경로는 제외)
            user.avatar = file.filename;
            await userRepository.save(user);
            const avatarUrl = `/uploads/avatars/${file.filename}`;
            res.json({
                success: true,
                message: '프로필 사진이 업데이트되었습니다.',
                data: {
                    avatar: avatarUrl
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Avatar upload error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '프로필 사진 업로드 중 오류가 발생했습니다.'
            });
        }
    },
    // 아이디 찾기
    async findUsername(req, res) {
        try {
            const { companyName, businessNumber, phone } = req.body;
            if (!companyName || !businessNumber) {
                return res.status(400).json({
                    success: false,
                    message: '회사명과 사업자등록번호를 입력해주세요.'
                });
            }
            // 사업자 정보로 사업체 찾기
            const cleanedBusinessNumber = businessNumber.replace(/[^0-9]/g, '');
            const cleanedPhone = phone ? phone.replace(/[^0-9]/g, '') : null;
            // 먼저 회사명과 사업자번호로 검색
            const businesses = await businessRepository.find({
                where: {
                    companyName,
                    businessNumber: cleanedBusinessNumber
                },
                relations: ['user']
            });
            if (businesses.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
                });
            }
            // 전화번호가 제공된 경우 추가 필터링
            let business = businesses[0];
            if (cleanedPhone && businesses.length > 1) {
                const matchedBusiness = businesses.find(b => b.phone && b.phone.replace(/[^0-9]/g, '') === cleanedPhone);
                if (matchedBusiness) {
                    business = matchedBusiness;
                }
            }
            if (!business) {
                return res.status(404).json({
                    success: false,
                    message: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
                });
            }
            // 이메일 일부 마스킹 (보안)
            const email = business.user.email;
            const [localPart, domain] = email.split('@');
            const maskedEmail = localPart.length > 3
                ? localPart.substring(0, 3) + '***@' + domain
                : localPart.substring(0, 1) + '***@' + domain;
            logger_1.logger.info('Username found successfully');
            res.json({
                success: true,
                data: {
                    email: maskedEmail,
                    fullEmail: email,
                    name: business.user.name
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Find username error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '아이디 찾기 중 오류가 발생했습니다.'
            });
        }
    },
    // 비밀번호 재설정을 위한 정보 확인
    async verifyPasswordReset(req, res) {
        try {
            const { email, companyName, businessNumber, phone } = req.body;
            logger_1.logger.info('Password reset verification request', { email, companyName, businessNumber, hasPhone: !!phone });
            if (!email || !companyName || !businessNumber) {
                return res.status(400).json({
                    success: false,
                    message: '이메일, 회사명, 사업자등록번호를 입력해주세요.'
                });
            }
            // 사용자 찾기
            const user = await userRepository.findOne({
                where: { email },
                relations: ['businesses']
            });
            if (!user) {
                logger_1.logger.warn('User not found for password reset', { email });
                return res.status(404).json({
                    success: false,
                    message: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
                });
            }
            logger_1.logger.info('User found, checking businesses', {
                userId: user.id,
                businessCount: user.businesses.length,
                businesses: user.businesses.map(b => ({
                    companyName: b.companyName,
                    businessNumber: b.businessNumber
                }))
            });
            // 사업자 정보 확인
            const cleanedBusinessNumber = businessNumber.replace(/[^0-9]/g, '');
            const cleanedPhone = phone ? phone.replace(/[^0-9]/g, '') : null;
            const business = user.businesses.find(b => {
                const businessMatches = b.companyName === companyName &&
                    b.businessNumber === cleanedBusinessNumber;
                // 전화번호가 제공된 경우 전화번호도 확인
                if (cleanedPhone && b.phone) {
                    return businessMatches && b.phone.replace(/[^0-9]/g, '') === cleanedPhone;
                }
                return businessMatches;
            });
            if (!business) {
                logger_1.logger.warn('Business not matched for password reset', {
                    email,
                    companyName,
                    businessNumber: cleanedBusinessNumber,
                    phone: cleanedPhone
                });
                return res.status(404).json({
                    success: false,
                    message: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
                });
            }
            // 임시 토큰 생성 (5분 유효)
            const env = (0, envValidator_1.getValidatedEnv)();
            const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '5m' });
            logger_1.logger.info('Password reset verified successfully', { userId: user.id });
            res.json({
                success: true,
                data: {
                    resetToken,
                    email: user.email
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Verify password reset error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '비밀번호 찾기 중 오류가 발생했습니다.'
            });
        }
    },
    // 비밀번호 재설정
    async resetPassword(req, res) {
        try {
            const { resetToken, newPassword } = req.body;
            if (!resetToken || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: '필수 정보가 누락되었습니다.'
                });
            }
            // 비밀번호 유효성 검사
            const { error } = passwordValidator_1.passwordSchema.validate(newPassword);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }
            // 토큰 검증
            const env = (0, envValidator_1.getValidatedEnv)();
            let decoded;
            try {
                decoded = jsonwebtoken_1.default.verify(resetToken, env.JWT_SECRET);
            }
            catch (err) {
                return res.status(401).json({
                    success: false,
                    message: '유효하지 않거나 만료된 토큰입니다.'
                });
            }
            // 사용자 찾기
            const user = await userRepository.findOne({
                where: { id: decoded.userId }
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }
            // 새 비밀번호 해시화 및 저장
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
            user.password = hashedPassword;
            await userRepository.save(user);
            securityLogger_1.securityLogger.logPasswordReset(user.id, user.email);
            logger_1.logger.info('Password reset successfully', { userId: user.id });
            res.json({
                success: true,
                message: '비밀번호가 성공적으로 변경되었습니다.'
            });
        }
        catch (error) {
            logger_1.logger.error('Reset password error occurred', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '비밀번호 재설정 중 오류가 발생했습니다.'
            });
        }
    }
};
//# sourceMappingURL=AuthController.js.map