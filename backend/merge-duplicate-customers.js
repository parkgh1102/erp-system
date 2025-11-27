const { AppDataSource } = require('./dist/config/database');
const { Customer } = require('./dist/entities/Customer');
const { Sales } = require('./dist/entities/Sales');
const { Purchase } = require('./dist/entities/Purchase');
const { Payment } = require('./dist/entities/Payment');

async function mergeDuplicateCustomers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    const customerRepository = AppDataSource.getRepository(Customer);
    const salesRepository = AppDataSource.getRepository(Sales);
    const purchaseRepository = AppDataSource.getRepository(Purchase);
    const paymentRepository = AppDataSource.getRepository(Payment);

    // 청수상사 중복 거래처 찾기
    const duplicateCustomers = await customerRepository
      .createQueryBuilder('customer')
      .where('customer.name = :name', { name: '청수상사' })
      .andWhere('customer.businessId = :businessId', { businessId: 2 })
      .orderBy('customer.id', 'ASC')
      .getMany();

    if (duplicateCustomers.length <= 1) {
      console.log('중복된 청수상사가 없습니다.');
      await AppDataSource.destroy();
      return;
    }

    console.log(`=== 청수상사 중복 거래처 ${duplicateCustomers.length}개 발견 ===`);
    duplicateCustomers.forEach(c => {
      console.log(`ID: ${c.id}, 이름: ${c.name}`);
    });

    // 데이터가 있는 거래처 찾기 (ID 381)
    const mainCustomer = duplicateCustomers.find(c => c.id === 381);
    if (!mainCustomer) {
      console.log('❌ 메인 거래처(ID 381)를 찾을 수 없습니다.');
      await AppDataSource.destroy();
      return;
    }

    console.log(`\n✅ 메인 거래처로 병합: ID ${mainCustomer.id} - ${mainCustomer.name}`);

    // 다른 중복 거래처들
    const duplicatesToMerge = duplicateCustomers.filter(c => c.id !== mainCustomer.id);

    for (const duplicate of duplicatesToMerge) {
      console.log(`\n--- ID ${duplicate.id} 병합 시작 ---`);

      // 매출 데이터 이전
      const salesCount = await salesRepository.count({ where: { customerId: duplicate.id } });
      if (salesCount > 0) {
        await salesRepository.update(
          { customerId: duplicate.id },
          { customerId: mainCustomer.id }
        );
        console.log(`  ✓ 매출 ${salesCount}건 이전`);
      }

      // 매입 데이터 이전
      const purchaseCount = await purchaseRepository.count({ where: { customerId: duplicate.id } });
      if (purchaseCount > 0) {
        await purchaseRepository.update(
          { customerId: duplicate.id },
          { customerId: mainCustomer.id }
        );
        console.log(`  ✓ 매입 ${purchaseCount}건 이전`);
      }

      // 수금/지급 데이터 이전
      const paymentCount = await paymentRepository.count({ where: { customerId: duplicate.id } });
      if (paymentCount > 0) {
        await paymentRepository.update(
          { customerId: duplicate.id },
          { customerId: mainCustomer.id }
        );
        console.log(`  ✓ 수금/지급 ${paymentCount}건 이전`);
      }

      // 중복 거래처 삭제
      await customerRepository.delete(duplicate.id);
      console.log(`  ✓ 중복 거래처 삭제 완료`);
    }

    console.log('\n=== ✅ 청수상사 병합 완료 ===');
    console.log(`남은 거래처: ID ${mainCustomer.id}`);

    // 최종 확인
    const finalSalesCount = await salesRepository.count({ where: { customerId: mainCustomer.id } });
    const finalPurchaseCount = await purchaseRepository.count({ where: { customerId: mainCustomer.id } });
    const finalPaymentCount = await paymentRepository.count({ where: { customerId: mainCustomer.id } });

    console.log('\n최종 데이터:');
    console.log(`  - 매출: ${finalSalesCount}건`);
    console.log(`  - 매입: ${finalPurchaseCount}건`);
    console.log(`  - 수금/지급: ${finalPaymentCount}건`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

mergeDuplicateCustomers();
