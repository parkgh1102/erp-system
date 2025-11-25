"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
// Cloudinary 설정
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
class CloudinaryService {
    /**
     * Cloudinary에 이미지 업로드
     * @param imageBuffer 이미지 버퍼
     * @param fileName 파일명 (선택)
     * @returns 업로드된 이미지 URL
     */
    static async uploadImage(imageBuffer, fileName) {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error('❌ Cloudinary 환경변수가 설정되지 않았습니다.');
            return null;
        }
        try {
            console.log('📤 Cloudinary 업로드 시작...');
            // Buffer를 base64 data URI로 변환
            const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
            // 업로드 옵션
            const uploadOptions = {
                folder: 'erp-statements', // 폴더 지정
                resource_type: 'image',
                format: 'jpg',
                quality: 'auto:good', // 자동 품질 최적화
                fetch_format: 'auto', // 자동 포맷 최적화
            };
            if (fileName) {
                uploadOptions.public_id = fileName;
            }
            // 업로드 실행
            const result = await cloudinary_1.v2.uploader.upload(base64Image, uploadOptions);
            console.log('✅ Cloudinary 업로드 성공:', {
                url: result.secure_url,
                public_id: result.public_id,
                bytes: result.bytes
            });
            return result.secure_url;
        }
        catch (error) {
            console.error('❌ Cloudinary 업로드 실패:', error.message || error);
            return null;
        }
    }
    /**
     * 이미지 삭제
     * @param publicId 이미지 public_id
     */
    static async deleteImage(publicId) {
        try {
            await cloudinary_1.v2.uploader.destroy(publicId);
            console.log('✅ Cloudinary 이미지 삭제:', publicId);
            return true;
        }
        catch (error) {
            console.error('❌ Cloudinary 삭제 실패:', error.message);
            return false;
        }
    }
}
exports.CloudinaryService = CloudinaryService;
//# sourceMappingURL=CloudinaryService.js.map