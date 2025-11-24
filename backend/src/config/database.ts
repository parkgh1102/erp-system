/**
 * 개선된 데이터베이스 설정
 *
 * 기존 database.ts를 수정하지 않고 새로운 보안 강화 설정 제공
 *
 * 주요 개선사항:
 * 1. synchronize를 false로 설정 (모든 환경)
 * 2. 연결 풀 최적화
 * 3. 보안 설정 강화
 *
 * 적용 방법:
 * backend/src/config/database.ts 대신 이 파일 사용
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { getValidatedEnv } from './envValidator';
import { User } from '../entities/User';
import { Business } from '../entities/Business';
import { Customer } from '../entities/Customer';
import { Product } from '../entities/Product';
import { Sales } from '../entities/Sales';
import { SalesItem } from '../entities/SalesItem';
import { Purchase } from '../entities/Purchase';
import { PurchaseItem } from '../entities/PurchaseItem';
import { Account } from '../entities/Account';
import { Transaction } from '../entities/Transaction';
import { TransactionItem } from '../entities/TransactionItem';
import { Payment } from '../entities/Payment';
import { Invoice } from '../entities/Invoice';
import { Note } from '../entities/Note';
import { CompanySettings } from '../entities/CompanySettings';
import { ActivityLog } from '../entities/ActivityLog';
import { Notification } from '../entities/Notification';
import { OTP } from '../entities/OTP';

const env = getValidatedEnv();

const baseConfig = {
  // ✅ 모든 환경에서 synchronize false (안전한 마이그레이션 사용)
  synchronize: false,

  // 개발 환경에서만 쿼리 로깅
  logging: env.NODE_ENV === 'development' && env.LOG_LEVEL === 'debug',

  // 엔티티 목록
  entities: [
    User,
    Business,
    Customer,
    Product,
    Sales,
    SalesItem,
    Purchase,
    PurchaseItem,
    Account,
    Transaction,
    TransactionItem,
    Payment,
    Invoice,
    Note,
    CompanySettings,
    ActivityLog,
    Notification,
    OTP
  ],

  // 마이그레이션 파일 경로
  migrations: ['src/migrations/*.ts'],

  // 구독자 경로
  subscribers: ['src/subscribers/*.ts'],

  // CLI 설정
  cli: {
    migrationsDir: 'src/migrations',
    subscribersDir: 'src/subscribers'
  },
};

/**
 * 데이터베이스별 설정
 */
