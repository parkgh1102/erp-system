import { v2 as cloudinary } from 'cloudinary';
import safeConsole from '../utils/safeConsole';

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  /**
   * Cloudinary에 이미지 업로드
   * @param imageBuffer 이미지 버퍼
   * @param fileName 파일명 (선택)
   * @returns 업로드된 이미지 URL
   */
  static async uploadImage(imageBuffer: Buffer, fileName?: string): Promise<string | null> {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      safeConsole.error('Cloudinary 환경변수가 설정되지 않았습니다.');
      return null;
    }

    try {
      safeConsole.log('Cloudinary 업로드 시작...');

      // Buffer를 base64 data URI로 변환
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

      // 업로드 옵션
      const uploadOptions: any = {
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
      const result = await cloudinary.uploader.upload(base64Image, uploadOptions);

      safeConsole.log('Cloudinary 업로드 성공:', result.public_id);

      return result.secure_url;
    } catch (error: any) {
      safeConsole.error('Cloudinary 업로드 실패:', error.message || error);
      return null;
    }
  }

  /**
   * 이미지 삭제
   * @param publicId 이미지 public_id
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId);
      safeConsole.log('Cloudinary 이미지 삭제:', publicId);
      return true;
    } catch (error: any) {
      safeConsole.error('Cloudinary 삭제 실패:', error.message);
      return false;
    }
  }
}
