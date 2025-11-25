import axios from 'axios';
import FormData from 'form-data';

interface AlimtalkParams {
  api_key: string;
  template_code: string;
  variable: string;
  callback: string;
  dstaddr: string;
  next_type: string;
  send_reserve: string;
}

interface AlimtalkResponse {
  code?: string | number;
  result?: string | number;
  message?: string;
}

export class AlimtalkService {
  private static API_URL = 'http://221.139.14.189/API/alimtalk_api';
  private static API_KEY = 'FVLKIK16YSJ0513';
  private static OTP_TEMPLATE_CODE = 'SJT_123168'; // OTP 템플릿
  private static WELCOME_TEMPLATE_CODE = 'SJT_123166'; // 회원가입 환영 템플릿
  private static ESIGNATURE_TEMPLATE_CODE = 'SJT_125177'; // 전자서명 완료 안내 템플릿
  private static SENDER_KEY = 'ebb6785f05eeae3c22142d465bb46603ff1eeb32';
  private static CALLBACK = '01040167148'; // 발신번호

  /**
   * OTP 알림톡 전송
   * @param phone 수신자 전화번호 (01012345678 형식)
   * @param otpCode 6자리 OTP 코드
   */
  static async sendOTP(phone: string, otpCode: string): Promise<boolean> {
    try {
      // 전화번호 정제: 숫자만 추출 (하이픈, 공백 등 제거)
      const cleanPhone = phone.replace(/\D/g, '');

      console.log('OTP 전송 시도:', { phone, cleanPhone, otpCode });

      const formData = new FormData();
      formData.append('api_key', this.API_KEY);
      formData.append('template_code', this.OTP_TEMPLATE_CODE);
      formData.append('variable', otpCode); // 템플릿 변수 (OTP 코드)
      formData.append('callback', this.CALLBACK);
      formData.append('dstaddr', cleanPhone);
      formData.append('next_type', '1'); // 알림톡 실패시 SMS로 발송
      formData.append('send_reserve', '0'); // 즉시 발송

      const response = await axios.post<AlimtalkResponse>(
        this.API_URL,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 10000, // 10초 타임아웃
        }
      );

      console.log('알림톡 전송 응답:', response.data);

      // 응답 코드 100이 정상 접수 (result 또는 code 필드)
      const resultCode = response.data.result || response.data.code;
      if (resultCode === '100' || resultCode === 100) {
        return true;
      } else {
        console.error('알림톡 전송 실패:', response.data);
        return false;
      }
    } catch (error) {
      console.error('알림톡 전송 중 오류:', error);
      return false;
    }
  }

  /**
   * 회원가입 환영 알림톡 전송
   * 템플릿: SJT_123166
   * [회원 가입 완료 안내]
   * #{회사명}님 안녕하세요!
   * 고객님의 회원가입을 환영합니다.
   *
   * @param phone 수신자 전화번호
   * @param name 사용자 이름 (사용안함)
   * @param companyName 회사명
   */
  static async sendWelcome(phone: string, name: string, companyName?: string): Promise<boolean> {
    try {
      // 전화번호 정제: 숫자만 추출
      const cleanPhone = phone.replace(/\D/g, '');

      // 템플릿 변수: #{회사명} 하나만 사용
      const variables = companyName || name;

      console.log('회원가입 환영 알림톡 전송 시도:', { phone, cleanPhone, companyName, variables });

      const formData = new FormData();
      formData.append('api_key', this.API_KEY);
      formData.append('template_code', this.WELCOME_TEMPLATE_CODE);
      formData.append('variable', variables);
      formData.append('callback', this.CALLBACK);
      formData.append('dstaddr', cleanPhone);
      formData.append('next_type', '1'); // 알림톡 실패시 SMS로 발송
      formData.append('send_reserve', '0'); // 즉시 발송

      const response = await axios.post<AlimtalkResponse>(
        this.API_URL,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 10000,
        }
      );

      console.log('회원가입 환영 알림톡 응답:', response.data);

      const resultCode = response.data.result || response.data.code;
      if (resultCode === '100' || resultCode === 100) {
        console.log('회원가입 환영 알림톡 전송 성공');
        return true;
      } else {
        console.error('회원가입 환영 알림톡 전송 실패:', response.data);
        return false;
      }
    } catch (error) {
      console.error('회원가입 환영 알림톡 전송 중 오류:', error);
      return false;
    }
  }

  /**
   * 전자서명 완료 안내 알림톡 전송
   * 템플릿: SJT_125142
   * [전자서명완료안내]
   * #{회사명}님!
   * 전자서명이 완료되었습니다.
   * 아래 링크를 클릭하시면 이미지를 보실 수 있습니다.
   * #{URL}
   *
   * @param phone 수신자 전화번호
   * @param companyName 회사명
   * @param imageUrl 거래명세표 이미지 URL
   * @param mainCompanyName 메인 아이디 회사명 (사용 안함)
   */
  static async sendESignatureStatement(
    phone: string,
    companyName: string,
    imageUrl: string,
    mainCompanyName: string
  ): Promise<boolean> {
    try {
      // 전화번호 정제: 숫자만 추출
      const cleanPhone = phone.replace(/\D/g, '');

      // 템플릿 변수 구성 (| 로 구분)
      // 새 템플릿 변수: #{회사명}|#{URL}
      const variables = [
        companyName,  // #{회사명}
        imageUrl      // #{URL}
      ].join('|');

      console.log('전자서명 완료 안내 알림톡 전송 시도:', {
        phone,
        cleanPhone,
        companyName,
        imageUrl,
        variables
      });

      const formData = new FormData();
      formData.append('api_key', this.API_KEY);
      formData.append('template_code', this.ESIGNATURE_TEMPLATE_CODE);
      formData.append('variable', variables);
      formData.append('callback', this.CALLBACK);
      formData.append('dstaddr', cleanPhone);
      formData.append('next_type', '1'); // 알림톡 실패시 SMS로 발송
      formData.append('send_reserve', '0'); // 즉시 발송

      const response = await axios.post<AlimtalkResponse>(
        this.API_URL,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 10000,
        }
      );

      console.log('전자서명 완료 안내 알림톡 응답:', response.data);

      const resultCode = response.data.result || response.data.code;
      if (resultCode === '100' || resultCode === 100) {
        console.log('전자서명 완료 안내 알림톡 전송 성공');
        return true;
      } else {
        console.error('전자서명 완료 안내 알림톡 전송 실패:', response.data);
        return false;
      }
    } catch (error) {
      console.error('전자서명 완료 안내 알림톡 전송 중 오류:', error);
      return false;
    }
  }

  /**
   * 6자리 랜덤 OTP 코드 생성
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
