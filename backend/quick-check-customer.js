const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'erp_system_final.db');
const db = new Database(dbPath, { readonly: true });

try {
  console.log('✅ 데이터베이스 연결 성공\n');

  const customers = db.prepare('SELECT id, name, customerCode, businessId FROM customers WHERE name = ? ORDER BY id').all('청수상사');

  console.log(`청수상사 검색 결과: ${customers.length}개`);
  customers.forEach(c => {
    console.log(`  ID: ${c.id}, 이름: ${c.name}, 코드: ${c.customerCode}, 사업장: ${c.businessId}`);
  });

  // 전체 거래처 수 확인
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM customers WHERE businessId = 2').get();
  console.log(`\n사업장 2의 전체 거래처 수: ${totalCount.count}개`);

  // 처음 20개 거래처 확인
  const first20 = db.prepare('SELECT id, name, customerCode FROM customers WHERE businessId = 2 ORDER BY createdAt DESC LIMIT 20').all();
  console.log('\n처음 20개 거래처:');
  first20.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ID: ${c.id}, 이름: ${c.name}, 코드: ${c.customerCode}`);
  });

} catch (error) {
  console.error('❌ 오류:', error.message);
} finally {
  db.close();
}
