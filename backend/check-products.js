const Database = require('better-sqlite3');
const db = new Database('./erp_system_final.db', { readonly: true });

console.log('=== Checking Products ===\n');

const products = db.prepare(`
  SELECT id, name, productCode, sellPrice, taxType
  FROM products
  WHERE name IN ('박경환', '필기도구', '필기도구1')
  ORDER BY id
`).all();

products.forEach(product => {
  console.log(`Product: ${product.name}`);
  console.log(`  ID: ${product.id}`);
  console.log(`  Code: ${product.productCode}`);
  console.log(`  Sell Price: ${product.sellPrice}`);
  console.log(`  Tax Type: "${product.taxType}"`);
  console.log(`  Tax Type (typeof): ${typeof product.taxType}`);
  console.log('');
});

db.close();
