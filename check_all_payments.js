const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'erp_system_final.db');
const db = new Database(dbPath, { readonly: true });

console.log('\n===== 모든 거래처의 payment 레코드 상세 =====\n');

// 123 거래처 조회
const customer123 = db.prepare(`
  SELECT id, name FROM customers WHERE name = '123'
`).get();

// 가나다라 거래처 조회
const customerGND = db.prepare(`
  SELECT id, name FROM customers WHERE name = '가나다라'
`).get();

console.log(`박경환 거래처 (customerId: 1)`);
console.log(`123 거래처 (customerId: ${customer123 ? customer123.id : 'NOT FOUND'})`);
console.log(`가나다라 거래처 (customerId: ${customerGND ? customerGND.id : 'NOT FOUND'})`);

console.log('\n');

// 모든 거래처의 payment 조회
[1, customer123?.id, customerGND?.id].filter(id => id).forEach(customerId => {
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
    ORDER BY paymentDate, id
  `).all(customerId);

  console.log(`\n===== ${customer.name} 거래처 (customerId: ${customerId}) =====`);
  console.log(`Payment 레코드 수: ${payments.length}\n`);

  payments.forEach((payment, idx) => {
    console.log(`Payment ${idx + 1}:`);
    console.log(`  ID: ${payment.id}`);
    console.log(`  날짜: ${payment.paymentDate}`);
    console.log(`  타입: ${payment.paymentType}`);
    console.log(`  금액: ${payment.amount}`);
    console.log(`  메모: ${payment.memo || '없음'}`);
    console.log(`  생성일시: ${payment.createdAt}`);
    console.log('');
  });
});

db.close();
