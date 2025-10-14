/**
 * 로거 시스템 - 개발/프로덕션 환경 구분
 */

const isDev = import.meta.env.DEV;
const enableLogging = import.meta.env.VITE_ENABLE_LOGGING === 'true';

export const logger = {
  log: (...args: any[]) => {
    if (isDev || enableLogging) {
      console.log('[LOG]', ...args);
    }
  },

  info: (...args: any[]) => {
    if (isDev || enableLogging) {
      console.info('[INFO]', ...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDev || enableLogging) {
      console.warn('[WARN]', ...args);
    }
  },

  error: (...args: any[]) => {
    // 에러는 프로덕션에서도 로깅 (모니터링 서비스로 전송 가능)
    console.error('[ERROR]', ...args);

    // 프로덕션 환경: 에러 모니터링 서비스로 전송
    if (!isDev) {
      // TODO: Sentry, LogRocket 등과 연동
    }
  },

  debug: (...args: any[]) => {
    if (isDev) {
      console.debug('[DEBUG]', ...args);
    }
  }
};

export default logger;
