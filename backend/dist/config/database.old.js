"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
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
    synchronize: env.NODE_ENV === 'development', // 개발 환경에서는 자동 동기화, 프로덕션에서는 비활성화
    logging: env.NODE_ENV === 'development' && env.LOG_LEVEL === 'debug',
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
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
};
// 데이터베이스별 설정
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
                ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                extra: {
                    connectionLimit: 20,
                    acquireTimeout: 60000,
                    timeout: 60000,
                    // PostgreSQL 보안 설정
                    ssl: env.NODE_ENV === 'production',
                    statement_timeout: 30000,
                    query_timeout: 30000,
                    connectionTimeoutMillis: 30000,
                    idleTimeoutMillis: 30000,
                    max: 20,
                    min: 2
                }
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
                extra: {
                    connectionLimit: 20,
                    acquireTimeout: 60000,
                    timeout: 60000,
                    // MySQL 보안 설정
                    ssl: env.NODE_ENV === 'production' ? 'Amazon RDS' : false,
                    reconnect: true
                }
            };
        case 'sqlite':
        default:
            return {
                ...baseConfig,
                type: 'better-sqlite3',
                database: env.DB_DATABASE || './database/erp_system.db',
                extra: {
                    connectionLimit: 10,
                    acquireTimeout: 60000,
                    timeout: 60000,
                    // SQLite 보안 설정
                    options: {
                        busyTimeout: 30000,
                        // WAL 모드로 동시성 및 보안 향상
                        pragma: {
                            journal_mode: 'WAL',
                            synchronous: 'FULL',
                            foreign_keys: 'ON',
                            secure_delete: 'ON',
                            auto_vacuum: 'INCREMENTAL',
                            encoding: 'UTF-8'
                        }
                    }
                }
            };
    }
};
exports.AppDataSource = new typeorm_1.DataSource(getDatabaseConfig());
//# sourceMappingURL=database.old.js.map