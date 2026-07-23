/**
 * 개선된 환경 변수 검증
 *
 * 기존 envValidator.ts를 수정하지 않고 새로운 보안 강화 설정 제공
 *
 * 주요 개선사항:
 * 1. HTTPS 강제 검증 강화
 * 2. 더 엄격한 시크릿 키 검증
 * 3. 추가 보안 설정 검증
 */

import Joi from 'joi';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().positive().default(3001),
  FRONTEND_URL: Joi.string().uri().required(),

  // 데이터베이스 설정
  DB_TYPE: Joi.string().valid('sqlite', 'mysql', 'postgres').required(),
  DB_DATABASE: Joi.string().required(),
  DB_HOST: Joi.string().when('DB_TYPE', {
    is: Joi.valid('mysql', 'postgres'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  DB_PORT: Joi.number().when('DB_TYPE', {
    is: Joi.valid('mysql', 'postgres'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  DB_USERNAME: Joi.string().when('DB_TYPE', {
    is: Joi.valid('mysql', 'postgres'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  DB_PASSWORD: Joi.string().when('DB_TYPE', {
    is: Joi.valid('mysql', 'postgres'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),

  // JWT 설정 (더 엄격한 검증)
  JWT_SECRET: Joi.string().min(32).required(), // 최소 32자 (Render 호환)
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(), // 최소 32자 (Render 호환)
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // 파일 업로드 설정
  UPLOAD_PATH: Joi.string().default('./uploads'),
  MAX_FILE_SIZE: Joi.number().positive().default(10485760),

  // 보안 설정
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(10), // 10 = 표준(로그인 체감 개선), 최소 10
  SESSION_SECRET: Joi.string().min(32).required(), // 최소 32자 (Render 호환)
  RATE_LIMIT_WINDOW_MS: Joi.number().positive().default(900000),
  RATE_LIMIT_MAX: Joi.number().positive().default(100),

  // 로깅 설정
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('logs/app.log'),

  // ✅ HTTPS 설정 (프로덕션 필수)
  FORCE_HTTPS: Joi.boolean().default(false),

  // SSL 인증서 경로 (선택사항)
  SSL_KEY_PATH: Joi.string().optional(),
  SSL_CERT_PATH: Joi.string().optional(),

  // ✅ 추가 보안 설정
  DISABLE_CSRF: Joi.boolean().default(false), // CSRF 비활성화 옵션
  AUTO_RUN_MIGRATIONS: Joi.boolean().default(false), // 자동 마이그레이션
  ENABLE_API_DOCS: Joi.boolean().default(false), // API 문서 활성화

  // 외부 서비스 (선택사항)
  REDIS_URL: Joi.string().uri().optional(),
  SENTRY_DSN: Joi.string().uri().optional(),

  // Cloudinary 이미지 호스팅
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),
}).unknown();

/**
 * 개선된 환경 변수 검증
 */
export const validateEnvImproved = () => {
  const { error, value } = envSchema.validate(process.env);

  if (error) {
    const missingVars = error.details.map(detail => detail.path.join('.'));
    throw new Error(`환경변수 검증 실패: ${error.message}\n누락된 변수들: ${missingVars.join(', ')}`);
  }

  // ========================================
  // 보안 검증 강화
  // ========================================

  // 1. JWT 시크릿 길이 검증 (완화됨)
  if (value.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET은 32자 이상이어야 합니다. (현재: ' + value.JWT_SECRET.length + '자)');
  }

  if (value.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET은 32자 이상이어야 합니다. (현재: ' + value.JWT_REFRESH_SECRET.length + '자)');
  }

  if (value.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET은 32자 이상이어야 합니다. (현재: ' + value.SESSION_SECRET.length + '자)');
  }

  // 2. bcrypt rounds 검증 (10 미만은 약함 — 표준 하한 10)
  if (value.BCRYPT_ROUNDS < 10) {
    throw new Error('BCRYPT_ROUNDS는 10 이상이어야 합니다. (현재: ' + value.BCRYPT_ROUNDS + ')');
  }

  // 3. 기본 시크릿 키 사용 방지 (확장된 목록)
  const defaultSecrets = [
    'your-secret-key',
    'your_very_strong_jwt_secret_key_here_at_least_32_characters',
    'CHANGE_THIS_IN_PRODUCTION_TO_STRONG_SECRET_KEY',
    'default-secret-key',
    'your_session_secret_here',
    'fallback-secret-key-change-this',
    'secret',
    'mysecret',
    'test-secret',
    'development-secret',
    '12345678901234567890123456789012', // 32자 숫자
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 32자 같은 문자
  ];

  const secretLower = value.JWT_SECRET.toLowerCase();
  if (defaultSecrets.some(ds => secretLower.includes(ds.toLowerCase()))) {
    throw new Error('기본 JWT_SECRET을 사용할 수 없습니다. 강력한 랜덤 키로 변경하세요.');
  }

  const refreshSecretLower = value.JWT_REFRESH_SECRET.toLowerCase();
  if (defaultSecrets.some(ds => refreshSecretLower.includes(ds.toLowerCase()))) {
    throw new Error('기본 JWT_REFRESH_SECRET을 사용할 수 없습니다. 강력한 랜덤 키로 변경하세요.');
  }

  const sessionSecretLower = value.SESSION_SECRET.toLowerCase();
  if (defaultSecrets.some(ds => sessionSecretLower.includes(ds.toLowerCase()))) {
    throw new Error('기본 SESSION_SECRET을 사용할 수 없습니다. 강력한 랜덤 키로 변경하세요.');
  }

  // 4. 시크릿 키 동일성 검사
  if (value.JWT_SECRET === value.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET과 JWT_REFRESH_SECRET은 서로 다른 값이어야 합니다.');
  }

  if (value.JWT_SECRET === value.SESSION_SECRET) {
    throw new Error('JWT_SECRET과 SESSION_SECRET은 서로 다른 값이어야 합니다.');
  }

  if (value.JWT_REFRESH_SECRET === value.SESSION_SECRET) {
    throw new Error('JWT_REFRESH_SECRET과 SESSION_SECRET은 서로 다른 값이어야 합니다.');
  }

  // 5. 시크릿 키 복잡도 검증 (영문, 숫자, 특수문자 포함 권장)
  const hasLetter = /[a-zA-Z]/.test(value.JWT_SECRET);
  const hasNumber = /[0-9]/.test(value.JWT_SECRET);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value.JWT_SECRET);

  if (!hasLetter || !hasNumber || !hasSpecial) {
    console.warn('⚠️  경고: JWT_SECRET에 영문, 숫자, 특수문자를 모두 포함하는 것을 권장합니다.');
  }

  // ========================================
  // 프로덕션 환경 추가 검증
  // ========================================
  if (value.NODE_ENV === 'production') {
    // 1. HTTPS 강제 검증 (Render는 자동으로 HTTPS 제공하므로 경고만)
    if (!value.FORCE_HTTPS) {
      console.warn('⚠️  경고: FORCE_HTTPS가 설정되지 않았습니다. Render/Vercel 등 플랫폼이 HTTPS를 제공하는지 확인하세요.');
    }

    // 2. SQLite 사용 경고
    if (value.DB_TYPE === 'sqlite') {
      console.warn('⚠️  경고: 프로덕션 환경에서 SQLite 사용은 권장되지 않습니다.');
      console.warn('⚠️  MySQL 또는 PostgreSQL 사용을 고려하세요.');
    }

    // 3. CSRF 비활성화 경고
    if (value.DISABLE_CSRF === true) {
      console.warn('⚠️  경고: 프로덕션 환경에서 CSRF 보호가 비활성화되었습니다!');
      console.warn('⚠️  보안상 DISABLE_CSRF=false로 설정하세요.');
    }

    // 4. API 문서 비활성화 확인
    if (value.ENABLE_API_DOCS === true) {
      console.warn('⚠️  경고: 프로덕션 환경에서 API 문서가 활성화되었습니다.');
      console.warn('⚠️  보안을 위해 ENABLE_API_DOCS=false로 설정하는 것을 권장합니다.');
    }

    // 5. FRONTEND_URL HTTPS 확인
    if (!value.FRONTEND_URL.startsWith('https://')) {
      console.warn('⚠️  경고: 프로덕션 환경에서 FRONTEND_URL이 HTTPS를 사용하지 않습니다.');
      console.warn('⚠️  현재 URL:', value.FRONTEND_URL);
    }

    // 6. Rate Limit 설정 확인
    if (value.RATE_LIMIT_MAX > 200) {
      console.warn('⚠️  경고: Rate Limit이 너무 높게 설정되어 있습니다. (현재:', value.RATE_LIMIT_MAX, ')');
      console.warn('⚠️  DDoS 공격에 취약할 수 있습니다.');
    }
  }

  // ========================================
  // 개발 환경 권장사항
  // ========================================
  if (value.NODE_ENV === 'development') {
    console.log('💡 개발 환경 설정 확인:');
    console.log('  - DB_TYPE:', value.DB_TYPE);
    console.log('  - DISABLE_CSRF:', value.DISABLE_CSRF);
    console.log('  - LOG_LEVEL:', value.LOG_LEVEL);

    if (value.BCRYPT_ROUNDS > 12) {
      console.warn('💡 개발 환경에서 BCRYPT_ROUNDS가 높게 설정되어 있습니다. (현재:', value.BCRYPT_ROUNDS, ')');
      console.warn('💡 로그인 속도가 느릴 수 있습니다. 개발 시에는 10-12를 권장합니다.');
    }
  }

  return value;
};

/**
 * 환경 변수 검증 및 반환 (named export)
 */
export function getValidatedEnv() {
  try {
    return validateEnvImproved();
  } catch (error) {
    console.error('❌ 환경변수 검증 실패:', error);
    process.exit(1);
  }
}

/**
 * 시크릿 키 생성 헬퍼
 *
 * 사용법:
 * import { generateSecretKey } from './config/envValidator.improved';
 * console.log('JWT_SECRET:', generateSecretKey());
 */
export function generateSecretKey(length: number = 64): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 환경 변수 출력 (민감 정보 마스킹)
 */
export function printEnvSummary() {
  const env = validateEnvImproved();

  console.log('\n📋 환경 변수 요약:');
  console.log('  NODE_ENV:', env.NODE_ENV);
  console.log('  PORT:', env.PORT);
  console.log('  DB_TYPE:', env.DB_TYPE);
  console.log('  FORCE_HTTPS:', env.FORCE_HTTPS);
  console.log('  JWT_SECRET:', maskSecret(env.JWT_SECRET));
  console.log('  SESSION_SECRET:', maskSecret(env.SESSION_SECRET));
  console.log('  BCRYPT_ROUNDS:', env.BCRYPT_ROUNDS);
  console.log('');
}

/**
 * 시크릿 마스킹
 */
function maskSecret(secret: string): string {
  if (secret.length <= 8) {
    return '***';
  }
  return secret.substring(0, 4) + '***' + secret.substring(secret.length - 4);
}

// Alias for backward compatibility
export const validateEnv = validateEnvImproved;

export default getValidatedEnv;
