const Database = require('better-sqlite3');
const db = new Database('./erp_system_final.db', { readonly: true });

console.log('=== 등록된 매출 확인 ===\n');

const sales = db.prepare(`
  SELECT
    s.id,
    c.name as customer_name,
    s.transaction_date,
    s.totalAmount,
    s.vatAmount,
    s.totalAmount + s.vatAmount as grandTotal
  FROM sales s
  JOIN customers c ON s.customer_id = c.id
  ORDER BY s.id
`).all();

if (sales.length === 0) {
  console.log('등록된 매출이 없습니다.');
} else {
  sales.forEach(sale => {
    console.log(`매출 ID: ${sale.id}`);
    console.log(`  거래처: ${sale.customer_name}`);
    console.log(`  공급가: ${sale.totalAmount.toLocaleString()}원`);
    console.log(`  부가세: ${sale.vatAmount.toLocaleString()}원`);
    console.log(`  합계: ${sale.grandTotal.toLocaleString()}원`);
    console.log('');
  });

  // 매출 항목도 확인
  console.log('=== 매출 항목 상세 ===\n');

  const items = db.prepare(`
    SELECT
      si.id,
      si.salesId,
      p.name as product_name,
      p.tax_type as product_taxType,
      si.quantity,
      si.unitPrice,
      si.supplyAmount
    FROM sales_items si
    JOIN products p ON si.productId = p.id
    ORDER BY si.salesId, si.id
  `).all();

  items.forEach(item => {
    console.log(`항목 ID: ${item.id} (매출 ID: ${item.salesId})`);
    console.log(`  제품: ${item.product_name}`);
    console.log(`  제품 taxType: ${item.product_taxType}`);
    console.log(`  수량: ${item.quantity}`);
    console.log(`  단가: ${item.unitPrice.toLocaleString()}원`);
    console.log(`  공급가액: ${item.supplyAmount.toLocaleString()}원`);
    console.log('');
  });
}

db.close();
