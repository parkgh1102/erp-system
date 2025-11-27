const { AppDataSource } = require('./dist/config/database');
const { Sales } = require('./dist/entities/Sales');
const dayjs = require('dayjs');

async function checkSalesDate() {
  try {
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    const salesRepo = AppDataSource.getRepository(Sales);

    // 청수상사(ID 381) 매출 데이터 확인
    const sales = await salesRepo.find({
      where: { customerId: 381, businessId: 2 },
      relations: ['items', 'customer']
    });

    console.log(`=== 청수상사(ID 381) 매출 데이터 ${sales.length}건 ===\n`);

    if (sales.length > 0) {
      sales.forEach((s, idx) => {
        const date = dayjs(s.transactionDate);
        console.log(`매출 ${idx + 1}:`);
        console.log(`  날짜: ${date.format('YYYY-MM-DD')}`);
        console.log(`  공급가액: ${s.totalAmount}`);
        console.log(`  세액: ${s.vatAmount}`);
        console.log(`  합계: ${s.totalAmount + s.vatAmount}`);
        console.log(`  거래처: ${s.customer?.name || '없음'}`);
        console.log('');
      });

      // 날짜 범위 확인
      const firstDate = dayjs(sales[0].transactionDate);
      console.log('검색 날짜 범위 체크:');
      console.log(`  매출 날짜: ${firstDate.format('YYYY-MM-DD')}`);
      console.log(`  화면 검색 범위: 2025-11-01 ~ 2025-11-30`);
      console.log(`  범위 내 포함 여부: ${firstDate.isSameOrAfter('2025-11-01') && firstDate.isSameOrBefore('2025-11-30')}`);
    } else {
      console.log('❌ 매출 데이터가 없습니다.');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkSalesDate();
