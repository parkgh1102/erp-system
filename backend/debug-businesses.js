require('dotenv').config();
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'erp_system',
  synchronize: false,
  logging: false,
  entities: ['src/entities/*.ts'],
  migrations: ['src/migrations/*.ts'],
});

async function debugBusinesses() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Check all users
    const users = await AppDataSource.query('SELECT id, email FROM users ORDER BY id');
    console.log('📊 Users:', users);

    // Check all businesses
    const businesses = await AppDataSource.query('SELECT id, "userId", "companyName" FROM businesses ORDER BY id');
    console.log('📊 Businesses:', businesses);

    // Check business-user relationships
    const relationships = await AppDataSource.query(`
      SELECT u.id as user_id, u.email, b.id as business_id, b."companyName"
      FROM users u
      LEFT JOIN businesses b ON u.id = b."userId"
      ORDER BY u.id, b.id
    `);
    console.log('📊 Business-User relationships:', relationships);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugBusinesses();