/**
 * 안전한 Console Wrapper
 *
 * 프로덕션 환경에서 민감한 정보 노출을 방지하기 위한 console wrapper
 *
 * 사용법:
 * import safeConsole from './utils/safeConsole';
 *
 * // Before
 * console.log('User info:', userInfo);
 *
 * // After
 * safeConsole.log('User info:', userInfo);
 */

import { logger } from './logger';

const isProduction = process.env.NODE_ENV === 'production';

export const safeConsole = {
  /**
   * 일반 로그 (프로덕션에서는 비활성화)
   */
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    } else {
      // 프로덕션에서는 logger로 전환
      logger.debug(args.join(' '));
    }
  },

  /**
   * 디버그 로그 (프로덕션에서는 비활성화)
   */
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    } else {
      logger.debug(args.join(' '));
    }
  },

  /**
   * 정보 로그 (프로덕션에서도 logger로 기록)
   */
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args);
    } else {
      logger.info(args.join(' '));
    }
  },

  /**
   * 경고 로그 (모든 환경에서 기록)
   */
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
    logger.warn(args.join(' '));
  },

  /**
   * 에러 로그 (모든 환경에서 기록)
   */
  error: (...args: any[]) => {
    console.error(...args);
    logger.error(args.join(' '));
  },

  /**
   * 민감 정보 마스킹 로그
   * 이메일, 전화번호 등 자동 마스킹
   */
  sensitive: (label: string, data: any) => {
    if (isProduction) {
      // 프로덕션에서는 마스킹된 정보만 로깅
      const masked = maskSensitiveData(data);
      logger.info(`${label}: ${JSON.stringify(masked)}`);
    } else {
      console.log(label, data);
    }
  },

  /**
   * 성능 측정 시작
   */
  time: (label: string) => {
    if (!isProduction) {
      console.time(label);
    }
  },

  /**
   * 성능 측정 종료
   */
  timeEnd: (label: string) => {
    if (!isProduction) {
      console.timeEnd(label);
    }
  },

  /**
   * 테이블 형태 출력 (개발 환경에서만)
   */
  table: (data: any) => {
    if (!isProduction) {
      console.table(data);
    }
  }
};

/**
 * 민감 정보 마스킹 함수
 */
function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const masked = Array.isArray(data) ? [...data] : { ...data };

  const sensitiveKeys = [
    'password', 'token', 'secret', 'apiKey', 'apiSecret',
    'privateKey', 'accessToken', 'refreshToken', 'sessionId',
    'creditCard', 'ssn', 'pin'
  ];

  for (const key in masked) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      masked[key] = '***MASKED***';
    } else if (key === 'email' && typeof masked[key] === 'string') {
      // 이메일 마스킹: abc@example.com -> a**@example.com
      const [local, domain] = masked[key].split('@');
      masked[key] = `${local[0]}**@${domain}`;
    } else if (key === 'phone' && typeof masked[key] === 'string') {
      // 전화번호 마스킹: 010-1234-5678 -> 010-****-5678
      masked[key] = masked[key].replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      // 중첩된 객체 재귀 마스킹
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}

export default safeConsole;
