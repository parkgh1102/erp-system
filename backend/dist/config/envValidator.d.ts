/**
 * 개선된 환경 변수 검증
 *
 * 기존 envValidator.ts를 수정하지 않고 새로운 보안 강화 설정 제공
 *
 * 주요 개선사항:
 * 1. HTTPS 강제 검증 강화
 * 2. 더 엄격한 시크릿 키 검증
 * 3. 추가 보안 설정 검증
 */
/**
 * 개선된 환경 변수 검증
 */
export declare const validateEnvImproved: () => any;
/**
 * 환경 변수 검증 및 반환 (named export)
 */
export declare function getValidatedEnv(): any;
/**
 * 시크릿 키 생성 헬퍼
 *
 * 사용법:
 * import { generateSecretKey } from './config/envValidator.improved';
 * console.log('JWT_SECRET:', generateSecretKey());
 */
export declare function generateSecretKey(length?: number): string;
/**
 * 환경 변수 출력 (민감 정보 마스킹)
 */
export declare function printEnvSummary(): void;
export declare const validateEnv: () => any;
export default getValidatedEnv;
//# sourceMappingURL=envValidator.d.ts.map