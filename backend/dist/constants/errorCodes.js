"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodeToHttpStatus = exports.ErrorDescriptions = exports.ErrorCodes = void 0;
exports.ErrorCodes = {
    // ========================================
    // 인증 및 권한 관련 (AUTH_xxx)
    // ========================================
    AUTH_INVALID_CREDENTIALS: 'ERR_AUTH_001',
    AUTH_TOKEN_EXPIRED: 'ERR_AUTH_002',
    AUTH_TOKEN_INVALID: 'ERR_AUTH_003',
    AUTH_TOKEN_MISSING: 'ERR_AUTH_004',
    AUTH_UNAUTHORIZED: 'ERR_AUTH_005',
    AUTH_FORBIDDEN: 'ERR_AUTH_006',
    AUTH_EMAIL_ALREADY_EXISTS: 'ERR_AUTH_007',
    AUTH_EMAIL_NOT_FOUND: 'ERR_AUTH_008',
    AUTH_PASSWORD_WEAK: 'ERR_AUTH_009',
    AUTH_PASSWORD_INCORRECT: 'ERR_AUTH_010',
    AUTH_SESSION_EXPIRED: 'ERR_AUTH_011',
    AUTH_REFRESH_TOKEN_INVALID: 'ERR_AUTH_012',
    // ========================================
    // 비즈니스 로직 관련 (BIZ_xxx)
    // ========================================
    BIZ_NOT_FOUND: 'ERR_BIZ_001',
    BIZ_CUSTOMER_NOT_FOUND: 'ERR_BIZ_002',
    BIZ_PRODUCT_NOT_FOUND: 'ERR_BIZ_003',
    BIZ_SALES_NOT_FOUND: 'ERR_BIZ_004',
    BIZ_PURCHASE_NOT_FOUND: 'ERR_BIZ_005',
    BIZ_PAYMENT_NOT_FOUND: 'ERR_BIZ_006',
    BIZ_DUPLICATE_BUSINESS_NUMBER: 'ERR_BIZ_007',
    BIZ_INVALID_BUSINESS_NUMBER: 'ERR_BIZ_008',
    BIZ_ACCESS_DENIED: 'ERR_BIZ_009',
    BIZ_ALREADY_SIGNED: 'ERR_BIZ_010',
    // ========================================
    // 데이터베이스 관련 (DB_xxx)
    // ========================================
    DB_CONNECTION_FAILED: 'ERR_DB_001',
    DB_QUERY_FAILED: 'ERR_DB_002',
    DB_TRANSACTION_FAILED: 'ERR_DB_003',
    DB_DUPLICATE_ENTRY: 'ERR_DB_004',
    DB_FOREIGN_KEY_VIOLATION: 'ERR_DB_005',
    DB_TIMEOUT: 'ERR_DB_006',
    // ========================================
    // 유효성 검증 관련 (VAL_xxx)
    // ========================================
    VAL_INVALID_INPUT: 'ERR_VAL_001',
    VAL_MISSING_REQUIRED_FIELD: 'ERR_VAL_002',
    VAL_INVALID_EMAIL: 'ERR_VAL_003',
    VAL_INVALID_PHONE: 'ERR_VAL_004',
    VAL_INVALID_DATE: 'ERR_VAL_005',
    VAL_INVALID_NUMBER: 'ERR_VAL_006',
    VAL_OUT_OF_RANGE: 'ERR_VAL_007',
    VAL_INVALID_FORMAT: 'ERR_VAL_008',
    // ========================================
    // Rate Limiting 관련 (RATE_xxx)
    // ========================================
    RATE_LIMIT_EXCEEDED: 'ERR_RATE_001',
    RATE_LIMIT_AUTH_EXCEEDED: 'ERR_RATE_002',
    RATE_LIMIT_API_EXCEEDED: 'ERR_RATE_003',
    // ========================================
    // 파일 업로드 관련 (FILE_xxx)
    // ========================================
    FILE_TOO_LARGE: 'ERR_FILE_001',
    FILE_INVALID_TYPE: 'ERR_FILE_002',
    FILE_INVALID_EXTENSION: 'ERR_FILE_003',
    FILE_NOT_FOUND: 'ERR_FILE_004',
    FILE_UPLOAD_FAILED: 'ERR_FILE_005',
    FILE_TOO_MANY: 'ERR_FILE_006',
    FILE_INVALID_NAME: 'ERR_FILE_007',
    FILE_MIME_MISMATCH: 'ERR_FILE_008',
    // ========================================
    // CSRF 보호 관련 (CSRF_xxx)
    // ========================================
    CSRF_TOKEN_INVALID: 'ERR_CSRF_001',
    CSRF_TOKEN_MISSING: 'ERR_CSRF_002',
    CSRF_TOKEN_EXPIRED: 'ERR_CSRF_003',
    // ========================================
    // 서버 오류 관련 (SRV_xxx)
    // ========================================
    SRV_INTERNAL_ERROR: 'ERR_SRV_001',
    SRV_SERVICE_UNAVAILABLE: 'ERR_SRV_002',
    SRV_TIMEOUT: 'ERR_SRV_003',
    SRV_NOT_IMPLEMENTED: 'ERR_SRV_004',
    // ========================================
    // 외부 서비스 관련 (EXT_xxx)
    // ========================================
    EXT_ALIMTALK_FAILED: 'ERR_EXT_001',
    EXT_SMS_FAILED: 'ERR_EXT_002',
    EXT_EMAIL_FAILED: 'ERR_EXT_003',
    EXT_API_FAILED: 'ERR_EXT_004',
    // ========================================
    // OTP 관련 (OTP_xxx)
    // ========================================
    OTP_INVALID: 'ERR_OTP_001',
    OTP_EXPIRED: 'ERR_OTP_002',
    OTP_MAX_ATTEMPTS: 'ERR_OTP_003',
    OTP_SEND_FAILED: 'ERR_OTP_004',
    // ========================================
    // 알림 관련 (NOTIF_xxx)
    // ========================================
    NOTIF_NOT_FOUND: 'ERR_NOTIF_001',
    NOTIF_SEND_FAILED: 'ERR_NOTIF_002',
};
/**
 * 에러 코드별 상세 설명 (선택사항)
 */
