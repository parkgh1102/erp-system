#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// 운영환경 설정
process.env.NODE_ENV = 'production';

// 프로세스 제목 설정
process.title = 'erp-backend-production';

// 로그 디렉토리 확인
const fs = require('fs');
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 데이터베이스 디렉토리 확인
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('🚀 Starting ERP Backend in Production Mode...');
console.log('📂 Log Directory:', logDir);
console.log('📂 Database Directory:', dbDir);

// 메인 애플리케이션 시작
const app = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: process.env
});

app.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
  process.exit(code);
});

app.on('error', (err) => {
  console.error('Failed to start subprocess:', err);
  process.exit(1);
});

// Graceful shutdown 처리
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  app.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  app.kill('SIGINT');
});