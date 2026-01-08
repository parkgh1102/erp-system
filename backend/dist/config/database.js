"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
exports.checkDatabaseHealth = checkDatabaseHealth;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const typeorm_1 = require("typeorm");
const envValidator_1 = require("./envValidator");
const User_1 = require("../entities/User");
const Business_1 = require("../entities/Business");
const Customer_1 = require("../entities/Customer");
const Product_1 = require("../entities/Product");
const Sales_1 = require("../entities/Sales");
const SalesItem_1 = require("../entities/SalesItem");
const Purchase_1 = require("../entities/Purchase");
const PurchaseItem_1 = require("../entities/PurchaseItem");
const Account_1 = require("../entities/Account");
const Transaction_1 = require("../entities/Transaction");
const TransactionItem_1 = require("../entities/TransactionItem");
const Payment_1 = require("../entities/Payment");
const Invoice_1 = require("../entities/Invoice");
const Note_1 = require("../entities/Note");
const CompanySettings_1 = require("../entities/CompanySettings");
const ActivityLog_1 = require("../entities/ActivityLog");
const Notification_1 = require("../entities/Notification");
const OTP_1 = require("../entities/OTP");
const env = (0, envValidator_1.getValidatedEnv)();
const baseConfig = {
    // ✅ synchronize 설정 - 스키마 자동 동기화 (새 컬럼 추가용)
    synchronize: true,
    // 개발 환경에서만 쿼리 로깅
    logging: env.NODE_ENV === 'development' && env.LOG_LEVEL === 'debug',
    // 엔티티 목록
    entities: [
        User_1.User,
        Business_1.Business,
        Customer_1.Customer,
        Product_1.Product,
        Sales_1.Sales,
        SalesItem_1.SalesItem,
        Purchase_1.Purchase,
        PurchaseItem_1.PurchaseItem,
        Account_1.Account,
        Transaction_1.Transaction,
        TransactionItem_1.TransactionItem,
        Payment_1.Payment,
        Invoice_1.Invoice,
        Note_1.Note,
        CompanySettings_1.CompanySettings,
        ActivityLog_1.ActivityLog,
        Notification_1.Notification,
        OTP_1.OTP
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
                type: 'postgres',
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
                    type: 'database',
                    tableName: 'query_result_cache',
                    duration: 60000 // 1분
                } : false,
            };
        case 'mysql':
            return {
                ...baseConfig,
                type: 'mysql',
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
                    type: 'database',
                    tableName: 'query_result_cache',
                    duration: 60000
                } : false,
            };
        case 'sqlite':
        default:
            return {
                ...baseConfig,
                type: 'better-sqlite3',
                database: env.DB_DATABASE || './database/erp_system.db',
                // SQLite 최적화 설정
                prepareDatabase: (db) => {
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
exports.AppDataSource = new typeorm_1.DataSource(getDatabaseConfig());
/**
 * 데이터베이스 연결 초기화
 */
async function initializeDatabase() {
    try {
        await exports.AppDataSource.initialize();
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
            await exports.AppDataSource.runMigrations();
            console.log('✅ Migrations completed');
        }
        return exports.AppDataSource;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}
/**
 * 데이터베이스 연결 종료
 */
async function closeDatabase() {
    if (exports.AppDataSource.isInitialized) {
        await exports.AppDataSource.destroy();
        console.log('✅ Database connection closed');
    }
}
/**
 * 데이터베이스 헬스 체크
 */
async function checkDatabaseHealth() {
    try {
        const result = await exports.AppDataSource.query('SELECT 1');
        return !!result;
    }
    catch (error) {
        console.error('❌ Database health check failed:', error);
        return false;
    }
}
exports.default = exports.AppDataSource;
//# sourceMappingURL=database.js.map