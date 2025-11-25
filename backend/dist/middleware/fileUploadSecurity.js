"use strict";
/**
 * 보안 강화된 파일 업로드 미들웨어
 *
 * 기능:
 * - MIME 타입 검증
 * - 파일 확장자 검증
 * - 파일 크기 제한
 * - 안전한 파일명 생성
 * - 이미지 파일 악성코드 검증 (선택)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentUpload = exports.statementUpload = exports.avatarUpload = void 0;
exports.handleUploadError = handleUploadError;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
// 허용되는 이미지 MIME 타입
const ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
];
// 허용되는 이미지 확장자
const ALLOWED_IMAGE_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg'
];
// 파일 크기 제한 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// 문서 파일 MIME 타입
const ALLOWED_DOCUMENT_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
];
// 문서 파일 확장자
const ALLOWED_DOCUMENT_EXTENSIONS = [
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.csv'
];
/**
 * 안전한 파일명 생성
 */
function generateSafeFilename(originalName, prefix = 'file') {
    // 확장자 추출
    const ext = path_1.default.extname(originalName).toLowerCase();
    // 랜덤 문자열 생성 (crypto 사용)
    const randomBytes = crypto_1.default.randomBytes(16).toString('hex');
    // 타임스탬프
    const timestamp = Date.now();
    // 안전한 파일명: prefix-timestamp-random.ext
    return `${prefix}-${timestamp}-${randomBytes}${ext}`;
}
/**
 * 위험한 파일명 패턴 검증
 */
function isValidFilename(filename) {
    // 경로 탐색 공격 방지 (../, ..\)
    if (filename.includes('..')) {
        return false;
    }
    // 절대 경로 방지
    if (path_1.default.isAbsolute(filename)) {
        return false;
    }
    // null byte 공격 방지
    if (filename.includes('\0')) {
        return false;
    }
    // 특수 문자 제한
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) {
        return false;
    }
    return true;
}
/**
 * 아바타 이미지 업로드 설정
 */
const avatarStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/avatars');
    },
    filename: (req, file, cb) => {
        const safeFilename = generateSafeFilename(file.originalname, 'avatar');
        cb(null, safeFilename);
    }
});
exports.avatarUpload = (0, multer_1.default)({
    storage: avatarStorage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1 // 한 번에 1개 파일만
    },
    fileFilter: (req, file, cb) => {
        // 원본 파일명 검증
        if (!isValidFilename(file.originalname)) {
            return cb(new Error('유효하지 않은 파일명입니다.'));
        }
        // MIME 타입 검증
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
            return cb(new Error('이미지 파일만 업로드 가능합니다. (jpg, png, gif, webp)'));
        }
        // 파일 확장자 검증
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
            return cb(new Error('허용되지 않는 파일 확장자입니다.'));
        }
        // MIME 타입과 확장자 일치 여부 확인
        const mimeToExt = {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'image/webp': ['.webp'],
            'image/svg+xml': ['.svg']
        };
        const expectedExts = mimeToExt[file.mimetype] || [];
        if (!expectedExts.includes(ext)) {
            return cb(new Error('파일 확장자와 MIME 타입이 일치하지 않습니다.'));
        }
        cb(null, true);
    }
});
/**
 * 거래명세표 이미지 업로드 설정
 */
const statementStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/statements');
    },
    filename: (req, file, cb) => {
        const safeFilename = generateSafeFilename(file.originalname, 'statement');
        cb(null, safeFilename);
    }
});
exports.statementUpload = (0, multer_1.default)({
    storage: statementStorage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (!isValidFilename(file.originalname)) {
            return cb(new Error('유효하지 않은 파일명입니다.'));
        }
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
            return cb(new Error('이미지 파일만 업로드 가능합니다.'));
        }
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
            return cb(new Error('허용되지 않는 파일 확장자입니다.'));
        }
        cb(null, true);
    }
});
/**
 * 문서 파일 업로드 설정
 */
const documentStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/documents');
    },
    filename: (req, file, cb) => {
        const safeFilename = generateSafeFilename(file.originalname, 'document');
        cb(null, safeFilename);
    }
});
exports.documentUpload = (0, multer_1.default)({
    storage: documentStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 문서는 10MB까지
        files: 5 // 최대 5개 파일
    },
    fileFilter: (req, file, cb) => {
        if (!isValidFilename(file.originalname)) {
            return cb(new Error('유효하지 않은 파일명입니다.'));
        }
        if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
            return cb(new Error('허용되지 않는 파일 형식입니다. (pdf, doc, docx, xls, xlsx, csv만 가능)'));
        }
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
            return cb(new Error('허용되지 않는 파일 확장자입니다.'));
        }
        cb(null, true);
    }
});
/**
 * 파일 업로드 에러 핸들러
 */
function handleUploadError(error) {
    if (error instanceof multer_1.default.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return {
                    success: false,
                    message: '파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.',
                    code: 'FILE_TOO_LARGE'
                };
            case 'LIMIT_FILE_COUNT':
                return {
                    success: false,
                    message: '파일 개수가 너무 많습니다.',
                    code: 'TOO_MANY_FILES'
                };
            case 'LIMIT_UNEXPECTED_FILE':
                return {
                    success: false,
                    message: '예상치 못한 파일 필드입니다.',
                    code: 'UNEXPECTED_FIELD'
                };
            default:
                return {
                    success: false,
                    message: '파일 업로드 중 오류가 발생했습니다.',
                    code: 'UPLOAD_ERROR'
                };
        }
    }
    // 커스텀 에러 메시지
    return {
        success: false,
        message: error.message || '파일 업로드 중 오류가 발생했습니다.',
        code: 'UPLOAD_ERROR'
    };
}
//# sourceMappingURL=fileUploadSecurity.js.map