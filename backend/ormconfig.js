const { getValidatedEnv } = require('./dist/config/envValidator');

const env = getValidatedEnv();

const baseConfig = {
  synchronize: env.NODE_ENV !== 'production',
  logging: env.NODE_ENV === 'development' && env.LOG_LEVEL === 'debug',
  entities: ['dist/entities/*.js'],
  migrations: ['dist/migrations/*.js'],
  subscribers: ['dist/subscribers/*.js'],
  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/migrations',
    subscribersDir: 'src/subscribers'
  }
};

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
          options: {
            busyTimeout: 30000,
            pragma: {
              journal_mode: 'WAL',
              synchronous: 'FULL',
              foreign_keys: 'ON',
              secure_delete: 'ON',
              auto_vacuum: 'INCREMENTAL'
            }
          }
        }
      };
  }
};

module.exports = getDatabaseConfig();