#!/usr/bin/env node

/**
 * Production start wrapper with detailed error logging
 */

// Wrap everything in try-catch to catch any errors
try {
  console.log('🚀 Starting ERP Backend Server...');
  console.log('📍 __dirname:', __dirname);
  console.log('📍 process.cwd():', process.cwd());
  console.log('📍 Node version:', process.version);
  console.log('📍 Platform:', process.platform);
  console.log('📍 Environment:', process.env.NODE_ENV || 'not set');

  // Check if dist/index.js exists
  const fs = require('fs');
  const path = require('path');

  // Try multiple possible paths
  const possiblePaths = [
    path.join(__dirname, 'dist', 'index.js'),
    path.join(process.cwd(), 'dist', 'index.js'),
    path.join(__dirname, '..', 'dist', 'index.js'),
  ];

  console.log('\n📁 Checking possible paths:');
  let indexPath = null;
  for (const p of possiblePaths) {
    console.log(`  - ${p}: ${fs.existsSync(p) ? '✅' : '❌'}`);
    if (fs.existsSync(p)) {
      indexPath = p;
      break;
    }
  }

  if (!indexPath) {
    console.error('\n❌ ERROR: dist/index.js not found in any expected location!');
    console.error('\n📁 __dirname contents:');
    try {
      console.error(fs.readdirSync(__dirname));
    } catch (e) {
      console.error('Cannot read __dirname:', e.message);
    }

    console.error('\n📁 cwd contents:');
    try {
      console.error(fs.readdirSync(process.cwd()));
    } catch (e) {
      console.error('Cannot read cwd:', e.message);
    }

    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      console.error('\n📁 dist directory contents:');
      try {
        console.error(fs.readdirSync(distPath).slice(0, 20));
      } catch (e) {
        console.error('Cannot read dist:', e.message);
      }
    }

    process.exit(1);
  }

  console.log('\n✅ Found dist/index.js at:', indexPath);

  console.log('\n📊 Environment variables check:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('  - PORT:', process.env.PORT || 'not set');
  console.log('  - DB_TYPE:', process.env.DB_TYPE || 'not set');
  console.log('  - DB_HOST:', process.env.DB_HOST ? '✅ Set' : '❌ Not set');
  console.log('  - DB_DATABASE:', process.env.DB_DATABASE ? '✅ Set' : '❌ Not set');
  console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? `✅ Set (${process.env.JWT_SECRET.length} chars)` : '❌ Not set');
  console.log('  - SESSION_SECRET:', process.env.SESSION_SECRET ? `✅ Set (${process.env.SESSION_SECRET.length} chars)` : '❌ Not set');
  console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL || 'not set');
  console.log('  - FORCE_HTTPS:', process.env.FORCE_HTTPS || 'not set');
  console.log('  - DB_SYNCHRONIZE:', process.env.DB_SYNCHRONIZE || 'not set');

  console.log('\n🔄 Loading application from:', indexPath);
  console.log('');

  require(indexPath);

} catch (error) {
  console.error('\n❌❌❌ FATAL ERROR IN START.JS ❌❌❌\n');
  console.error('Error name:', error.name || 'Unknown');
  console.error('Error message:', error.message || 'No message');

  if (error.stack) {
    console.error('\n📜 Stack trace:');
    console.error(error.stack);
  }

  if (error.cause) {
    console.error('\n🔗 Caused by:');
    console.error(error.cause);
  }

  console.error('\n💡 Additional error info:');
  console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

  process.exit(1);
}
