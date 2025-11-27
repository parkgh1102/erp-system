const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'erp_system_final.db');
const db = new Database(dbPath);

try {
  console.log('🧹 데이터 삭제 시작...');

  // 외래 키 제약 조건 비활성화
  db.pragma('foreign_keys = OFF');

  // 거래 관련 데이터 삭제 (순서 중요 - 외래키 관계 고려)
  db.prepare('DELETE FROM transaction_items').run();
  db.prepare('DELETE FROM transactions').run();
  db.prepare('DELETE FROM sales_items').run();
  db.prepare('DELETE FROM sales').run();
  db.prepare('DELETE FROM purchase_items').run();
  db.prepare('DELETE FROM purchases').run();
  db.prepare('DELETE FROM payments').run();
  db.prepare('DELETE FROM invoices').run();
  db.prepare('DELETE FROM notes').run();

  // 기초 데이터 삭제
  db.prepare('DELETE FROM customers').run();
  db.prepare('DELETE FROM products').run();
  db.prepare('DELETE FROM accounts').run();
  db.prepare('DELETE FROM company_settings').run();

  // 외래 키 제약 조건 재활성화
  db.pragma('foreign_keys = ON');

  console.log('✅ 모든 임시 데이터가 삭제되었습니다.');
  console.log('👤 사용자 및 사업체 정보는 유지됩니다.');

} catch (error) {
  console.error('❌ 데이터 삭제 중 오류 발생:', error.message);
  process.exit(1);
} finally {
  db.close();
}
