const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'erp_system_final.db');
const db = new Database(dbPath, { readonly: true });

console.log('\n===== 모든 payment 레코드의 타입 분석 =====\n');

// 모든 payment 타입 확인
const allPaymentTypes = db.prepare(`
  SELECT DISTINCT paymentType
  FROM payments
  ORDER BY paymentType
`).all();

console.log('데이터베이스에 존재하는 paymentType 목록:');
allPaymentTypes.forEach(row => {
  console.log(`  - ${row.paymentType}`);
});

console.log('\n===== 각 거래처별 payment 상세 =====\n');

// 거래처 1, 2, 3의 모든 payment 조회
[1, 2, 3].forEach(customerId => {
  const customer = db.prepare(`SELECT name FROM customers WHERE id = ?`).get(customerId);
  const payments = db.prepare(`
    SELECT
      id,
      paymentDate,
      paymentType,
      amount,
      memo,
      createdAt
    FROM payments
    WHERE customerId = ?
    ORDER BY paymentDate, createdAt, id
  `).all(customerId);

  console.log(`\n거래처 ${customerId} (${customer?.name || 'UNKNOWN'}):`);
  console.log(`총 ${payments.length}개의 payment 레코드\n`);

  payments.forEach((payment, idx) => {
    console.log(`  [${idx + 1}] ID: ${payment.id}`);
    console.log(`      날짜: ${payment.paymentDate}`);
    console.log(`      타입: ${payment.paymentType}`);
    console.log(`      금액: ${payment.amount}`);
    console.log(`      메모: ${payment.memo || '없음'}`);
    console.log(`      생성: ${payment.createdAt}`);
    console.log('');
  });
});

// 각 타입별 카운트
console.log('\n===== 타입별 payment 개수 =====\n');
const typeCounts = db.prepare(`
  SELECT
    paymentType,
    COUNT(*) as count
  FROM payments
  GROUP BY paymentType
  ORDER BY paymentType
`).all();

typeCounts.forEach(row => {
  console.log(`${row.paymentType}: ${row.count}개`);
});

db.close();
