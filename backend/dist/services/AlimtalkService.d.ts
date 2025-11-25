export declare class AlimtalkService {
    private static API_URL;
    private static API_KEY;
    private static OTP_TEMPLATE_CODE;
    private static WELCOME_TEMPLATE_CODE;
    private static ESIGNATURE_TEMPLATE_CODE;
    private static SENDER_KEY;
    private static CALLBACK;
    /**
     * OTP 알림톡 전송
     * @param phone 수신자 전화번호 (01012345678 형식)
     * @param otpCode 6자리 OTP 코드
     */
    static sendOTP(phone: string, otpCode: string): Promise<boolean>;
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
    static sendWelcome(phone: string, name: string, companyName?: string): Promise<boolean>;
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
    static sendESignatureStatement(phone: string, companyName: string, imageUrl: string, mainCompanyName: string): Promise<boolean>;
    /**
     * 6자리 랜덤 OTP 코드 생성
     */
    static generateOTP(): string;
}
//# sourceMappingURL=AlimtalkService.d.ts.map