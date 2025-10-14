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

const env = getValidatedEnv();

const baseConfig = {
  synchronize: env.NODE_ENV !== 'production',
  logging: env.NODE_ENV === 'development' && env.LOG_LEVEL === 'debug',
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
    CompanySettings
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
        type: 'postgres' as const,
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
        type: 'mysql' as const,
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
        type: 'better-sqlite3' as const,
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

export const AppDataSource = new DataSource(getDatabaseConfig());