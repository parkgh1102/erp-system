/**
 * 에러 코드 상수 정의
 *
 * 체계적인 에러 관리를 위한 표준화된 에러 코드
 *
 * 사용법:
 * import { ErrorCodes } from './constants/errorCodes';
 *
 * return res.status(401).json({
 *   success: false,
 *   message: '이메일 또는 비밀번호가 틀립니다.',
 *   code: ErrorCodes.AUTH_INVALID_CREDENTIALS
 * });
 */
export declare const ErrorCodes: {
    readonly AUTH_INVALID_CREDENTIALS: "ERR_AUTH_001";
    readonly AUTH_TOKEN_EXPIRED: "ERR_AUTH_002";
    readonly AUTH_TOKEN_INVALID: "ERR_AUTH_003";
    readonly AUTH_TOKEN_MISSING: "ERR_AUTH_004";
    readonly AUTH_UNAUTHORIZED: "ERR_AUTH_005";
    readonly AUTH_FORBIDDEN: "ERR_AUTH_006";
    readonly AUTH_EMAIL_ALREADY_EXISTS: "ERR_AUTH_007";
    readonly AUTH_EMAIL_NOT_FOUND: "ERR_AUTH_008";
    readonly AUTH_PASSWORD_WEAK: "ERR_AUTH_009";
    readonly AUTH_PASSWORD_INCORRECT: "ERR_AUTH_010";
    readonly AUTH_SESSION_EXPIRED: "ERR_AUTH_011";
    readonly AUTH_REFRESH_TOKEN_INVALID: "ERR_AUTH_012";
    readonly BIZ_NOT_FOUND: "ERR_BIZ_001";
    readonly BIZ_CUSTOMER_NOT_FOUND: "ERR_BIZ_002";
    readonly BIZ_PRODUCT_NOT_FOUND: "ERR_BIZ_003";
    readonly BIZ_SALES_NOT_FOUND: "ERR_BIZ_004";
    readonly BIZ_PURCHASE_NOT_FOUND: "ERR_BIZ_005";
    readonly BIZ_PAYMENT_NOT_FOUND: "ERR_BIZ_006";
    readonly BIZ_DUPLICATE_BUSINESS_NUMBER: "ERR_BIZ_007";
    readonly BIZ_INVALID_BUSINESS_NUMBER: "ERR_BIZ_008";
    readonly BIZ_ACCESS_DENIED: "ERR_BIZ_009";
    readonly BIZ_ALREADY_SIGNED: "ERR_BIZ_010";
    readonly DB_CONNECTION_FAILED: "ERR_DB_001";
    readonly DB_QUERY_FAILED: "ERR_DB_002";
    readonly DB_TRANSACTION_FAILED: "ERR_DB_003";
    readonly DB_DUPLICATE_ENTRY: "ERR_DB_004";
    readonly DB_FOREIGN_KEY_VIOLATION: "ERR_DB_005";
    readonly DB_TIMEOUT: "ERR_DB_006";
    readonly VAL_INVALID_INPUT: "ERR_VAL_001";
    readonly VAL_MISSING_REQUIRED_FIELD: "ERR_VAL_002";
    readonly VAL_INVALID_EMAIL: "ERR_VAL_003";
    readonly VAL_INVALID_PHONE: "ERR_VAL_004";
    readonly VAL_INVALID_DATE: "ERR_VAL_005";
    readonly VAL_INVALID_NUMBER: "ERR_VAL_006";
    readonly VAL_OUT_OF_RANGE: "ERR_VAL_007";
    readonly VAL_INVALID_FORMAT: "ERR_VAL_008";
    readonly RATE_LIMIT_EXCEEDED: "ERR_RATE_001";
    readonly RATE_LIMIT_AUTH_EXCEEDED: "ERR_RATE_002";
    readonly RATE_LIMIT_API_EXCEEDED: "ERR_RATE_003";
    readonly FILE_TOO_LARGE: "ERR_FILE_001";
    readonly FILE_INVALID_TYPE: "ERR_FILE_002";
    readonly FILE_INVALID_EXTENSION: "ERR_FILE_003";
    readonly FILE_NOT_FOUND: "ERR_FILE_004";
    readonly FILE_UPLOAD_FAILED: "ERR_FILE_005";
    readonly FILE_TOO_MANY: "ERR_FILE_006";
    readonly FILE_INVALID_NAME: "ERR_FILE_007";
    readonly FILE_MIME_MISMATCH: "ERR_FILE_008";
    readonly CSRF_TOKEN_INVALID: "ERR_CSRF_001";
    readonly CSRF_TOKEN_MISSING: "ERR_CSRF_002";
    readonly CSRF_TOKEN_EXPIRED: "ERR_CSRF_003";
    readonly SRV_INTERNAL_ERROR: "ERR_SRV_001";
    readonly SRV_SERVICE_UNAVAILABLE: "ERR_SRV_002";
    readonly SRV_TIMEOUT: "ERR_SRV_003";
    readonly SRV_NOT_IMPLEMENTED: "ERR_SRV_004";
    readonly EXT_ALIMTALK_FAILED: "ERR_EXT_001";
    readonly EXT_SMS_FAILED: "ERR_EXT_002";
    readonly EXT_EMAIL_FAILED: "ERR_EXT_003";
    readonly EXT_API_FAILED: "ERR_EXT_004";
    readonly OTP_INVALID: "ERR_OTP_001";
    readonly OTP_EXPIRED: "ERR_OTP_002";
    readonly OTP_MAX_ATTEMPTS: "ERR_OTP_003";
    readonly OTP_SEND_FAILED: "ERR_OTP_004";
    readonly NOTIF_NOT_FOUND: "ERR_NOTIF_001";
    readonly NOTIF_SEND_FAILED: "ERR_NOTIF_002";
};
/**
 * 에러 코드 타입
 */
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
/**
 * 에러 코드별 상세 설명 (선택사항)
 */
export declare const ErrorDescriptions: Record<ErrorCode, string>;
/**
 * HTTP 상태 코드 매핑 (선택사항)
 */
export declare const ErrorCodeToHttpStatus: Partial<Record<ErrorCode, number>>;
//# sourceMappingURL=errorCodes.d.ts.map