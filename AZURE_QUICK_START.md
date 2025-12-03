# ⚡ Azure 빠른 배포 가이드 (10분 완성)

최소한의 단계로 Azure에 ERP 시스템을 배포하는 가이드입니다.

## 🚀 1단계: Azure CLI 설치 및 로그인 (2분)

```bash
# Azure CLI 설치 (Windows)
winget install Microsoft.AzureCLI

# 로그인
az login

# 구독 확인
az account show
```

## 🗄️ 2단계: 데이터베이스 생성 (3분)

```bash
# 리소스 그룹 생성
az group create --name erp-system-rg --location koreacentral

# PostgreSQL 서버 생성
az postgres flexible-server create \
  --resource-group erp-system-rg \
  --name erp-postgres-$(date +%s) \
  --location koreacentral \
  --admin-user erpadmin \
  --admin-password "MyStrongPass123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32 \
  --public-access 0.0.0.0

# 데이터베이스 생성
az postgres flexible-server db create \
  --resource-group erp-system-rg \
  --server-name erp-postgres-$(date +%s) \
  --database-name erp_system
```

**💡 생성된 정보 메모:**
- 서버 이름: `erp-postgres-xxxxx.postgres.database.azure.com`
- 사용자: `erpadmin`
- 암호: `MyStrongPass123!`

## 🖥️ 3단계: 백엔드 배포 (3분)

```bash
# 프로젝트 디렉토리로 이동
cd C:\Users\Administrator\Desktop\신erp1203\backend

# 빌드
npm install
npm run build

# App Service 플랜 생성
az appservice plan create \
  --name erp-plan \
  --resource-group erp-system-rg \
  --sku B1 \
  --is-linux

# App Service 생성
az webapp create \
  --resource-group erp-system-rg \
  --plan erp-plan \
  --name erp-backend-$(date +%s) \
  --runtime "NODE|20-lts"

# 환경 변수 설정 (서버 이름을 위에서 메모한 값으로 변경)
az webapp config appsettings set \
  --resource-group erp-system-rg \
  --name erp-backend-$(date +%s) \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    JWT_SECRET="change-this-super-secret-key-123" \
    DB_TYPE=postgres \
    DB_HOST="erp-postgres-xxxxx.postgres.database.azure.com" \
    DB_PORT=5432 \
    DB_USERNAME=erpadmin \
    DB_PASSWORD="MyStrongPass123!" \
    DB_DATABASE=erp_system \
    DB_SSL=true

# 시작 명령 설정
az webapp config set \
  --resource-group erp-system-rg \
  --name erp-backend-$(date +%s) \
  --startup-file "node dist/index.js"

# ZIP 배포
powershell Compress-Archive -Path .\* -DestinationPath ..\backend-deploy.zip -Force
cd ..
az webapp deployment source config-zip \
  --resource-group erp-system-rg \
  --name erp-backend-$(date +%s) \
  --src backend-deploy.zip
```

**✅ Backend URL:** `https://erp-backend-xxxxx.azurewebsites.net`

## 🎨 4단계: 프론트엔드 배포 (2분)

### 옵션 A: Azure Portal (추천, 가장 쉬움)

1. **Azure Portal 접속**: https://portal.azure.com
2. **"리소스 만들기"** 클릭
3. **"Static Web App"** 검색 및 선택
4. **기본 정보 입력:**
   - 리소스 그룹: `erp-system-rg`
   - 이름: `erp-frontend`
   - 플랜 유형: `Free`
   - 지역: `East Asia`
5. **배포 세부 정보:**
   - 소스: `GitHub` (GitHub 계정 연결)
   - 리포지토리 선택
   - 분기: `main`
   - 빌드 기본 설정: `Custom`
   - 앱 위치: `/frontend`
   - 출력 위치: `dist`
6. **만들기** 클릭
7. **구성** → **애플리케이션 설정** → 환경 변수 추가:
   ```
   VITE_API_URL=https://erp-backend-xxxxx.azurewebsites.net/api
   ```

### 옵션 B: CLI로 배포

```bash
cd frontend

# .env.production 파일 생성
echo "VITE_API_URL=https://erp-backend-xxxxx.azurewebsites.net/api" > .env.production

# 빌드
npm install
npm run build

# Static Web App 생성은 Portal에서 권장
```

**✅ Frontend URL:** `https://erp-frontend.azurestaticapps.net`

## ✅ 배포 완료!

### 접속 URL
- **프론트엔드**: `https://erp-frontend.azurestaticapps.net`
- **백엔드 API**: `https://erp-backend-xxxxx.azurewebsites.net`

### 테스트

1. 프론트엔드 URL 접속
2. 회원가입 시도
3. 로그인 테스트
4. 대시보드 확인

### 문제가 있다면?

```bash
# Backend 로그 확인
az webapp log tail \
  --resource-group erp-system-rg \
  --name erp-backend-xxxxx

# Backend 재시작
az webapp restart \
  --resource-group erp-system-rg \
  --name erp-backend-xxxxx
```

## 💰 예상 비용

- **Free 티어 (12개월)**: 약 ₩35,000/월
- **일반 사용**: 약 ₩40,000-50,000/월

## 📚 더 자세한 가이드

- [전체 배포 가이드](./AZURE_DEPLOYMENT_GUIDE.md) - 상세한 설명과 옵션
- [문제 해결](./AZURE_DEPLOYMENT_GUIDE.md#문제-해결)
- [도메인 연결](./AZURE_DEPLOYMENT_GUIDE.md#도메인-및-ssl-설정)

---

## 🔥 Pro Tips

1. **자동 배포 설정**: GitHub Actions로 푸시할 때마다 자동 배포
2. **커스텀 도메인**: `www.yourdomain.com` 연결 가능 (무료 SSL 포함)
3. **모니터링**: Application Insights로 성능 추적
4. **스케일링**: 트래픽 증가 시 자동 스케일링 설정
5. **비용 절감**: 개발 환경은 업무 시간만 실행되도록 스케줄 설정
