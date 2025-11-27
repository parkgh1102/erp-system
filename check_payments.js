const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '0000',
  database: 'erp_system'
});

async function checkPayments() {
  try {
    await client.connect();

    console.log('\n===== 박경환 거래처(customerId=1)의 모든 payment 레코드 =====');
    const result = await client.query(`
      SELECT
        p.id,
        p."paymentDate",
        p."customerId",
        c.name as customer_name,
        p."paymentType",
        p.amount,
        p.memo,
        p."createdAt"
      FROM payments p
      LEFT JOIN customers c ON p."customerId" = c.id
      WHERE p."customerId" = 1
      ORDER BY p."paymentDate", p.id;
    `);

    console.log(`\n발견된 레코드 수: ${result.rows.length}\n`);
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`  날짜: ${row.paymentDate}`);
      console.log(`  거래처: ${row.customer_name}`);
      console.log(`  타입: ${row.paymentType}`);
      console.log(`  금액: ${row.amount}`);
      console.log(`  메모: ${row.memo || '없음'}`);
      console.log(`  생성일시: ${row.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkPayments();
