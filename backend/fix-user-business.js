const { DataSource } = require('typeorm');
const path = require('path');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, 'erp_system_final.db'),
  synchronize: false,
  logging: true,
});

async function fixUser() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // businessId를 2로 업데이트
    const result = await AppDataSource.query(`
      UPDATE users
      SET businessId = 2
      WHERE email = 'business@gaonfscorp.com'
    `);

    console.log('✅ User businessId updated to 2\n');

    // 확인
    const user = await AppDataSource.query(`
      SELECT id, email, name, businessId
      FROM users
      WHERE email = 'business@gaonfscorp.com'
    `);

    console.log('👤 업데이트된 User 정보:');
    console.log(JSON.stringify(user, null, 2));

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixUser();
