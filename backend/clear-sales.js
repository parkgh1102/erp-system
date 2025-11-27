const Database = require('better-sqlite3');
const db = new Database('./erp_system_final.db');

console.log('=== Clearing Sales Data ===\n');

// 매출 항목 삭제
const deleteItems = db.prepare('DELETE FROM sales_items').run();
console.log(`Deleted ${deleteItems.changes} sales items`);

// 매출 삭제
const deleteSales = db.prepare('DELETE FROM sales').run();
console.log(`Deleted ${deleteSales.changes} sales`);

console.log('\n✅ All sales data cleared!');

db.close();
