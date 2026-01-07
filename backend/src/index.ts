import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { getValidatedEnv } from './config/envValidator';
import { AppDataSource } from './config/database';
import { generalRateLimit, authRateLimit, apiRateLimit } from './middleware/rateLimiter';
import { securityMiddleware, securityLogger } from './middleware/securityLogger';
import { httpsRedirect, secureHeaders } from './middleware/httpsRedirect';
import { sessionConfig } from './config/sessionConfig';
import authRoutes from './routes/authRoutes';
import { businessRoutes } from './routes/businessRoutes';
import transactionLedgerRoutes from './routes/transactionLedgerRoutes';
import settingsRoutes from './routes/settings';
import activityLogRoutes from './routes/activityLogRoutes';
import notificationRoutes from './routes/notificationRoutes';
import userRoutes from './routes/userRoutes';
import otpRoutes from './routes/otpRoutes';
import chatbotRoutes from './routes/chatbotRoutes';
import excelRoutes from './routes/excelRoutes';

dotenv.config({ path: path.join(__dirname, '../.env') });
const validatedEnv = getValidatedEnv();

const app = express();
const PORT = validatedEnv.PORT;

// Render/Vercel 등 프록시 뒤에서 실행될 때 필요한 설정
// X-Forwarded-For 헤더를 신뢰하여 클라이언트 IP를 올바르게 인식
app.set('trust proxy', 1);

app.use(httpsRedirect);
app.use(secureHeaders);

app.use((req, res, next) => {
  res.locals.nonce = Buffer.from(crypto.randomBytes(16)).toString('base64');
  next();
});

app.use(helmet({
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

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
}));

app.use(compression());
app.use(morgan('combined'));
app.use(generalRateLimit);
app.use(cookieParser());
app.use(session(sessionConfig));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(securityMiddleware);

// 정적 파일 제공 (uploads) - 먼저 설정하여 JSON 헤더 영향 받지 않음
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    // 이미지 파일 MIME 타입 자동 설정
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
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

app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/businesses', userRoutes);
app.use('/api/transaction-ledger', transactionLedgerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/excel', excelRoutes);

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

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  securityLogger.logError(req, err, res.statusCode || 500);
  
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
      await AppDataSource.initialize();
      isDatabaseConnected = true;
      connected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      retries--;
      console.error(`❌ Database connection failed (attempts remaining: ${retries}):`, error);

      if (retries > 0) {
        console.log('🔄 Retrying in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
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
  });

  // Graceful shutdown - SIGTERM
  process.on('SIGTERM', () => {
    console.log('⏸️ SIGTERM signal received: closing HTTP server');
    server.close(async () => {
      console.log('🔌 HTTP server closed');
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
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
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
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
