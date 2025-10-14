"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidatedEnv = exports.validateEnv = void 0;
const joi_1 = __importDefault(require("joi"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').default('development'),
    PORT: joi_1.default.number().positive().default(3001),
    FRONTEND_URL: joi_1.default.string().uri().required(),
    // 데이터베이스 설정
    DB_TYPE: joi_1.default.string().valid('sqlite', 'mysql', 'postgres').required(),
    DB_DATABASE: joi_1.default.string().required(),
    DB_HOST: joi_1.default.string().when('DB_TYPE', {
        is: joi_1.default.valid('mysql', 'postgres'),
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    DB_PORT: joi_1.default.number().when('DB_TYPE', {
        is: joi_1.default.valid('mysql', 'postgres'),
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    DB_USERNAME: joi_1.default.string().when('DB_TYPE', {
        is: joi_1.default.valid('mysql', 'postgres'),
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    DB_PASSWORD: joi_1.default.string().when('DB_TYPE', {
        is: joi_1.default.valid('mysql', 'postgres'),
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    // JWT 설정
    JWT_SECRET: joi_1.default.string().min(32).required(),
    JWT_EXPIRES_IN: joi_1.default.string().default('15m'),
    JWT_REFRESH_SECRET: joi_1.default.string().min(32).required(),
    JWT_REFRESH_EXPIRES_IN: joi_1.default.string().default('7d'),
    // 파일 업로드 설정
    UPLOAD_PATH: joi_1.default.string().default('./uploads'),
    MAX_FILE_SIZE: joi_1.default.number().positive().default(10485760),
    // 보안 설정
    BCRYPT_ROUNDS: joi_1.default.number().min(10).max(15).default(12),
    RATE_LIMIT_WINDOW_MS: joi_1.default.number().positive().default(900000),
    RATE_LIMIT_MAX: joi_1.default.number().positive().default(100),
    // 로깅 설정
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    LOG_FILE: joi_1.default.string().default('logs/app.log'),
    // SSL 설정 (선택사항)
    SSL_KEY_PATH: joi_1.default.string().optional(),
    SSL_CERT_PATH: joi_1.default.string().optional(),
    FORCE_HTTPS: joi_1.default.boolean().default(false)
}).unknown();
const validateEnv = () => {
    const { error, value } = envSchema.validate(process.env);
    if (error) {
        const missingVars = error.details.map(detail => detail.path.join('.'));
        throw new Error(`환경변수 검증 실패: ${error.message}\n누락된 변수들: ${missingVars.join(', ')}`);
    }
    // 보안 검증 강화 (모든 환경)
    if (value.JWT_SECRET.length < 64) {
        throw new Error('JWT_SECRET은 64자 이상이어야 합니다.');
    }
    if (value.JWT_REFRESH_SECRET.length < 64) {
        throw new Error('JWT_REFRESH_SECRET은 64자 이상이어야 합니다.');
    }
    if (value.BCRYPT_ROUNDS < 12) {
        throw new Error('BCRYPT_ROUNDS는 12 이상이어야 합니다.');
    }
    // 기본 시크릿 키 사용 방지
    const defaultSecrets = [
        'your-secret-key',
        'your_very_strong_jwt_secret_key_here_at_least_32_characters',
        'CHANGE_THIS_IN_PRODUCTION_TO_STRONG_SECRET_KEY',
        'default-secret-key'
    ];
    if (defaultSecrets.includes(value.JWT_SECRET)) {
        throw new Error('기본 JWT_SECRET을 사용할 수 없습니다. 강력한 랜덤 키로 변경하세요.');
    }
    if (defaultSecrets.includes(value.JWT_REFRESH_SECRET)) {
        throw new Error('기본 JWT_REFRESH_SECRET을 사용할 수 없습니다. 강력한 랜덤 키로 변경하세요.');
    }
    // 시크릿 키 동일성 검사
    if (value.JWT_SECRET === value.JWT_REFRESH_SECRET) {
        throw new Error('JWT_SECRET과 JWT_REFRESH_SECRET은 서로 다른 값이어야 합니다.');
    }
    // 운영환경 추가 검증
    if (value.NODE_ENV === 'production') {
        if (!value.FORCE_HTTPS) {
            console.warn('⚠️  경고: 운영환경에서는 FORCE_HTTPS를 true로 설정하는 것이 권장됩니다.');
        }
        if (value.DB_TYPE === 'sqlite') {
            console.warn('⚠️  경고: 운영환경에서 SQLite 사용은 권장되지 않습니다. MySQL 또는 PostgreSQL 사용을 고려하세요.');
        }
    }
    return value;
};
exports.validateEnv = validateEnv;
const getValidatedEnv = () => {
    try {
        return (0, exports.validateEnv)();
    }
    catch (error) {
        console.error('환경변수 검증 실패:', error);
        process.exit(1);
    }
};
exports.getValidatedEnv = getValidatedEnv;
//# sourceMappingURL=envValidator.js.map