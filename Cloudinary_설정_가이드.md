# Cloudinary 설정 가이드

## 📋 Cloudinary란?

이미지 및 비디오 호스팅 서비스로, 무료 플랜에서도 다음을 제공합니다:
- 25GB 저장 공간
- 25GB 월간 대역폭
- 글로벌 CDN
- 자동 이미지 최적화

---

## 🚀 1단계: Cloudinary 가입

### 1. 가입 페이지 접속

https://cloudinary.com/users/register_free

### 2. 계정 정보 입력

```
이름: (본인 이름)
이메일: (본인 이메일)
비밀번호: (강력한 비밀번호)
Cloud Name: (자동 생성되지만 변경 가능)
```

**중요:** Cloud Name은 나중에 변경할 수 없으니 신중하게 선택하세요!

### 3. 이메일 인증

등록한 이메일로 발송된 인증 링크를 클릭하여 계정을 활성화합니다.

---

## 🔑 2단계: API 정보 확인

### 1. Dashboard 접속

로그인 후 자동으로 Dashboard로 이동합니다.

### 2. API 정보 확인

Dashboard 상단에 다음 정보가 표시됩니다:

```
Cloud Name: your-cloud-name
API Key: 123456789012345
API Secret: AbCdEfGhIjKlMnOpQrStUvWx_yz (숨겨짐)
```

### 3. API Secret 확인

"API Secret" 옆의 눈 모양 아이콘을 클릭하여 전체 Secret을 확인합니다.

**⚠️ 주의:** API Secret은 절대 공개하지 마세요!

---

## 🔧 3단계: Azure에 환경 변수 설정

### 방법 1: Azure CLI (권장)

아래 명령어에서 `your-cloud-name`, `your-api-key`, `your-api-secret`을
실제 Cloudinary 정보로 교체하여 실행하세요:

```bash
az webapp config appsettings set \
  --name erp-backend-app \
  --resource-group erp-system-rg \
  --settings \
    CLOUDINARY_CLOUD_NAME="your-cloud-name" \
    CLOUDINARY_API_KEY="your-api-key" \
    CLOUDINARY_API_SECRET="your-api-secret"
```

**예시:**
```bash
az webapp config appsettings set \
  --name erp-backend-app \
  --resource-group erp-system-rg \
  --settings \
    CLOUDINARY_CLOUD_NAME="myerp-images" \
    CLOUDINARY_API_KEY="123456789012345" \
    CLOUDINARY_API_SECRET="AbCdEfGhIjKlMnOpQrStUvWx_yz"
```

### 방법 2: Azure Portal

1. [Azure Portal](https://portal.azure.com) 접속
2. **App Services** → **erp-backend-app** 선택
3. 좌측 메뉴에서 **구성** 클릭
4. **애플리케이션 설정** 탭 선택
5. **+ 새 애플리케이션 설정** 클릭하여 다음 3개 추가:

```
이름: CLOUDINARY_CLOUD_NAME
값: your-cloud-name

이름: CLOUDINARY_API_KEY
값: your-api-key

이름: CLOUDINARY_API_SECRET
값: your-api-secret
```

6. **저장** 클릭
7. App Service 자동 재시작 대기 (1-2분)

---

## ✅ 4단계: 설정 확인

### 1. 환경 변수 확인

```bash
az webapp config appsettings list \
  --name erp-backend-app \
  --resource-group erp-system-rg \
  --query "[?name=='CLOUDINARY_CLOUD_NAME' || name=='CLOUDINARY_API_KEY' || name=='CLOUDINARY_API_SECRET'].{name:name, value:value}" \
  -o table
```

### 2. 앱 재시작 (필요 시)

```bash
az webapp restart \
  --name erp-backend-app \
  --resource-group erp-system-rg
```

### 3. 테스트 업로드

ERP 시스템에서 거래명세표 이미지 업로드를 시도해보세요!

---

## 🎯 Cloudinary Dashboard 활용

### 이미지 관리

1. **Media Library**
   - 업로드된 모든 이미지 확인
   - 폴더별 정리
   - 이미지 검색 및 필터링

2. **Transformations**
   - 이미지 크기 조정
   - 포맷 변환 (JPG, PNG, WebP)
   - 품질 최적화

3. **Analytics**
   - 저장 공간 사용량
   - 대역폭 사용량
   - API 호출 통계

---

## 📊 사용량 모니터링

### 무료 플랜 제한

- **저장 공간:** 25GB
- **월간 대역폭:** 25GB
- **월간 변환:** 25,000회

### 사용량 확인

Dashboard → Usage → 현재 사용량 확인

**초과 시:**
- 자동으로 유료 플랜으로 전환되지 않음
- 업로드 불가 (서비스 차단)
- 필요 시 유료 플랜으로 업그레이드

---

## 🔒 보안 설정 (권장)

### 1. Upload Presets

Dashboard → Settings → Upload → Upload Presets

업로드 시 자동 변환 설정:
- 이미지 크기 제한
- 포맷 변환
- 품질 조정

### 2. Access Control

Dashboard → Settings → Security

보안 설정:
- Signed URLs (서명된 URL만 허용)
- Allowed origins (허용된 도메인)
- API rate limiting

---

## 🛠️ 문제 해결

### "Invalid API credentials" 오류

**원인:** API Key 또는 Secret이 잘못됨

**해결:**
1. Cloudinary Dashboard에서 정보 재확인
2. 공백이나 특수문자 포함 여부 확인
3. Azure 환경 변수 재설정

### "Upload failed" 오류

**원인:**
- 파일 크기 초과 (10MB 제한)
- 지원하지 않는 파일 형식
- 네트워크 오류

**해결:**
1. 파일 크기 확인 (10MB 이하)
2. JPG/PNG 형식 확인
3. 네트워크 상태 확인

### "Quota exceeded" 오류

**원인:** 무료 플랜 제한 초과

**해결:**
1. Dashboard에서 사용량 확인
2. 불필요한 이미지 삭제
3. 유료 플랜 업그레이드 고려

---

## 💡 최적화 팁

### 1. 이미지 압축

업로드 전 이미지 압축으로 용량 절약:
- JPG 품질: 80-85%
- PNG → JPG 변환 (투명도 불필요 시)

### 2. 폴더 구조

체계적인 폴더 구조로 관리:
```
/statements/2025/12/
/products/
/profiles/
```

### 3. 자동 정리

오래된 이미지 자동 삭제 설정:
- Dashboard → Settings → Upload → Auto-delete

---

## 📞 추가 지원

### Cloudinary 문서
- [공식 문서](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [API Reference](https://cloudinary.com/documentation/image_upload_api_reference)

### 커뮤니티
- [Cloudinary Support](https://support.cloudinary.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/cloudinary)

---

## ✅ 완료 체크리스트

- [ ] Cloudinary 계정 가입
- [ ] 이메일 인증 완료
- [ ] API 정보 확인 (Cloud Name, API Key, Secret)
- [ ] Azure에 환경 변수 설정
- [ ] App Service 재시작
- [ ] 테스트 이미지 업로드 성공

완료!
