/**
 * 개선된 Vite 설정
 *
 * 기존 vite.config.ts를 수정하지 않고 새로운 보안 강화 설정 제공
 *
 * 주요 개선사항:
 * 1. 프로덕션에서 sourcemap 비활성화
 * 2. 빌드 최적화 강화
 * 3. 보안 헤더 설정
 *
 * 적용 방법:
 * 1. 기존 vite.config.ts를 vite.config.old.ts로 백업
 * 2. 이 파일을 vite.config.ts로 이름 변경
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: true,

    // 개발 서버 CORS 설정
    cors: true,

    // 프록시 설정
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // 프록시 로깅 (개발 시 유용)
        configure: (proxy, options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    },

    // 보안 헤더 설정 (개발 서버)
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    }
  },

  build: {
    outDir: 'dist',

    // ✅ 프로덕션에서 sourcemap 비활성화 (보안)
    sourcemap: process.env.NODE_ENV !== 'production',

    // ✅ 프로덕션에서 minify 활성화
    minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,

    // 청크 크기 경고 임계값 (500KB)
    chunkSizeWarningLimit: 500,

    // 빌드 최적화
    rollupOptions: {
      output: {
        // 청크 분할 전략
        manualChunks: {
          // React 관련 라이브러리를 별도 청크로 분리
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Ant Design을 별도 청크로 분리
          'antd-vendor': ['antd', '@ant-design/icons'],
          // 차트 라이브러리를 별도 청크로 분리
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          // 유틸리티 라이브러리를 별도 청크로 분리
          'utils-vendor': ['axios', 'dayjs', 'zustand'],
        },

        // 에셋 파일명 패턴
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },

        // 청크 파일명 패턴
        chunkFileNames: 'assets/js/[name]-[hash].js',

        // 엔트리 파일명 패턴
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    // 빌드 타겟 (모던 브라우저)
    target: 'esnext',

    // CSS 코드 분할
    cssCodeSplit: true,

    // 빌드 리포트 생성
    reportCompressedSize: true,

    // Terser 최적화 옵션 (esbuild 대신 사용 시)
    // terserOptions: {
    //   compress: {
    //     drop_console: true, // console.* 제거
    //     drop_debugger: true, // debugger 제거
    //   },
    // },
  },

  // Esbuild 설정
  esbuild: {
    // ✅ 프로덕션에서 console, debugger 제거
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],

    // 로더 설정
    loader: 'tsx',

    // JSX 설정
    jsx: 'automatic',
  },

  // CSS 전처리기 설정
  css: {
    // CSS 모듈 설정
    modules: {
      localsConvention: 'camelCase',
    },

    // PostCSS 설정
    postcss: {},

    // CSS 압축
    devSourcemap: true,
  },

  // 의존성 최적화
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      '@ant-design/icons',
      'axios',
      'dayjs',
      'zustand',
    ],

    // 제외할 의존성
    exclude: [],

    // Esbuild 옵션
    esbuildOptions: {
      target: 'esnext',
    },
  },

  // 프리뷰 서버 설정
  preview: {
    port: 4173,
    host: true,
    strictPort: true,

    // 보안 헤더
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },

  // 환경 변수 설정
  define: {
    // 빌드 타임에 대체될 전역 상수
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // 로그 레벨
  logLevel: 'info',
});
