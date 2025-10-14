"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const envValidator_1 = require("./config/envValidator");
const database_1 = require("./config/database");
const rateLimiter_1 = require("./middleware/rateLimiter");
const securityLogger_1 = require("./middleware/securityLogger");
const httpsRedirect_1 = require("./middleware/httpsRedirect");
const csrfProtection_1 = require("./middleware/csrfProtection");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const businessRoutes_1 = require("./routes/businessRoutes");
const customerRoutes_1 = __importDefault(require("./routes/customerRoutes"));
const transactionLedgerRoutes_1 = __importDefault(require("./routes/transactionLedgerRoutes"));
// 환경변수 로드 및 검증
dotenv_1.default.config();
const validatedEnv = (0, envValidator_1.getValidatedEnv)();
const app = (0, express_1.default)();
const PORT = validatedEnv.PORT;
// HTTPS 리다이렉트 및 보안 헤더 (맨 먼저 적용)
app.use(httpsRedirect_1.httpsRedirect);
app.use(httpsRedirect_1.secureHeaders);
// 미들웨어 설정
// CSP nonce 생성 미들웨어
app.use((req, res, next) => {
    res.locals.nonce = Buffer.from(crypto_1.default.randomBytes(16)).toString('base64');
    next();
});
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
        'http://localhost:5179',
        'http://localhost:5180',
        validatedEnv.FRONTEND_URL
    ],
    credentials: true
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
// Rate Limiting 미들웨어 적용 (모든 환경에서 활성화)
app.use(rateLimiter_1.generalRateLimit);
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 보안 미들웨어 추가
app.use(securityLogger_1.securityMiddleware);
// CSRF 보호 미들웨어 추가 (모든 환경에서 활성화)
app.use(csrfProtection_1.conditionalCsrfProtection);
app.get('/api/csrf-token', csrfProtection_1.getCsrfToken);
// UTF-8 인코딩 설정
app.use((req, res, next) => {
    req.setEncoding('utf8');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});
// Static file serving for uploads
app.use('/uploads', express_1.default.static('uploads'));
// 라우트 설정 (모든 환경에서 Rate Limiting 적용)
app.use('/api/auth', rateLimiter_1.authRateLimit, authRoutes_1.default);
app.use('/api/businesses', rateLimiter_1.apiRateLimit, businessRoutes_1.businessRoutes);
app.use('/api', rateLimiter_1.apiRateLimit, customerRoutes_1.default);
app.use('/api/transaction-ledger', rateLimiter_1.apiRateLimit, transactionLedgerRoutes_1.default);
// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: validatedEnv.NODE_ENV
    });
});
// 404 핸들러
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '요청한 리소스를 찾을 수 없습니다.'
    });
});
// CSRF 에러 핸들러
app.use(csrfProtection_1.csrfErrorHandler);
// 에러 핸들러
app.use((err, req, res, _next) => {
    // 보안 로깅
    securityLogger_1.securityLogger.logError(req, err, res.statusCode || 500);
    // 운영환경에서는 상세 에러 정보 숨김
    const errorResponse = {
        success: false,
        message: validatedEnv.NODE_ENV === 'production' ?
            '서버 내부 오류가 발생했습니다.' :
            err.message,
        ...(validatedEnv.NODE_ENV === 'development' && {
            error: err.message,
            stack: err.stack
        })
    };
    res.status(500).json(errorResponse);
});
// 데이터베이스 연결 및 서버 시작
async function bootstrap() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connection established');
        // 개발환경에서 샘플 데이터 생성
        if (validatedEnv.NODE_ENV === 'development') {
            const { createSampleData } = await Promise.resolve().then(() => __importStar(require('./utils/sampleData')));
            try {
                // 기존 데이터가 있는지 확인
                const { User } = await Promise.resolve().then(() => __importStar(require('./entities/User')));
                const userRepository = database_1.AppDataSource.getRepository(User);
                const userCount = await userRepository.count();
                if (userCount === 0) {
                    await createSampleData();
                }
                else {
                    console.log('📊 기존 데이터가 있어 샘플 데이터 생성을 건너뜁니다.');
                }
            }
            catch (sampleError) {
                console.warn('⚠️ 샘플 데이터 생성 실패:', sampleError);
            }
        }
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🏢 Business API: http://localhost:${PORT}/api/businesses`);
            console.log(`👤 Test account: admin@test.com / test123!@#`);
        });
    }
    catch (error) {
        console.error('❌ Error during application startup:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map