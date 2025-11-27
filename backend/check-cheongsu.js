const { AppDataSource } = require('./dist/config/database');
const { Customer } = require('./dist/entities/Customer');
const { Sales } = require('./dist/entities/Sales');

async function check() {
  try {
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    const customerRepo = AppDataSource.getRepository(Customer);
    const salesRepo = AppDataSource.getRepository(Sales);

    // 청수상사 확인
    const cheongsu = await customerRepo.find({
      where: { businessId: 2, name: '청수상사' }
    });

    console.log(`청수상사 검색 결과: ${cheongsu.length}개`);
    cheongsu.forEach(c => {
      console.log(`  ID: ${c.id}, 이름: ${c.name}, 코드: ${c.customerCode}`);
    });

    if (cheongsu.length > 0) {
      const sales = await salesRepo.find({
        where: { customerId: cheongsu[0].id, businessId: 2 },
        relations: ['items']
      });
      console.log(`\n청수상사 매출: ${sales.length}건`);
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

check();
