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
/**
 * 보안 강화된 세션 설정
 */
export declare const sessionConfig: session.SessionOptions;
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
export declare function sessionCleanup(): void;
/**
 * 세션 보안 체크 미들웨어
 */
export declare function sessionSecurityCheck(req: any, res: any, next: any): void;
export default sessionConfig;
//# sourceMappingURL=sessionConfig.d.ts.map