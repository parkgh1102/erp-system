const sqlite3 = require('better-sqlite3');
const db = sqlite3('backend/erp_system_final.db');

console.log('=== Customers Table Schema ===');
const customerSchema = db.prepare('PRAGMA table_info(customers)').all();
customerSchema.forEach(c => {
  console.log(`  ${c.name}: ${c.type}`);
});

console.log('\n=== Products Table Schema ===');
const productSchema = db.prepare('PRAGMA table_info(products)').all();
productSchema.forEach(c => {
  console.log(`  ${c.name}: ${c.type}`);
});

db.close();
