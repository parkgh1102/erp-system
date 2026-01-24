/**
 * 민감 정보 마스킹 유틸리티
 *
 * 로그에 기록할 때 개인정보를 보호하기 위한 마스킹 함수들
 */
/**
 * 이메일 마스킹
 * example@domain.com -> exa***@domain.com
 */
export declare function maskEmail(email: string): string;
/**
 * 전화번호 마스킹
 * 010-1234-5678 -> 010-****-5678
 */
export declare function maskPhone(phone: string): string;
/**
 * 사업자등록번호 마스킹
 * 123-45-67890 -> 123-**-*****
 */
export declare function maskBusinessNumber(businessNumber: string): string;
/**
 * 이름 마스킹
 * 홍길동 -> 홍*동
 */
export declare function maskName(name: string): string;
/**
 * IP 주소 마스킹
 * 192.168.1.100 -> 192.168.*.*
 */
export declare function maskIP(ip: string): string;
/**
 * 객체 내 민감 정보 마스킹
 */
export declare function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown>;
//# sourceMappingURL=maskingUtils.d.ts.map