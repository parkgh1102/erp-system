const Database = require('better-sqlite3');
const db = new Database('./erp_system_final.db', { readonly: true });

console.log('=== Sales 테이블 스키마 ===\n');
const salesSchema = db.prepare("PRAGMA table_info(sales)").all();
salesSchema.forEach(col => {
  console.log(`${col.name} (${col.type})`);
});

console.log('\n=== Sales_items 테이블 스키마 ===\n');
const itemsSchema = db.prepare("PRAGMA table_info(sales_items)").all();
itemsSchema.forEach(col => {
  console.log(`${col.name} (${col.type})`);
});

db.close();
