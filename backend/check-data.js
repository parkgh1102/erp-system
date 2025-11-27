const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'erp_system_final.db');
const db = new Database(dbPath);

try {
  const tables = [
    'sales',
    'purchases',
    'customers',
    'products',
    'accounts',
    'transactions',
    'sales_items',
    'purchase_items',
    'transaction_items',
    'payments',
    'invoices',
    'notes'
  ];

  console.log('📊 데이터베이스 현황:');
  console.log('='.repeat(50));

  tables.forEach(table => {
    try {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`${table.padEnd(25)}: ${result.count}개`);
    } catch (err) {
      console.log(`${table.padEnd(25)}: 테이블 없음`);
    }
  });

  console.log('='.repeat(50));

} catch (error) {
  console.error('❌ 오류:', error.message);
} finally {
  db.close();
}
