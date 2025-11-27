const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'erp_system_final.db');
const db = new Database(dbPath, { readonly: true });

console.log('\n===== 박경환 거래처(customerId=1)의 모든 payment 레코드 =====\n');

const payments = db.prepare(`
  SELECT
    p.id,
    p.paymentDate,
    p.customerId,
    p.paymentType,
    p.amount,
    p.memo,
    p.createdAt
  FROM payments p
  WHERE p.customerId = 1
  ORDER BY p.paymentDate, p.id
`).all();

console.log(`발견된 레코드 수: ${payments.length}\n`);

payments.forEach(payment => {
  console.log(`ID: ${payment.id}`);
  console.log(`  날짜: ${payment.paymentDate}`);
  console.log(`  타입: ${payment.paymentType}`);
  console.log(`  금액: ${payment.amount}`);
  console.log(`  메모: ${payment.memo || '없음'}`);
  console.log(`  생성일시: ${payment.createdAt}`);
  console.log('');
});

console.log('\n===== 모든 거래처의 payment 레코드 수 =====\n');

const allPayments = db.prepare(`
  SELECT
    c.id as customerId,
    c.name as customerName,
    COUNT(p.id) as paymentCount
  FROM customers c
  LEFT JOIN payments p ON c.id = p.customerId
  GROUP BY c.id, c.name
  HAVING paymentCount > 0
  ORDER BY c.id
`).all();

allPayments.forEach(row => {
  console.log(`거래처 ID ${row.customerId} (${row.customerName}): ${row.paymentCount}개`);
});

db.close();
