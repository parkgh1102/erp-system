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
import multer from 'multer';
export declare const avatarUpload: multer.Multer;
export declare const statementUpload: multer.Multer;
export declare const documentUpload: multer.Multer;
/**
 * 파일 업로드 에러 핸들러
 */
export declare function handleUploadError(error: any): {
    success: boolean;
    message: any;
    code: string;
};
//# sourceMappingURL=fileUploadSecurity.d.ts.map