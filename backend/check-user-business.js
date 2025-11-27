const { DataSource } = require('typeorm');
const path = require('path');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, 'erp_system_final.db'),
  synchronize: false,
  logging: false,
});

async function checkUser() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const result = await AppDataSource.query(`
      SELECT id, email, name, businessId
      FROM users
      WHERE email = 'business@gaonfscorp.com'
    `);

    console.log('👤 User 정보:');
    console.log(JSON.stringify(result, null, 2));

    // businessId가 2인 Sales도 확인
    const sales = await AppDataSource.query(`
      SELECT COUNT(*) as count, SUM(totalAmount) as totalAmount, SUM(vatAmount) as vatAmount
      FROM sales
      WHERE businessId = 2
    `);

    console.log('\n📊 businessId=2의 매출:');
    console.log(JSON.stringify(sales, null, 2));

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUser();
