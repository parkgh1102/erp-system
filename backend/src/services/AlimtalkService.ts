import axios from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';

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
  // 기본값을 HTTPS로 지정 (평문 HTTP는 OTP/전화번호가 전송 중 노출됨).
  // 벤더(alimtalkme.com)가 동일 경로를 유효 인증서로 HTTPS 제공함을 확인.
  private static API_URL = process.env.ALIMTALK_API_URL || 'https://www.alimtalkme.com/API/alimtalk_api';
  private static API_KEY = process.env.ALIMTALK_API_KEY!;
  private static OTP_TEMPLATE_CODE = 'SJT_123168'; // OTP 템플릿
  private static WELCOME_TEMPLATE_CODE = 'SJT_123166'; // 회원가입 환영 템플릿
  private static ESIGNATURE_TEMPLATE_CODE = 'SJT_125177'; // 전자서명 완료 안내 템플릿
  private static RECEIVABLE_TEMPLATE_CODE = 'SJT_256790'; // 미수금 안내 템플릿
  private static SENDER_KEY = process.env.ALIMTALK_SENDER_KEY!;
  private static CALLBACK = process.env.ALIMTALK_CALLBACK!; // 발신번호

  /**
   * OTP 알림톡 전송
   * @param phone 수신자 전화번호 (01012345678 형식)
   * @param otpCode 6자리 OTP 코드
   */
  static async sendOTP(phone: string, otpCode: string): Promise<boolean> {
    try {
      // 전화번호 정제: 숫자만 추출 (하이픈, 공백 등 제거)
      const cleanPhone = phone.replace(/\D/g, '');

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

      // 응답 코드 100이 정상 접수 (result 또는 code 필드)
      const resultCode = response.data.result || response.data.code;
      if (resultCode === '100' || resultCode === 100) {
        return true;
      } else {
        console.error('OTP 알림톡 전송 실패 - 코드:', resultCode);
        return false;
      }
    } catch (error: any) {
      console.error('OTP 알림톡 전송 오류:', error.message);
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

      const resultCode = response.data.result || response.data.code;
      if (resultCode === '100' || resultCode === 100) {
        return true;
      } else {
        console.error('회원가입 환영 알림톡 전송 실패 - 코드:', resultCode);
        return false;
      }
    } catch (error: any) {
      console.error('회원가입 환영 알림톡 오류:', error.message);
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

      const resultCode = response.data.result || response.data.code;
      if (resultCode === '100' || resultCode === 100) {
        return true;
      } else {
        console.error('전자서명 완료 알림톡 전송 실패 - 코드:', resultCode);
        return false;
      }
    } catch (error: any) {
      console.error('전자서명 완료 알림톡 오류:', error.message);
      return false;
    }
  }

  /**
   * 미수금 안내 알림톡 전송
   * 템플릿: SJT_256790
   * 안녕하세요! #{업체명}님
   * 현재 미수금 안내입니다.
   * ▷미수금액 : #{미수금액}원
   * ▶연체일자 : #{연체일수}일
   * ▷최근거래일 : #{최근거래일}
   * 확인 부탁드립니다
   * #{날짜}
   * #{메모}
   *
   * @param phone            수신자(거래처) 전화번호
   * @param customerName     거래처명 → #{업체명}
   * @param receivableAmount 미수금액(숫자) → #{미수금액} (천단위 구분 후 전송)
   * @param overdueDays      연체일수 → #{연체일수}
   * @param lastTradeDate    최근거래일 'YYYY-MM-DD' → #{최근거래일}
   * @param senderCompany    발신 사업체명 → #{메모}
   */
  static async sendReceivableNotice(
    phone: string,
    customerName: string,
    receivableAmount: number,
    overdueDays: number,
    lastTradeDate: string,
    senderCompany: string
  ): Promise<{ ok: boolean; code?: string | number; message?: string }> {
    try {
      const cleanPhone = phone.replace(/\D/g, '');

      // 템플릿 변수는 본문에 나타나는 순서대로 '|' 구분 (기존 템플릿들과 동일한 규약)
      const variables = [
        customerName,                                 // #{업체명}
        Math.round(receivableAmount).toLocaleString('ko-KR'), // #{미수금액}
        String(overdueDays),                          // #{연체일수}
        lastTradeDate || '-',                         // #{최근거래일}
        new Date().toLocaleDateString('sv-SE'),       // #{날짜} 전송일자 YYYY-MM-DD
        senderCompany,                                // #{메모}
      ].join('|');

      const formData = new FormData();
      formData.append('api_key', this.API_KEY);
      formData.append('template_code', this.RECEIVABLE_TEMPLATE_CODE);
      formData.append('variable', variables);
      formData.append('callback', this.CALLBACK);
      formData.append('dstaddr', cleanPhone);
      // 실패 시 SMS 대체발송 (기존 OTP/전자서명 템플릿과 동일하게 '1')
      formData.append('next_type', '1');
      formData.append('send_reserve', '0');

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

      const resultCode = response.data.result || response.data.code;
      if (resultCode === '100' || resultCode === 100) {
        return { ok: true, code: resultCode };
      }
      // 벤더가 준 코드/메시지를 그대로 올려서 사유를 알 수 있게 한다
      console.error('미수금 안내 알림톡 전송 실패 - 응답:', JSON.stringify(response.data));
      return { ok: false, code: resultCode, message: response.data.message };
    } catch (error: any) {
      // 네트워크/HTTP 오류는 벤더 응답 본문이 있으면 함께 남긴다
      const vendorBody = error.response?.data;
      console.error('미수금 안내 알림톡 오류:', error.message, vendorBody ? JSON.stringify(vendorBody) : '');
      return { ok: false, message: vendorBody?.message || error.message };
    }
  }

  /**
   * 6자리 랜덤 OTP 코드 생성 (암호학적으로 안전한 난수 사용)
   */
  static generateOTP(): string {
    // 100000 ~ 999999
    return crypto.randomInt(100000, 1000000).toString();
  }
}
