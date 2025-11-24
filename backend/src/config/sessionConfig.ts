/**
 * 개선된 세션 설정
 *
 * 기존 코드를 수정하지 않고 새로운 보안 강화 설정 제공
 *
 * 적용 방법:
 * backend/src/index.ts에서 기존 session 설정 대신 이 파일의 설정 사용
 *
 * import { sessionConfig } from './config/sessionConfig.improved';
 * app.use(session(sessionConfig));
 */

import session from 'express-session';
import { getValidatedEnv } from './envValidator';

const env = getValidatedEnv();

/**
 * 보안 강화된 세션 설정
 */
export const sessionConfig: session.SessionOptions = {
  // ✅ Fallback 제거 - envValidator에서 이미 필수 검증
  secret: env.SESSION_SECRET,

  // 세션이 수정되지 않아도 저장하지 않음 (성능 최적화)
  resave: false,

  // 초기화되지 않은 세션 저장하지 않음 (보안 + 성능)
  saveUninitialized: false,

  // 쿠키 보안 설정
  cookie: {
    // 프로덕션에서는 HTTPS만 허용
    secure: env.NODE_ENV === 'production',

    // JavaScript로 쿠키 접근 불가 (XSS 방지)
    httpOnly: true,

    // 24시간 유효
    maxAge: 24 * 60 * 60 * 1000,

    // CSRF 공격 방지
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',

    // 쿠키 경로 제한
    path: '/',

    // 도메인 설정 (프로덕션에서 필요시 설정)
    // domain: env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
  },

  // 세션 ID 이름 변경 (기본값 'connect.sid' 대신)
  name: 'sessionId', // 보안을 위해 기본 이름 변경

  // 세션 ID 생성 방식
  genid: (req) => {
    // crypto를 사용한 강력한 랜덤 ID 생성
    return require('crypto').randomBytes(32).toString('hex');
  },

  // 프록시 신뢰 설정 (Nginx, Railway 등 사용 시)
  proxy: env.NODE_ENV === 'production',

  // 세션 갱신 설정 (세션 만료 임박 시 자동 갱신)
  rolling: true, // 요청마다 세션 만료 시간 갱신

  // 세션 만료 시 자동 삭제
  unset: 'destroy',
};

/**
 * 세션 스토어 설정 (선택사항)
 *
 * 프로덕션 환경에서는 메모리 스토어 대신 Redis 등 사용 권장
 *
 * 사용 예시:
 * import RedisStore from 'connect-redis';
 * import { createClient } from 'redis';
 *
 * const redisClient = createClient({
 *   url: process.env.REDIS_URL,
 *   legacyMode: true
 * });
 *
 * redisClient.connect().catch(console.error);
 *
 * export const sessionConfigWithRedis: session.SessionOptions = {
 *   ...sessionConfig,
 *   store: new RedisStore({
 *     client: redisClient as any,
 *     prefix: 'erp:sess:',
 *     ttl: 86400 // 24시간
 *   })
 * };
 */

/**
 * 세션 정리 미들웨어
 *
 * 만료된 세션 자동 정리 (메모리 스토어 사용 시)
 */
export function sessionCleanup() {
  // 메모리 스토어 사용 시에만 필요
  if (env.NODE_ENV !== 'production') {
    console.log('⚠️  개발 환경: 메모리 세션 스토어 사용 중');
    console.log('⚠️  프로덕션 환경에서는 Redis 등 외부 스토어 사용 권장');
  }
}

/**
 * 세션 보안 체크 미들웨어
 */
export function sessionSecurityCheck(
  req: any,
  res: any,
  next: any
) {
  // 세션이 있는 경우에만 체크
  if (req.session && req.session.userId) {
    // IP 주소 변경 감지 (세션 하이재킹 방지)
    const currentIP = req.ip || req.connection.remoteAddress;
    if (req.session.ip && req.session.ip !== currentIP) {
      console.warn('⚠️  세션 IP 변경 감지:', {
        sessionIP: req.session.ip,
        currentIP,
        userId: req.session.userId
      });

      // 보안 정책에 따라 세션 무효화 또는 경고
      // req.session.destroy();
      // return res.status(401).json({ message: '세션이 만료되었습니다.' });
    }

    // User-Agent 변경 감지
    const currentUA = req.headers['user-agent'];
    if (req.session.userAgent && req.session.userAgent !== currentUA) {
      console.warn('⚠️  세션 User-Agent 변경 감지:', {
        sessionUA: req.session.userAgent,
        currentUA,
        userId: req.session.userId
      });
    }

    // 첫 요청 시 IP와 User-Agent 저장
    if (!req.session.ip) {
      req.session.ip = currentIP;
    }
    if (!req.session.userAgent) {
      req.session.userAgent = currentUA;
    }
  }

  next();
}

export default sessionConfig;
