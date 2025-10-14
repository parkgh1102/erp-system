import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getValidatedEnv } from './config/envValidator';
import { AppDataSource } from './config/database';
import { generalRateLimit, authRateLimit, apiRateLimit } from './middleware/rateLimiter';
import { securityMiddleware, securityLogger } from './middleware/securityLogger';
import { httpsRedirect, secureHeaders } from './middleware/httpsRedirect';
import { conditionalCsrfProtection, getCsrfToken, csrfErrorHandler } from './middleware/csrfProtection';
import authRoutes from './routes/authRoutes';
import { businessRoutes } from './routes/businessRoutes';
import transactionLedgerRoutes from './routes/transactionLedgerRoutes';

// 환경변수 로드 및 검증
dotenv.config();
const validatedEnv = getValidatedEnv();

const app = express();
const PORT = validatedEnv.PORT;

// HTTPS 리다이렉트 및 보안 헤더 (맨 먼저 적용)
app.use(httpsRedirect);
app.use(secureHeaders);

// 미들웨어 설정
// CSP nonce 생성 미들웨어
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

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'http://192.168.0.140:5173',
    validatedEnv.FRONTEND_URL
  ],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));

// Rate Limiting 미들웨어 적용 (모든 환경에서 활성화)
app.use(generalRateLimit);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 보안 미들웨어 추가
app.use(securityMiddleware);

// CSRF 보호 미들웨어 추가 (모든 환경에서 활성화)
app.use(conditionalCsrfProtection);
app.get('/api/csrf-token', getCsrfToken);

// UTF-8 인코딩 설정
app.use((req, res, next) => {
  req.setEncoding('utf8');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// 라우트 설정 (모든 환경에서 Rate Limiting 적용)
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/businesses', apiRateLimit, businessRoutes);
app.use('/api/transaction-ledger', apiRateLimit, transactionLedgerRoutes);

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
app.use(csrfErrorHandler);

// 에러 핸들러
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // 보안 로깅
  securityLogger.logError(req, err, res.statusCode || 500);

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
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // 개발환경에서 샘플 데이터 생성
    if (validatedEnv.NODE_ENV === 'development') {
      const { createSampleData } = await import('./utils/sampleData');
      try {
        // 기존 데이터가 있는지 확인
        const { User } = await import('./entities/User');
        const userRepository = AppDataSource.getRepository(User);
        const userCount = await userRepository.count();

        if (userCount === 0) {
          await createSampleData();
        } else {
          console.log('📊 기존 데이터가 있어 샘플 데이터 생성을 건너뜁니다.');
        }
      } catch (sampleError) {
        console.warn('⚠️ 샘플 데이터 생성 실패:', sampleError);
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🏢 Business API: http://localhost:${PORT}/api/businesses`);
      console.log(`👤 Test account: admin@test.com / test123!@#`);
    });
  } catch (error) {
    console.error('❌ Error during application startup:', error);
    process.exit(1);
  }
}

bootstrap();