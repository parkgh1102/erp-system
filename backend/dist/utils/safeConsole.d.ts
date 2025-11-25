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
export declare const safeConsole: {
    /**
     * 일반 로그 (프로덕션에서는 비활성화)
     */
    log: (...args: any[]) => void;
    /**
     * 디버그 로그 (프로덕션에서는 비활성화)
     */
    debug: (...args: any[]) => void;
    /**
     * 정보 로그 (프로덕션에서도 logger로 기록)
     */
    info: (...args: any[]) => void;
    /**
     * 경고 로그 (모든 환경에서 기록)
     */
    warn: (...args: any[]) => void;
    /**
     * 에러 로그 (모든 환경에서 기록)
     */
    error: (...args: any[]) => void;
    /**
     * 민감 정보 마스킹 로그
     * 이메일, 전화번호 등 자동 마스킹
     */
    sensitive: (label: string, data: any) => void;
    /**
     * 성능 측정 시작
     */
    time: (label: string) => void;
    /**
     * 성능 측정 종료
     */
    timeEnd: (label: string) => void;
    /**
     * 테이블 형태 출력 (개발 환경에서만)
     */
    table: (data: any) => void;
};
export default safeConsole;
//# sourceMappingURL=safeConsole.d.ts.map