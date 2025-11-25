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
app.use('/api/otp', authRateLimit, otpRoutes);
app.use('/api/businesses', apiRateLimit, businessRoutes);
app.use('/api/businesses', apiRateLimit, userRoutes);
app.use('/api/transaction-ledger', apiRateLimit, transactionLedgerRoutes);
app.use('/api/settings', apiRateLimit, settingsRoutes);
app.use('/api/activity-logs', apiRateLimit, activityLogRoutes);
app.use('/api/notifications', apiRateLimit, notificationRoutes);
app.use('/api/chatbot', apiRateLimit, chatbotRoutes);
app.use('/api/excel', apiRateLimit, excelRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: validatedEnv.NODE_ENV
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: validatedEnv.NODE_ENV,
    service: 'erp-backend'
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
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
}

bootstrap();
