"use strict";
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
const express_session_1 = __importDefault(require("express-session"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envValidator_1 = require("./config/envValidator");
const database_1 = require("./config/database");
const rateLimiter_1 = require("./middleware/rateLimiter");
const securityLogger_1 = require("./middleware/securityLogger");
const httpsRedirect_1 = require("./middleware/httpsRedirect");
const sessionConfig_1 = require("./config/sessionConfig");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const businessRoutes_1 = require("./routes/businessRoutes");
const transactionLedgerRoutes_1 = __importDefault(require("./routes/transactionLedgerRoutes"));
const settings_1 = __importDefault(require("./routes/settings"));
const activityLogRoutes_1 = __importDefault(require("./routes/activityLogRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const otpRoutes_1 = __importDefault(require("./routes/otpRoutes"));
const chatbotRoutes_1 = __importDefault(require("./routes/chatbotRoutes"));
const excelRoutes_1 = __importDefault(require("./routes/excelRoutes"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const validatedEnv = (0, envValidator_1.getValidatedEnv)();
const app = (0, express_1.default)();
const PORT = validatedEnv.PORT;
// Render/Vercel 등 프록시 뒤에서 실행될 때 필요한 설정
// X-Forwarded-For 헤더를 신뢰하여 클라이언트 IP를 올바르게 인식
app.set('trust proxy', 1);
// =============================================
// CORS 설정 - 반드시 다른 미들웨어보다 먼저 적용
// =============================================
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'http://192.168.0.140:5173',
    'https://webapperp.ai.kr',
    'https://www.webapperp.ai.kr',
    'https://api.webapperp.ai.kr',
    'https://erp-system-production-3ea2.up.railway.app',
    // Vercel 배포 URL
    'https://webapperp.vercel.app',
    'https://webapperp-bkjnoq76a-blackallstar12-86948-projects.vercel.app',
    'https://erp-frontend.vercel.app',
    'https://erp-frontend-git-main.vercel.app'
];
if (validatedEnv.FRONTEND_URL && !allowedOrigins.includes(validatedEnv.FRONTEND_URL)) {
    allowedOrigins.push(validatedEnv.FRONTEND_URL);
}
// CORS 미들웨어 설정
const corsOptions = {
    origin: (origin, callback) => {
        // 프로덕션에서는 origin이 없는 요청 거부 (보안 강화)
        if (!origin) {
            if (validatedEnv.NODE_ENV === 'production') {
                return callback(new Error('CORS policy: Origin required'), false);
            }
            return callback(null, true); // 개발환경에서는 허용
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400, // preflight 캐시 24시간
    preflightContinue: false,
    optionsSuccessStatus: 204
};
// CORS 미들웨어 적용
app.use((0, cors_1.default)(corsOptions));
// OPTIONS preflight 요청 명시적 처리 (모든 경로)
app.options('*', (0, cors_1.default)(corsOptions));
// =============================================
// 보안 미들웨어
// =============================================
app.use(httpsRedirect_1.httpsRedirect);
app.use(httpsRedirect_1.secureHeaders);
app.use((req, res, next) => {
    res.locals.nonce = Buffer.from(crypto_1.default.randomBytes(16)).toString('base64');
    next();
});
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()');
    next();
});
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(rateLimiter_1.generalRateLimit);
app.use((0, cookie_parser_1.default)());
app.use((0, express_session_1.default)(sessionConfig_1.sessionConfig));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(securityLogger_1.securityMiddleware);
// 정적 파일 제공 (uploads) - 먼저 설정하여 JSON 헤더 영향 받지 않음
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads'), {
    setHeaders: (res, filePath) => {
        // 이미지 파일 MIME 타입 자동 설정
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        }
        else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        }
    }
}));
app.use((req, res, next) => {
    // /uploads 경로는 이미 처리됨, JSON API에만 헤더 설정
    if (!req.path.startsWith('/uploads')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    next();
});
app.use('/api/auth', rateLimiter_1.authRateLimit, authRoutes_1.default);
app.use('/api/otp', otpRoutes_1.default);
app.use('/api/businesses', businessRoutes_1.businessRoutes);
app.use('/api/businesses', userRoutes_1.default);
app.use('/api/transaction-ledger', transactionLedgerRoutes_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/activity-logs', activityLogRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/chatbot', chatbotRoutes_1.default);
app.use('/api/excel', excelRoutes_1.default);
// 데이터베이스 연결 상태 추적
let isDatabaseConnected = false;
// Health check endpoints - 서버가 먼저 시작되어야 함
app.get('/health', (req, res) => {
    const memoryUsage = process.memoryUsage();
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: validatedEnv.NODE_ENV,
        database: isDatabaseConnected ? 'connected' : 'connecting',
        uptime: Math.floor(process.uptime()),
        memory: {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
        }
    });
});
app.get('/api/health', (req, res) => {
    // Render 헬스체크용 - 서버가 살아있으면 OK 응답
    const memoryUsage = process.memoryUsage();
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: validatedEnv.NODE_ENV,
        service: 'erp-backend',
        database: isDatabaseConnected ? 'connected' : 'connecting',
        uptime: Math.floor(process.uptime()),
        memory: {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
        }
    });
});
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: '요청한 리소스를 찾을 수 없습니다.' });
});
app.use((err, req, res, _next) => {
    securityLogger_1.securityLogger.logError(req, err, res.statusCode || 500);
    const errorResponse = {
        success: false,
        message: validatedEnv.NODE_ENV === 'production' ? '서버 내부 오류가 발생했습니다.' : err.message,
        ...(validatedEnv.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
    };
    res.status(500).json(errorResponse);
});
async function bootstrap() {
    // 1. 데이터베이스 먼저 연결 (최대 3회 재시도)
    let retries = 3;
    let connected = false;
    while (retries > 0 && !connected) {
        try {
            console.log(`⏳ Connecting to database... (attempts remaining: ${retries})`);
            await database_1.AppDataSource.initialize();
            isDatabaseConnected = true;
            connected = true;
            console.log('✅ Database connected successfully');
        }
        catch (error) {
            retries--;
            console.error(`❌ Database connection failed (attempts remaining: ${retries}):`, error);
            if (retries > 0) {
                console.log('🔄 Retrying in 3 seconds...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            else {
                console.error('⚠️ All database connection attempts failed');
                if (validatedEnv.NODE_ENV === 'production') {
                    // 프로덕션에서는 치명적 오류로 간주하고 프로세스 종료
                    console.error('💥 Exiting due to database connection failure');
                    process.exit(1);
                }
            }
        }
    }
    // 2. HTTP 서버 시작
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Health: http://localhost:${PORT}/health`);
        console.log(`✅ Server is ready to accept requests`);
        console.log(`📅 Deployment time: ${new Date().toISOString()}`);
        console.log(`🔍 로그인 성능 모니터링 활성화됨`);
    });
    // 서버 타임아웃 설정 (3분)
    server.timeout = 180000;
    server.keepAliveTimeout = 65000; // Azure/AWS ALB 기본값보다 큰 값
    server.headersTimeout = 66000; // keepAliveTimeout보다 약간 큰 값
    // Graceful shutdown - SIGTERM
    process.on('SIGTERM', () => {
        console.log('⏸️ SIGTERM signal received: closing HTTP server');
        server.close(async () => {
            console.log('🔌 HTTP server closed');
            if (database_1.AppDataSource.isInitialized) {
                await database_1.AppDataSource.destroy();
                console.log('🔌 Database connection closed');
            }
            process.exit(0);
        });
    });
    // Graceful shutdown - SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
        console.log('⏸️ SIGINT signal received: closing HTTP server');
        server.close(async () => {
            console.log('🔌 HTTP server closed');
            if (database_1.AppDataSource.isInitialized) {
                await database_1.AppDataSource.destroy();
                console.log('🔌 Database connection closed');
            }
            process.exit(0);
        });
    });
}
// 전역 예외 처리 - 서버 크래시 방지
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // 로깅 후 프로세스 유지 (Azure가 자동 재시작 관리)
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // 로깅 후 프로세스 유지
});
bootstrap();
//# sourceMappingURL=index.js.map