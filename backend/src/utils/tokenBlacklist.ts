/**
 * 토큰 블랙리스트 관리
 *
 * 로그아웃된 토큰을 관리하여 탈취된 토큰 재사용 방지
 * 주의: 메모리 기반이므로 서버 재시작 시 초기화됨
 * 프로덕션 환경에서는 Redis 사용 권장
 */

interface BlacklistedToken {
  token: string;
  expiresAt: number; // Unix timestamp
}

class TokenBlacklist {
  private blacklist: Map<string, number> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 5분마다 만료된 토큰 정리
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * 토큰을 블랙리스트에 추가
   * @param token JWT 토큰
   * @param expiresInMs 토큰 만료까지 남은 시간 (밀리초)
   */
  add(token: string, expiresInMs: number): void {
    const expiresAt = Date.now() + expiresInMs;
    this.blacklist.set(token, expiresAt);
  }

  /**
   * 토큰이 블랙리스트에 있는지 확인
   * @param token JWT 토큰
   * @returns 블랙리스트에 있으면 true
   */
  isBlacklisted(token: string): boolean {
    const expiresAt = this.blacklist.get(token);
    if (!expiresAt) {
      return false;
    }

    // 만료된 토큰은 블랙리스트에서 제거하고 false 반환
    if (Date.now() > expiresAt) {
      this.blacklist.delete(token);
      return false;
    }

    return true;
  }

  /**
   * 만료된 토큰 정리
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [token, expiresAt] of this.blacklist.entries()) {
      if (now > expiresAt) {
        this.blacklist.delete(token);
      }
    }
  }

  /**
   * 블랙리스트 크기 반환 (디버깅용)
   */
  size(): number {
    return this.blacklist.size;
  }

  /**
   * 정리 인터벌 중지 (테스트용)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// 싱글톤 인스턴스 export
export const tokenBlacklist = new TokenBlacklist();