exports.ErrorDescriptions = {
    // 인증
    [exports.ErrorCodes.AUTH_INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',
    [exports.ErrorCodes.AUTH_TOKEN_EXPIRED]: '인증 토큰이 만료되었습니다. 다시 로그인해주세요.',
    [exports.ErrorCodes.AUTH_TOKEN_INVALID]: '유효하지 않은 인증 토큰입니다.',
    [exports.ErrorCodes.AUTH_TOKEN_MISSING]: '인증 토큰이 필요합니다.',
    [exports.ErrorCodes.AUTH_UNAUTHORIZED]: '인증이 필요합니다.',
    [exports.ErrorCodes.AUTH_FORBIDDEN]: '접근 권한이 없습니다.',
    [exports.ErrorCodes.AUTH_EMAIL_ALREADY_EXISTS]: '이미 사용 중인 이메일입니다.',
    [exports.ErrorCodes.AUTH_EMAIL_NOT_FOUND]: '등록되지 않은 이메일입니다.',
    [exports.ErrorCodes.AUTH_PASSWORD_WEAK]: '비밀번호가 보안 정책을 충족하지 않습니다.',
    [exports.ErrorCodes.AUTH_PASSWORD_INCORRECT]: '현재 비밀번호가 올바르지 않습니다.',
    [exports.ErrorCodes.AUTH_SESSION_EXPIRED]: '세션이 만료되었습니다.',
    [exports.ErrorCodes.AUTH_REFRESH_TOKEN_INVALID]: '유효하지 않은 리프레시 토큰입니다.',
    // 비즈니스 로직
    [exports.ErrorCodes.BIZ_NOT_FOUND]: '사업자 정보를 찾을 수 없습니다.',
    [exports.ErrorCodes.BIZ_CUSTOMER_NOT_FOUND]: '거래처 정보를 찾을 수 없습니다.',
    [exports.ErrorCodes.BIZ_PRODUCT_NOT_FOUND]: '상품 정보를 찾을 수 없습니다.',
    [exports.ErrorCodes.BIZ_SALES_NOT_FOUND]: '매출 정보를 찾을 수 없습니다.',
    [exports.ErrorCodes.BIZ_PURCHASE_NOT_FOUND]: '매입 정보를 찾을 수 없습니다.',
    [exports.ErrorCodes.BIZ_PAYMENT_NOT_FOUND]: '결제 정보를 찾을 수 없습니다.',
    [exports.ErrorCodes.BIZ_DUPLICATE_BUSINESS_NUMBER]: '이미 등록된 사업자번호입니다.',
    [exports.ErrorCodes.BIZ_INVALID_BUSINESS_NUMBER]: '유효하지 않은 사업자번호입니다.',
    [exports.ErrorCodes.BIZ_ACCESS_DENIED]: '해당 사업자에 접근 권한이 없습니다.',
    [exports.ErrorCodes.BIZ_ALREADY_SIGNED]: '이미 전자서명이 완료된 문서입니다.',
    // 데이터베이스
    [exports.ErrorCodes.DB_CONNECTION_FAILED]: '데이터베이스 연결에 실패했습니다.',
    [exports.ErrorCodes.DB_QUERY_FAILED]: '데이터베이스 쿼리 실행에 실패했습니다.',
    [exports.ErrorCodes.DB_TRANSACTION_FAILED]: '트랜잭션 처리에 실패했습니다.',
    [exports.ErrorCodes.DB_DUPLICATE_ENTRY]: '중복된 데이터입니다.',
    [exports.ErrorCodes.DB_FOREIGN_KEY_VIOLATION]: '참조 무결성 제약 조건 위반입니다.',
    [exports.ErrorCodes.DB_TIMEOUT]: '데이터베이스 작업 시간이 초과되었습니다.',
    // 유효성 검증
    [exports.ErrorCodes.VAL_INVALID_INPUT]: '입력값이 유효하지 않습니다.',
    [exports.ErrorCodes.VAL_MISSING_REQUIRED_FIELD]: '필수 입력 항목이 누락되었습니다.',
    [exports.ErrorCodes.VAL_INVALID_EMAIL]: '올바른 이메일 형식이 아닙니다.',
    [exports.ErrorCodes.VAL_INVALID_PHONE]: '올바른 전화번호 형식이 아닙니다.',
    [exports.ErrorCodes.VAL_INVALID_DATE]: '올바른 날짜 형식이 아닙니다.',
    [exports.ErrorCodes.VAL_INVALID_NUMBER]: '올바른 숫자 형식이 아닙니다.',
    [exports.ErrorCodes.VAL_OUT_OF_RANGE]: '허용된 범위를 벗어났습니다.',
    [exports.ErrorCodes.VAL_INVALID_FORMAT]: '올바른 형식이 아닙니다.',
    // Rate Limiting
    [exports.ErrorCodes.RATE_LIMIT_EXCEEDED]: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
    [exports.ErrorCodes.RATE_LIMIT_AUTH_EXCEEDED]: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.',
    [exports.ErrorCodes.RATE_LIMIT_API_EXCEEDED]: 'API 호출 한도를 초과했습니다.',
    // 파일 업로드
    [exports.ErrorCodes.FILE_TOO_LARGE]: '파일 크기가 너무 큽니다.',
    [exports.ErrorCodes.FILE_INVALID_TYPE]: '허용되지 않는 파일 형식입니다.',
    [exports.ErrorCodes.FILE_INVALID_EXTENSION]: '허용되지 않는 파일 확장자입니다.',
    [exports.ErrorCodes.FILE_NOT_FOUND]: '파일을 찾을 수 없습니다.',
    [exports.ErrorCodes.FILE_UPLOAD_FAILED]: '파일 업로드에 실패했습니다.',
    [exports.ErrorCodes.FILE_TOO_MANY]: '파일 개수가 너무 많습니다.',
    [exports.ErrorCodes.FILE_INVALID_NAME]: '유효하지 않은 파일명입니다.',
    [exports.ErrorCodes.FILE_MIME_MISMATCH]: '파일 확장자와 MIME 타입이 일치하지 않습니다.',
    // CSRF
    [exports.ErrorCodes.CSRF_TOKEN_INVALID]: 'CSRF 토큰이 유효하지 않습니다.',
    [exports.ErrorCodes.CSRF_TOKEN_MISSING]: 'CSRF 토큰이 누락되었습니다.',
    [exports.ErrorCodes.CSRF_TOKEN_EXPIRED]: 'CSRF 토큰이 만료되었습니다.',
    // 서버 오류
    [exports.ErrorCodes.SRV_INTERNAL_ERROR]: '서버 내부 오류가 발생했습니다.',
    [exports.ErrorCodes.SRV_SERVICE_UNAVAILABLE]: '서비스를 일시적으로 사용할 수 없습니다.',
    [exports.ErrorCodes.SRV_TIMEOUT]: '서버 응답 시간이 초과되었습니다.',
    [exports.ErrorCodes.SRV_NOT_IMPLEMENTED]: '아직 구현되지 않은 기능입니다.',
    // 외부 서비스
    [exports.ErrorCodes.EXT_ALIMTALK_FAILED]: '알림톡 전송에 실패했습니다.',
    [exports.ErrorCodes.EXT_SMS_FAILED]: 'SMS 전송에 실패했습니다.',
    [exports.ErrorCodes.EXT_EMAIL_FAILED]: '이메일 전송에 실패했습니다.',
    [exports.ErrorCodes.EXT_API_FAILED]: '외부 API 호출에 실패했습니다.',
    // OTP
    [exports.ErrorCodes.OTP_INVALID]: '유효하지 않은 인증번호입니다.',
    [exports.ErrorCodes.OTP_EXPIRED]: '인증번호가 만료되었습니다.',
    [exports.ErrorCodes.OTP_MAX_ATTEMPTS]: '인증 시도 횟수를 초과했습니다.',
    [exports.ErrorCodes.OTP_SEND_FAILED]: '인증번호 전송에 실패했습니다.',
    // 알림
    [exports.ErrorCodes.NOTIF_NOT_FOUND]: '알림을 찾을 수 없습니다.',
    [exports.ErrorCodes.NOTIF_SEND_FAILED]: '알림 전송에 실패했습니다.',
};
/**
 * HTTP 상태 코드 매핑 (선택사항)
 */
exports.ErrorCodeToHttpStatus = {
    // 401 Unauthorized
    [exports.ErrorCodes.AUTH_INVALID_CREDENTIALS]: 401,
    [exports.ErrorCodes.AUTH_TOKEN_EXPIRED]: 401,
    [exports.ErrorCodes.AUTH_TOKEN_INVALID]: 401,
    [exports.ErrorCodes.AUTH_TOKEN_MISSING]: 401,
    [exports.ErrorCodes.AUTH_UNAUTHORIZED]: 401,
    [exports.ErrorCodes.AUTH_SESSION_EXPIRED]: 401,
    // 403 Forbidden
    [exports.ErrorCodes.AUTH_FORBIDDEN]: 403,
    [exports.ErrorCodes.BIZ_ACCESS_DENIED]: 403,
    [exports.ErrorCodes.CSRF_TOKEN_INVALID]: 403,
    // 404 Not Found
    [exports.ErrorCodes.BIZ_NOT_FOUND]: 404,
    [exports.ErrorCodes.BIZ_CUSTOMER_NOT_FOUND]: 404,
    [exports.ErrorCodes.BIZ_PRODUCT_NOT_FOUND]: 404,
    [exports.ErrorCodes.FILE_NOT_FOUND]: 404,
    // 409 Conflict
    [exports.ErrorCodes.AUTH_EMAIL_ALREADY_EXISTS]: 409,
    [exports.ErrorCodes.BIZ_DUPLICATE_BUSINESS_NUMBER]: 409,
    [exports.ErrorCodes.DB_DUPLICATE_ENTRY]: 409,
    // 429 Too Many Requests
    [exports.ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
    [exports.ErrorCodes.RATE_LIMIT_AUTH_EXCEEDED]: 429,
    [exports.ErrorCodes.RATE_LIMIT_API_EXCEEDED]: 429,
    // 400 Bad Request
    [exports.ErrorCodes.VAL_INVALID_INPUT]: 400,
    [exports.ErrorCodes.FILE_TOO_LARGE]: 400,
    [exports.ErrorCodes.FILE_INVALID_TYPE]: 400,
    // 500 Internal Server Error
    [exports.ErrorCodes.SRV_INTERNAL_ERROR]: 500,
    [exports.ErrorCodes.DB_CONNECTION_FAILED]: 500,
    [exports.ErrorCodes.DB_QUERY_FAILED]: 500,
    // 503 Service Unavailable
    [exports.ErrorCodes.SRV_SERVICE_UNAVAILABLE]: 503,
};
//# sourceMappingURL=errorCodes.js.map