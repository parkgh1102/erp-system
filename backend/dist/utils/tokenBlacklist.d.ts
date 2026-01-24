/**
 * 토큰 블랙리스트 관리
 *
 * 로그아웃된 토큰을 관리하여 탈취된 토큰 재사용 방지
 * 주의: 메모리 기반이므로 서버 재시작 시 초기화됨
 * 프로덕션 환경에서는 Redis 사용 권장
 */
declare class TokenBlacklist {
    private blacklist;
    private cleanupInterval;
    constructor();
    /**
     * 토큰을 블랙리스트에 추가
     * @param token JWT 토큰
     * @param expiresInMs 토큰 만료까지 남은 시간 (밀리초)
     */
    add(token: string, expiresInMs: number): void;
    /**
     * 토큰이 블랙리스트에 있는지 확인
     * @param token JWT 토큰
     * @returns 블랙리스트에 있으면 true
     */
    isBlacklisted(token: string): boolean;
    /**
     * 만료된 토큰 정리
     */
    private cleanup;
    /**
     * 블랙리스트 크기 반환 (디버깅용)
     */
    size(): number;
    /**
     * 정리 인터벌 중지 (테스트용)
     */
    stopCleanup(): void;
}
export declare const tokenBlacklist: TokenBlacklist;
export {};
//# sourceMappingURL=tokenBlacklist.d.ts.map