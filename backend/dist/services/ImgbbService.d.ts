export declare class ImgbbService {
    private static API_URL;
    /**
     * ImgBB에 이미지 업로드
     * @param imageBuffer 이미지 버퍼 (Buffer 또는 Base64 문자열)
     * @param fileName 파일명 (선택)
     * @returns 업로드된 이미지 URL
     */
    static uploadImage(imageBuffer: Buffer | string, fileName?: string): Promise<string | null>;
    /**
     * Base64 이미지 데이터 업로드 (data:image/... 형식)
     * @param base64Data Base64 인코딩된 이미지 데이터
     * @param fileName 파일명 (선택)
     * @returns 업로드된 이미지 URL
     */
    static uploadBase64(base64Data: string, fileName?: string): Promise<string | null>;
}
//# sourceMappingURL=ImgbbService.d.ts.map