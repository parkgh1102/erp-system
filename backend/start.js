/**
 * Production start wrapper with detailed error logging
 */

console.log('🚀 Starting ERP Backend Server...');
console.log('📍 Working directory:', process.cwd());
console.log('📍 Node version:', process.version);
console.log('📍 Environment:', process.env.NODE_ENV);

// Check if dist/index.js exists
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.js');
console.log('📍 Looking for:', indexPath);

if (!fs.existsSync(indexPath)) {
  console.error('❌ ERROR: dist/index.js not found!');
  console.error('📁 Current directory contents:');
  console.error(fs.readdirSync(__dirname));

  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    console.error('📁 Dist directory contents:');
    console.error(fs.readdirSync(path.join(__dirname, 'dist')));
  } else {
    console.error('❌ Dist directory does not exist!');
  }

  process.exit(1);
}

console.log('✅ dist/index.js found');
console.log('📊 Environment variables check:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - PORT:', process.env.PORT);
console.log('  - DB_TYPE:', process.env.DB_TYPE);
console.log('  - DB_HOST:', process.env.DB_HOST ? '✅ Set' : '❌ Not set');
console.log('  - DB_DATABASE:', process.env.DB_DATABASE ? '✅ Set' : '❌ Not set');
console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? `✅ Set (${process.env.JWT_SECRET.length} chars)` : '❌ Not set');
console.log('  - SESSION_SECRET:', process.env.SESSION_SECRET ? `✅ Set (${process.env.SESSION_SECRET.length} chars)` : '❌ Not set');
console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL);

console.log('\n🔄 Loading application...\n');

try {
  require('./dist/index.js');
} catch (error) {
  console.error('\n❌ FATAL ERROR: Failed to start application\n');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('\nStack trace:');
  console.error(error.stack);

  if (error.cause) {
    console.error('\nCaused by:');
    console.error(error.cause);
  }

  process.exit(1);
}
