export declare class CloudinaryService {
    /**
     * Cloudinary에 이미지 업로드
     * @param imageBuffer 이미지 버퍼
     * @param fileName 파일명 (선택)
     * @returns 업로드된 이미지 URL
     */
    static uploadImage(imageBuffer: Buffer, fileName?: string): Promise<string | null>;
    /**
     * 이미지 삭제
     * @param publicId 이미지 public_id
     */
    static deleteImage(publicId: string): Promise<boolean>;
}
//# sourceMappingURL=CloudinaryService.d.ts.map