const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'erp_system_final.db');
const db = sqlite3(dbPath);

console.log('=== 누락된 데이터베이스 컬럼 추가 ===\n');

try {
  // Customer 테이블에 컬럼 추가
  const customerColumns = ['fax', 'businessType', 'businessItem', 'managerContact'];

  console.log('Customer 테이블 컬럼 추가 중...');
  customerColumns.forEach(col => {
    try {
      db.exec(`ALTER TABLE customers ADD COLUMN ${col} TEXT`);
      console.log(`✅ customers.${col} 추가 완료`);
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`⏭️  customers.${col} 이미 존재함`);
      } else {
        console.log(`❌ customers.${col} 추가 실패:`, err.message);
      }
    }
  });

  // Product 테이블에 specification 컬럼 추가
  console.log('\nProduct 테이블 컬럼 추가 중...');
  try {
    db.exec('ALTER TABLE products ADD COLUMN specification TEXT');
    console.log('✅ products.specification 추가 완료');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('⏭️  products.specification 이미 존재함');
    } else {
      console.log('❌ products.specification 추가 실패:', err.message);
    }
  }

  console.log('\n=== 컬럼 추가 완료 ===');

  // 테이블 스키마 확인
  console.log('\n현재 customers 테이블 스키마:');
  const customerSchema = db.prepare("PRAGMA table_info(customers)").all();
  customerSchema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}`);
  });

  console.log('\n현재 products 테이블 스키마:');
  const productSchema = db.prepare("PRAGMA table_info(products)").all();
  productSchema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}`);
  });

} catch (err) {
  console.error('오류 발생:', err);
} finally {
  db.close();
  console.log('\n데이터베이스 연결 종료');
}
