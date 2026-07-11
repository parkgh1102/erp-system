/**
 * 토큰 블랙리스트 관리 (플러그블 스토어)
 *
 * 로그아웃/재설정된 토큰을 관리하여 탈취된 토큰 재사용 방지.
 *
 * - 기본: 메모리 백엔드 (단일 인스턴스용, 서버 재시작 시 초기화됨)
 * - REDIS_URL 설정 시: Redis 백엔드 (다중 인스턴스 공유 + 재시작 내구성)
 *   Redis 장애 시에는 fail-open(차단하지 않음)으로 가용성을 우선하며,
 *   토큰 자체 만료가 최종 방어선으로 남는다.
 *
 * 저장 시 원문 토큰이 아니라 SHA-256 해시를 키로 사용한다(길이/유출 표면 축소).
 */

import crypto from 'crypto';
import Redis from 'ioredis';
import { logger } from './logger';

const KEY_PREFIX = 'bl:';
const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

interface BlacklistBackend {
  add(token: string, expiresInMs: number): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
}

/** 메모리 백엔드 (기본) */
class MemoryBlacklist implements BlacklistBackend {
  private map: Map<string, number> = new Map(); // hashedToken -> expiresAt(ms)

  constructor() {
    // 5분마다 만료 항목 정리. unref로 프로세스 종료를 막지 않음.
    const interval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    interval.unref?.();
  }

  async add(token: string, expiresInMs: number): Promise<void> {
    if (expiresInMs <= 0) return;
    this.map.set(hashToken(token), Date.now() + expiresInMs);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const key = hashToken(token);
    const expiresAt = this.map.get(key);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.map.delete(key);
      return false;
    }
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, expiresAt] of this.map.entries()) {
      if (now > expiresAt) this.map.delete(key);
    }
  }
}

/** Redis 백엔드 (REDIS_URL 설정 시) */
class RedisBlacklist implements BlacklistBackend {
  private client: Redis;
  private healthy = true;

  constructor(url: string) {
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    this.client.on('error', (err: Error) => {
      if (this.healthy) {
        logger.error('토큰 블랙리스트 Redis 오류 (fail-open으로 동작)', err);
      }
      this.healthy = false;
    });
    this.client.on('ready', () => {
      if (!this.healthy) logger.info('토큰 블랙리스트 Redis 연결 복구됨');
      this.healthy = true;
    });
  }

  async add(token: string, expiresInMs: number): Promise<void> {
    if (expiresInMs <= 0) return;
    try {
      // PX(ms) TTL로 자동 만료 → 별도 정리 불필요
      await this.client.set(KEY_PREFIX + hashToken(token), '1', 'PX', Math.ceil(expiresInMs));
    } catch (err) {
      // 추가 실패 시 해당 토큰은 블랙리스트되지 않지만 자체 만료로 방어됨
      logger.error('토큰 블랙리스트 추가 실패 (Redis) — 토큰 자체 만료로 방어', err as Error);
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(KEY_PREFIX + hashToken(token));
      return exists === 1;
    } catch {
      // fail-open: 조회 실패 시 차단하지 않음(사용자 락아웃 방지)
      return false;
    }
  }
}

const redisUrl = process.env.REDIS_URL;
const backend: BlacklistBackend = redisUrl
  ? new RedisBlacklist(redisUrl)
  : new MemoryBlacklist();

if (redisUrl) {
  logger.info('토큰 블랙리스트: Redis 백엔드 사용');
} else {
  logger.info('토큰 블랙리스트: 메모리 백엔드 사용 (단일 인스턴스). REDIS_URL 설정 시 Redis로 전환');
}

/**
 * 토큰 블랙리스트 API (비동기)
 * @remarks add/isBlacklisted 모두 Promise를 반환하므로 호출부에서 await 필요.
 */
export const tokenBlacklist = {
  /** 토큰을 블랙리스트에 추가 (expiresInMs: 만료까지 남은 시간) */
  add: (token: string, expiresInMs: number): Promise<void> => backend.add(token, expiresInMs),
  /** 토큰이 블랙리스트에 있는지 확인 (실패 시 false로 fail-open) */
  isBlacklisted: (token: string): Promise<boolean> => backend.isBlacklisted(token),
};
