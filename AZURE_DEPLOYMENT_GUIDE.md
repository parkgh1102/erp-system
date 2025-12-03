# 🔵 Azure 배포 가이드

## 📋 목차
1. [배포 아키텍처](#배포-아키텍처)
2. [사전 준비](#사전-준비)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [백엔드 배포](#백엔드-배포)
5. [프론트엔드 배포](#프론트엔드-배포)
6. [도메인 및 SSL 설정](#도메인-및-ssl-설정)
7. [비용 예상](#비용-예상)
8. [문제 해결](#문제-해결)

---

## 🏗️ 배포 아키텍처

### 권장 구성
```
┌─────────────────────────────────────────────────┐
│                   사용자                         │
└────────────────┬────────────────────────────────┘
                 │
    ┌────────────┴─────────────┐
    │                          │
┌───▼────────────────┐  ┌──────▼──────────────┐
│ Azure Static Web   │  │ Azure App Service   │
│ Apps (Frontend)    │  │ (Backend API)       │
│ - React + Vite     │  │ - Node.js + Express │
└────────────────────┘  └──────┬──────────────┘
                               │
                    ┌──────────▼────────────┐
                    │ Azure Database for    │
                    │ PostgreSQL            │
                    └───────────────────────┘
```

### 서비스 구성
- **Frontend**: Azure Static Web Apps (무료 티어 사용 가능)
- **Backend**: Azure App Service (Basic B1 이상 권장)
- **Database**: Azure Database for PostgreSQL (Basic 티어)
- **Domain/SSL**: Azure 자동 제공 (무료 SSL 인증서)

---

## 🔧 사전 준비

### 1. Azure 계정 생성
- [Azure Portal](https://portal.azure.com) 접속
- Microsoft 계정으로 로그인 또는 신규 가입
- 신용카드 등록 (프리티어 사용 시 과금 없음)

### 2. Azure CLI 설치
```bash
# Windows (PowerShell 관리자 권한)
winget install Microsoft.AzureCLI

# 또는 MSI 다운로드
# https://aka.ms/installazurecliwindows

# 설치 확인
az --version

# Azure 로그인
az login
```

### 3. 필수 도구 설치
```bash
# Node.js 18 이상 (이미 설치되어 있음)
node --version

# Git (이미 설치되어 있음)
git --version

# Azure Static Web Apps CLI (선택사항)
npm install -g @azure/static-web-apps-cli
```

---

## 🗄️ 데이터베이스 설정

### 옵션 1: Azure Portal에서 생성 (권장)

1. **Azure Portal 접속**
   - https://portal.azure.com
   - "리소스 만들기" 클릭

2. **PostgreSQL 검색**
   - "Azure Database for PostgreSQL"
   - "단일 서버" 또는 "유연한 서버" 선택 (유연한 서버 권장)

3. **기본 정보 입력**
   ```
   구독: (본인 구독 선택)
   리소스 그룹: erp-system-rg (새로 만들기)
   서버 이름: erp-postgres-server
   데이터 원본: 없음
   위치: Korea Central (한국 중부)
   버전: 16 (최신)
   ```

4. **컴퓨팅 + 스토리지**
   ```
   컴퓨팅 계층: 기본
   컴퓨팅 크기: B1ms (1 vCore, 2 GiB RAM)
   스토리지: 32 GiB
   ```

5. **관리자 계정**
   ```
   관리자 사용자 이름: erpadmin
   암호: (강력한 암호 입력)
   암호 확인: (동일하게 입력)
   ```

6. **네트워킹**
   - "공용 액세스 허용" 선택
   - "Azure 서비스 방화벽 규칙 추가" 체크
   - 개발용: "현재 클라이언트 IP 주소 추가" 체크

7. **검토 + 만들기**
   - 설정 확인 후 "만들기" 클릭
   - 배포 완료까지 5-10분 소요

### 옵션 2: Azure CLI로 생성

```bash
# 리소스 그룹 생성
az group create --name erp-system-rg --location koreacentral

# PostgreSQL 서버 생성
az postgres flexible-server create \
  --resource-group erp-system-rg \
  --name erp-postgres-server \
  --location koreacentral \
  --admin-user erpadmin \
  --admin-password "YourStrongPassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32

# 방화벽 규칙 추가 (Azure 서비스 허용)
az postgres flexible-server firewall-rule create \
  --resource-group erp-system-rg \
  --name erp-postgres-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# 데이터베이스 생성
az postgres flexible-server db create \
  --resource-group erp-system-rg \
  --server-name erp-postgres-server \
  --database-name erp_system
```

### 연결 문자열 확인
```
호스트: erp-postgres-server.postgres.database.azure.com
포트: 5432
데이터베이스: erp_system
사용자: erpadmin
암호: YourStrongPassword123!

연결 문자열:
postgresql://erpadmin:YourStrongPassword123!@erp-postgres-server.postgres.database.azure.com:5432/erp_system?ssl=true
```

---

## 🖥️ 백엔드 배포

### 1. 환경 변수 파일 준비

`backend/.env.production` 파일 생성:
```env
NODE_ENV=production
PORT=8080
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_TYPE=postgres
DB_HOST=erp-postgres-server.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=erpadmin
DB_PASSWORD=YourStrongPassword123!
DB_DATABASE=erp_system
DB_SSL=true
CLIENT_URL=https://your-frontend-url.azurestaticapps.net
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. Azure App Service 생성 (Portal)

1. **Azure Portal에서**
   - "리소스 만들기" → "웹앱" 검색
   - "웹앱" 선택 → "만들기"

2. **기본 정보**
   ```
   리소스 그룹: erp-system-rg
   이름: erp-backend-api
   게시: 코드
   런타임 스택: Node 20 LTS
   운영 체제: Linux
   지역: Korea Central
   ```

3. **App Service 플랜**
   ```
   Linux 플랜: (새로 만들기) erp-service-plan
   가격 책정 플랜: Basic B1 (1.75 GB 메모리)
   ```

4. **배포 설정** (건너뛰기 - 나중에 설정)

5. **모니터링**
   - Application Insights: 예 (권장)

6. **검토 + 만들기**

### 3. Azure CLI로 배포

```bash
# 백엔드 디렉토리로 이동
cd backend

# TypeScript 빌드
npm install
npm run build

# Azure App Service 생성 (이미 Portal에서 만들었다면 생략)
az webapp create \
  --resource-group erp-system-rg \
  --plan erp-service-plan \
  --name erp-backend-api \
  --runtime "NODE|20-lts"

# 환경 변수 설정
az webapp config appsettings set \
  --resource-group erp-system-rg \
  --name erp-backend-api \
  --settings \
    NODE_ENV=production \
    JWT_SECRET="your-super-secret-jwt-key" \
    DB_TYPE=postgres \
    DB_HOST="erp-postgres-server.postgres.database.azure.com" \
    DB_PORT=5432 \
    DB_USERNAME=erpadmin \
    DB_PASSWORD="YourStrongPassword123!" \
    DB_DATABASE=erp_system \
    DB_SSL=true \
    CLIENT_URL="https://your-frontend-url.azurestaticapps.net"

# 시작 명령 설정
az webapp config set \
  --resource-group erp-system-rg \
  --name erp-backend-api \
  --startup-file "node dist/index.js"

# 배포 (ZIP 배포)
npm run build
cd ..
powershell Compress-Archive -Path backend\* -DestinationPath backend-deploy.zip -Force
az webapp deployment source config-zip \
  --resource-group erp-system-rg \
  --name erp-backend-api \
  --src backend-deploy.zip

# 배포 확인
az webapp browse --resource-group erp-system-rg --name erp-backend-api
```

### 4. GitHub Actions로 자동 배포 (권장)

`.github/workflows/azure-backend.yml` 파일 생성:
```yaml
name: Deploy Backend to Azure

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'

    - name: Install dependencies
      working-directory: ./backend
      run: npm ci

    - name: Build
      working-directory: ./backend
      run: npm run build

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'erp-backend-api'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ./backend
```

**게시 프로필 다운로드:**
1. Azure Portal → App Service → "게시 프로필 가져오기"
2. GitHub → Settings → Secrets → New repository secret
3. 이름: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. 값: 다운로드한 XML 파일 내용 붙여넣기

---

## 🎨 프론트엔드 배포

### 옵션 1: Azure Static Web Apps (권장)

#### Portal에서 생성

1. **Azure Portal**
   - "리소스 만들기" → "Static Web App"

2. **기본 정보**
   ```
   리소스 그룹: erp-system-rg
   이름: erp-frontend
   플랜 유형: Free
   지역: East Asia
   ```

3. **배포 세부 정보**
   ```
   소스: GitHub
   조직: (본인 GitHub 계정)
   리포지토리: (ERP 리포지토리 선택)
   분기: main
   빌드 기본 설정: Custom
   ```

4. **빌드 세부 정보**
   ```
   앱 위치: /frontend
   API 위치: (비워두기)
   출력 위치: dist
   ```

5. **검토 + 만들기**
   - GitHub에 자동으로 워크플로우 파일 생성됨

#### 환경 변수 설정

Azure Portal → Static Web App → 구성 → 애플리케이션 설정:
```
VITE_API_URL=https://erp-backend-api.azurewebsites.net/api
VITE_APP_NAME=ERP 통합시스템
VITE_APP_VERSION=1.0.0
```

### 옵션 2: Azure App Service로 배포

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 환경 변수 설정 (.env.production)
echo "VITE_API_URL=https://erp-backend-api.azurewebsites.net/api" > .env.production

# 빌드
npm install
npm run build

# App Service 생성
az webapp create \
  --resource-group erp-system-rg \
  --plan erp-service-plan \
  --name erp-frontend-app \
  --runtime "NODE|20-lts"

# 정적 파일 서빙을 위한 설정
az webapp config set \
  --resource-group erp-system-rg \
  --name erp-frontend-app \
  --startup-file "npx serve -s dist -l $PORT"

# 배포
cd ..
powershell Compress-Archive -Path frontend\dist\* -DestinationPath frontend-deploy.zip -Force
az webapp deployment source config-zip \
  --resource-group erp-system-rg \
  --name erp-frontend-app \
  --src frontend-deploy.zip
```

### GitHub Actions로 자동 배포

Static Web App을 생성하면 자동으로 `.github/workflows/azure-static-web-apps-*.yml` 파일이 생성됩니다.

수동으로 생성할 경우 `.github/workflows/azure-frontend.yml`:
```yaml
name: Deploy Frontend to Azure Static Web Apps

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
      with:
        submodules: true

    - name: Build And Deploy
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "/frontend"
        api_location: ""
        output_location: "dist"
```

---

## 🌐 도메인 및 SSL 설정

### 커스텀 도메인 연결

#### Backend (App Service)

1. **Azure Portal**
   - App Service → 사용자 지정 도메인
   - "사용자 지정 도메인 추가"

2. **도메인 설정**
   ```
   도메인 이름: api.yourdomain.com
   호스트 이름 레코드 유형: CNAME
   ```

3. **DNS 설정** (도메인 등록 업체에서)
   ```
   유형: CNAME
   이름: api
   값: erp-backend-api.azurewebsites.net
   TTL: 3600
   ```

4. **SSL 인증서**
   - Azure에서 무료 관리형 인증서 자동 발급
   - "바인딩 추가" → "관리형 인증서"

#### Frontend (Static Web Apps)

1. **Azure Portal**
   - Static Web App → 사용자 지정 도메인
   - "추가"

2. **도메인 설정**
   ```
   도메인 이름: www.yourdomain.com 또는 yourdomain.com
   ```

3. **DNS 설정**
   ```
   유형: CNAME
   이름: www (또는 @)
   값: [Static Web App URL]
   ```

4. **SSL**
   - 자동으로 무료 SSL 인증서 발급

---

## 💰 비용 예상

### 월간 예상 비용 (원화, 2024년 12월 기준)

#### 프리티어 (첫 12개월)
```
✅ Azure Database for PostgreSQL (Flexible)
   - Burstable B1ms: ₩15,000/월

✅ Azure App Service (Basic B1)
   - 1 Core, 1.75GB RAM: ₩20,000/월

✅ Azure Static Web Apps
   - Free 티어: ₩0/월
   - 대역폭 100GB 포함

✅ Application Insights
   - 월 5GB까지 무료: ₩0/월

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 예상 비용: 약 ₩35,000/월 (~$27)
```

#### 일반 사용 (프리티어 이후)
```
⚠️ Azure Database for PostgreSQL
   - Burstable B1ms: ₩15,000/월
   - 스토리지 32GB: ₩5,000/월

⚠️ Azure App Service (Basic B1)
   - ₩20,000/월

✅ Azure Static Web Apps
   - Free 티어: ₩0/월

⚠️ Application Insights
   - 5GB 초과 시: GB당 ₩3,500

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 예상 비용: 약 ₩40,000-50,000/월 (~$30-40)
```

### 비용 절감 팁

1. **개발/스테이징 환경**
   - 업무 시간 외 자동 중지 설정
   - Azure Automation으로 스케줄링

2. **예약 인스턴스**
   - 1년 또는 3년 예약 시 최대 50% 할인

3. **Azure 크레딧**
   - Visual Studio 구독자: 월 ₩65,000 크레딧
   - 학생: Azure for Students (₩130,000 크레딧)

---

## 🔍 배포 확인 및 테스트

### 1. Backend API 테스트

```bash
# 헬스 체크
curl https://erp-backend-api.azurewebsites.net/health

# API 버전 확인
curl https://erp-backend-api.azurewebsites.net/api

# 로그인 테스트
curl -X POST https://erp-backend-api.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Frontend 접속
```
https://erp-frontend.azurestaticapps.net
```

### 3. 로그 확인

```bash
# Backend 로그 스트리밍
az webapp log tail \
  --resource-group erp-system-rg \
  --name erp-backend-api

# 또는 Azure Portal에서
# App Service → 로그 스트림
```

---

## 🛠️ 문제 해결

### Backend가 시작되지 않을 때

1. **로그 확인**
```bash
az webapp log tail --resource-group erp-system-rg --name erp-backend-api
```

2. **일반적인 원인**
   - 시작 명령이 잘못됨 → `node dist/index.js` 확인
   - 환경 변수 누락 → DB 연결 정보 확인
   - 빌드 실패 → `npm run build` 로컬에서 테스트

3. **진단 실행**
   - Azure Portal → App Service → 문제 진단 및 해결

### Database 연결 실패

1. **방화벽 규칙 확인**
```bash
# App Service의 아웃바운드 IP 확인
az webapp show \
  --resource-group erp-system-rg \
  --name erp-backend-api \
  --query outboundIpAddresses \
  --output tsv

# PostgreSQL 방화벽에 추가
az postgres flexible-server firewall-rule create \
  --resource-group erp-system-rg \
  --name erp-postgres-server \
  --rule-name AllowAppService \
  --start-ip-address <IP> \
  --end-ip-address <IP>
```

2. **SSL 연결 확인**
   - `DB_SSL=true` 환경 변수 설정
   - 연결 문자열에 `?ssl=true` 추가

### Frontend에서 API 호출 실패

1. **CORS 설정 확인**
   - Backend `src/index.ts`에서 `CLIENT_URL` 확인
   - Frontend URL이 정확한지 확인

2. **환경 변수 확인**
```bash
# Frontend 환경 변수
az staticwebapp appsettings list \
  --name erp-frontend \
  --resource-group erp-system-rg
```

### 성능 문제

1. **스케일 업**
```bash
# App Service 플랜 업그레이드
az appservice plan update \
  --name erp-service-plan \
  --resource-group erp-system-rg \
  --sku S1
```

2. **CDN 추가**
   - Azure CDN을 Static Web App 앞에 배치
   - 전 세계 캐싱으로 성능 향상

---

## 📚 추가 리소스

### 공식 문서
- [Azure App Service 문서](https://docs.microsoft.com/azure/app-service/)
- [Azure Static Web Apps 문서](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Database for PostgreSQL](https://docs.microsoft.com/azure/postgresql/)

### 유용한 CLI 명령어

```bash
# 모든 리소스 확인
az resource list --resource-group erp-system-rg --output table

# 리소스 그룹 삭제 (모든 리소스 삭제)
az group delete --name erp-system-rg --yes --no-wait

# App Service 재시작
az webapp restart --name erp-backend-api --resource-group erp-system-rg

# 환경 변수 확인
az webapp config appsettings list \
  --name erp-backend-api \
  --resource-group erp-system-rg
```

---

## ✅ 배포 체크리스트

### 배포 전
- [ ] Azure 계정 생성 및 로그인
- [ ] Azure CLI 설치
- [ ] PostgreSQL 데이터베이스 생성
- [ ] 환경 변수 파일 준비 (.env.production)
- [ ] Cloudinary 계정 설정 (이미지 업로드용)

### Backend 배포
- [ ] App Service 생성
- [ ] 환경 변수 설정
- [ ] 코드 빌드 및 배포
- [ ] API 엔드포인트 테스트
- [ ] 로그 확인

### Frontend 배포
- [ ] Static Web App 또는 App Service 생성
- [ ] 환경 변수 설정 (VITE_API_URL)
- [ ] 빌드 및 배포
- [ ] 웹사이트 접속 테스트
- [ ] API 연동 확인

### 마무리
- [ ] 커스텀 도메인 연결 (선택)
- [ ] SSL 인증서 확인
- [ ] 모니터링 설정
- [ ] 백업 정책 수립
- [ ] 비용 알림 설정

---

## 🎉 완료!

축하합니다! ERP 시스템이 Azure에 성공적으로 배포되었습니다.

**접속 URL:**
- Frontend: `https://erp-frontend.azurestaticapps.net`
- Backend API: `https://erp-backend-api.azurewebsites.net`

문제가 있다면 [문제 해결](#문제-해결) 섹션을 참고하세요.
