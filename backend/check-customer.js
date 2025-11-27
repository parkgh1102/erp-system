const { AppDataSource } = require('./dist/config/database');
const { Customer } = require('./dist/entities/Customer');
const { Sales } = require('./dist/entities/Sales');

async function checkCustomer() {
  try {
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    const customerRepository = AppDataSource.getRepository(Customer);
    const salesRepository = AppDataSource.getRepository(Sales);

    // 1. 청수상사 거래처 확인
    console.log('=== 청수상사 거래처 확인 ===');
    const customers = await customerRepository
      .createQueryBuilder('customer')
      .where('customer.name LIKE :name', { name: '%청수상사%' })
      .getMany();

    console.log(`발견된 거래처 수: ${customers.length}`);
    customers.forEach(c => {
      console.log(`ID: ${c.id}, 이름: ${c.name}, 사업장ID: ${c.businessId}`);
    });

    // 2. 청수상사의 매출 데이터 확인
    if (customers.length > 0) {
      console.log('\n=== 청수상사 매출 데이터 확인 ===');
      for (const customer of customers) {
        const sales = await salesRepository
          .createQueryBuilder('sales')
          .where('sales.customerId = :customerId', { customerId: customer.id })
          .andWhere('sales.businessId = :businessId', { businessId: customer.businessId })
          .leftJoinAndSelect('sales.items', 'items')
          .getMany();

        console.log(`\n거래처: ${customer.name} (ID: ${customer.id})`);
        console.log(`매출 건수: ${sales.length}`);

        if (sales.length > 0) {
          sales.slice(0, 3).forEach(s => {
            console.log(`  - 날짜: ${s.transactionDate}, 금액: ${s.totalAmount}, 세액: ${s.vatAmount}`);
          });
        }
      }
    }

    // 3. 모든 거래처 목록 (처음 10개)
    console.log('\n=== 전체 거래처 목록 (처음 10개) ===');
    const allCustomers = await customerRepository
      .createQueryBuilder('customer')
      .orderBy('customer.id', 'ASC')
      .take(10)
      .getMany();

    allCustomers.forEach(c => {
      console.log(`ID: ${c.id}, 이름: ${c.name}, 사업장ID: ${c.businessId}`);
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkCustomer();
