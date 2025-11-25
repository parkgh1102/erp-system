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
            styleSrc: ["'self'", "'unsafe-inline'"],
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
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
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
}));
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
app.use('/api/otp', rateLimiter_1.authRateLimit, otpRoutes_1.default);
app.use('/api/businesses', rateLimiter_1.apiRateLimit, businessRoutes_1.businessRoutes);
app.use('/api/businesses', rateLimiter_1.apiRateLimit, userRoutes_1.default);
app.use('/api/transaction-ledger', rateLimiter_1.apiRateLimit, transactionLedgerRoutes_1.default);
app.use('/api/settings', rateLimiter_1.apiRateLimit, settings_1.default);
app.use('/api/activity-logs', rateLimiter_1.apiRateLimit, activityLogRoutes_1.default);
app.use('/api/notifications', rateLimiter_1.apiRateLimit, notificationRoutes_1.default);
app.use('/api/chatbot', rateLimiter_1.apiRateLimit, chatbotRoutes_1.default);
app.use('/api/excel', rateLimiter_1.apiRateLimit, excelRoutes_1.default);
// 데이터베이스 연결 상태 추적
let isDatabaseConnected = false;
// Health check endpoints - 서버가 먼저 시작되어야 함
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: validatedEnv.NODE_ENV,
        database: isDatabaseConnected ? 'connected' : 'connecting'
    });
});
app.get('/api/health', (req, res) => {
    // Render 헬스체크용 - 서버가 살아있으면 OK 응답
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: validatedEnv.NODE_ENV,
        service: 'erp-backend',
        database: isDatabaseConnected ? 'connected' : 'connecting'
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
    // 1. HTTP 서버를 먼저 시작 (헬스체크가 응답할 수 있도록)
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Health: http://localhost:${PORT}/health`);
        console.log(`⏳ Connecting to database...`);
    });
    // 2. 데이터베이스 연결 (비동기)
    try {
        await database_1.AppDataSource.initialize();
        isDatabaseConnected = true;
        console.log('✅ Database connected');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        // 데이터베이스 연결 실패해도 서버는 유지 (재시도 가능)
        // 하지만 API 요청은 실패할 것임
        // 프로덕션에서는 일정 시간 후 재시도
        if (validatedEnv.NODE_ENV === 'production') {
            console.log('🔄 Retrying database connection in 5 seconds...');
            setTimeout(async () => {
                try {
                    await database_1.AppDataSource.initialize();
                    isDatabaseConnected = true;
                    console.log('✅ Database connected (retry successful)');
                }
                catch (retryError) {
                    console.error('❌ Database connection retry failed:', retryError);
                    console.error('⚠️ Server is running but database is not connected');
                }
            }, 5000);
        }
    }
}
bootstrap();
//# sourceMappingURL=index.js.map