const getDatabaseConfig = () => {
  switch (env.DB_TYPE) {
    case 'postgres':
      return {
        ...baseConfig,
        type: 'postgres' as const,
        host: env.DB_HOST,
        port: env.DB_PORT,
        username: env.DB_USERNAME,
        password: env.DB_PASSWORD,
        database: env.DB_DATABASE,

        // ✅ SSL 설정 (프로덕션 필수)
        ssl: env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false, // 자체 서명 인증서 허용
          // ca: fs.readFileSync('/path/to/ca-cert.crt').toString(), // CA 인증서 경로
        } : false,

        // 연결 풀 최적화
        extra: {
          // 최대 연결 수
          max: 20,

          // 최소 연결 수
          min: 2,

          // 연결 타임아웃 (30초)
          connectionTimeoutMillis: 30000,

          // Idle 타임아웃 (30초)
          idleTimeoutMillis: 30000,

          // 쿼리 타임아웃 (30초)
          query_timeout: 30000,

          // Statement 타임아웃 (30초)
          statement_timeout: 30000,

          // 연결 획득 타임아웃
          acquireTimeout: 60000,

          // 연결 풀 이벤트 로깅
          log: env.NODE_ENV === 'development' ? console.log : undefined,

          // ✅ 보안 설정
          application_name: 'erp_system',

          // 연결 시 실행할 쿼리
          // 타임존 설정, 인코딩 설정 등
          options: '-c timezone=Asia/Seoul',
        },

        // 연결 재시도 설정
        maxQueryExecutionTime: 30000, // 30초 이상 걸리는 쿼리 로깅

        // 캐시 설정 (옵션)
        cache: env.NODE_ENV === 'production' ? {
          type: 'database' as const,
          tableName: 'query_result_cache',
          duration: 60000 // 1분
        } : false,
      };

    case 'mysql':
      return {
        ...baseConfig,
        type: 'mysql' as const,
        host: env.DB_HOST,
        port: env.DB_PORT,
        username: env.DB_USERNAME,
        password: env.DB_PASSWORD,
        database: env.DB_DATABASE,

        // 문자셋 설정 (한글 지원)
        charset: 'utf8mb4',
        timezone: '+09:00',

        // 연결 풀 설정
        extra: {
          connectionLimit: 20,
          acquireTimeout: 60000,
          timeout: 60000,

          // ✅ SSL 설정 (프로덕션)
          ssl: env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
          } : false,

          // 자동 재연결
          reconnect: true,

          // 연결 끊김 감지
          enableKeepAlive: true,
          keepAliveInitialDelay: 0,

          // 날짜 타입 처리
          dateStrings: true,

          // 다중 쿼리 비활성화 (보안)
          multipleStatements: false,

          // BigInt 타입 처리
          supportBigNumbers: true,
          bigNumberStrings: true,
        },

        // 캐시 설정
        cache: env.NODE_ENV === 'production' ? {
          type: 'database' as const,
          tableName: 'query_result_cache',
          duration: 60000
        } : false,
      };

    case 'sqlite':
    default:
      return {
        ...baseConfig,
        type: 'better-sqlite3' as const,
        database: env.DB_DATABASE || './database/erp_system.db',

        // SQLite 최적화 설정
        prepareDatabase: (db: any) => {
          // ✅ WAL 모드 활성화 (동시성 향상)
          db.pragma('journal_mode = WAL');

          // ✅ 동기화 모드 (데이터 안전성)
          db.pragma('synchronous = FULL');

          // ✅ 외래키 제약조건 활성화
          db.pragma('foreign_keys = ON');

          // ✅ 보안 삭제 활성화
          db.pragma('secure_delete = ON');

          // 자동 진공 모드
          db.pragma('auto_vacuum = INCREMENTAL');

          // 인코딩 설정
          db.pragma('encoding = "UTF-8"');

          // 캐시 크기 설정 (10MB)
          db.pragma('cache_size = -10000');

          // Temp 저장소를 메모리로
          db.pragma('temp_store = MEMORY');

          // 잠금 타임아웃 (30초)
          db.pragma('busy_timeout = 30000');

          // 메모리 맵 I/O (성능 향상)
          db.pragma('mmap_size = 30000000000'); // 30GB

          if (env.NODE_ENV === 'development') {
            console.log('✅ SQLite pragmas applied:');
            console.log('  - journal_mode:', db.pragma('journal_mode', { simple: true }));
            console.log('  - foreign_keys:', db.pragma('foreign_keys', { simple: true }));
            console.log('  - synchronous:', db.pragma('synchronous', { simple: true }));
          }
        },
      };
  }
};

/**
 * 데이터 소스 생성
 */
export const AppDataSource = new DataSource(getDatabaseConfig());

/**
 * 데이터베이스 연결 초기화
 */
export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // 연결 정보 로깅 (민감 정보 제외)
    console.log('📊 Database info:', {
      type: env.DB_TYPE,
      database: env.DB_DATABASE,
      host: env.DB_TYPE !== 'sqlite' ? env.DB_HOST : undefined,
      synchronize: baseConfig.synchronize,
      migrationsRun: env.NODE_ENV === 'production'
    });

    // 프로덕션 환경에서 자동 마이그레이션 실행 (옵션)
    if (env.NODE_ENV === 'production' && process.env.AUTO_RUN_MIGRATIONS === 'true') {
      console.log('🔄 Running pending migrations...');
      await AppDataSource.runMigrations();
      console.log('✅ Migrations completed');
    }

    return AppDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * 데이터베이스 연결 종료
 */
export async function closeDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  }
}

/**
 * 데이터베이스 헬스 체크
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await AppDataSource.query('SELECT 1');
    return !!result;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

export default AppDataSource;
