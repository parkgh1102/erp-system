import axios from 'axios';
import FormData from 'form-data';

interface ImgbbResponse {
  success: boolean;
  data?: {
    url: string;
    display_url: string;
    delete_url: string;
    id: string;
    title: string;
    expiration: number;
  };
  error?: {
    message: string;
    code: number;
  };
}

export class ImgbbService {
  private static API_URL = 'https://api.imgbb.com/1/upload';

  /**
   * ImgBB에 이미지 업로드
   * @param imageBuffer 이미지 버퍼 (Buffer 또는 Base64 문자열)
   * @param fileName 파일명 (선택)
   * @returns 업로드된 이미지 URL
   */
  static async uploadImage(imageBuffer: Buffer | string, fileName?: string): Promise<string | null> {
    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      console.error('❌ IMGBB_API_KEY 환경변수가 설정되지 않았습니다.');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('key', apiKey);

      // Buffer인 경우 Base64로 변환
      let base64Image: string;
      if (Buffer.isBuffer(imageBuffer)) {
        base64Image = imageBuffer.toString('base64');
      } else {
        // 이미 Base64 문자열인 경우 (data:image/... 프리픽스 제거)
        base64Image = imageBuffer.replace(/^data:image\/\w+;base64,/, '');
      }

      formData.append('image', base64Image);

      if (fileName) {
        formData.append('name', fileName);
      }

      // 이미지 만료 시간 설정 (선택) - 초 단위, 최소 60초
      // formData.append('expiration', '604800'); // 7일 후 만료

      console.log('📤 ImgBB 업로드 시작...');

      const response = await axios.post<ImgbbResponse>(
        this.API_URL,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000, // 30초 타임아웃
        }
      );

      if (response.data.success && response.data.data) {
        const imageUrl = response.data.data.display_url;
        console.log('✅ ImgBB 업로드 성공:', {
          url: imageUrl,
          id: response.data.data.id
        });
        return imageUrl;
      } else {
        console.error('❌ ImgBB 업로드 실패:', response.data.error);
        return null;
      }
    } catch (error: any) {
      console.error('❌ ImgBB 업로드 중 오류:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Base64 이미지 데이터 업로드 (data:image/... 형식)
   * @param base64Data Base64 인코딩된 이미지 데이터
   * @param fileName 파일명 (선택)
   * @returns 업로드된 이미지 URL
   */
  static async uploadBase64(base64Data: string, fileName?: string): Promise<string | null> {
    // data:image/jpeg;base64, 프리픽스 제거
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    return this.uploadImage(cleanBase64, fileName);
  }
}
