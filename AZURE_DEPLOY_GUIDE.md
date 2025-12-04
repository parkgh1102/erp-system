# Azure 배포 가이드 - ERP 통합시스템

이 가이드는 Azure에 ERP 통합시스템(프론트엔드 + 백엔드)을 배포하는 과정을 단계별로 설명합니다.

## 📋 목차

1. [사전 준비](#1-사전-준비)
2. [Azure 리소스 생성](#2-azure-리소스-생성)
3. [PostgreSQL 데이터베이스 설정](#3-postgresql-데이터베이스-설정)
4. [백엔드 배포](#4-백엔드-배포)
5. [프론트엔드 배포](#5-프론트엔드-배포)
6. [가비아 도메인 연결](#6-가비아-도메인-연결)
7. [SSL 인증서 설정](#7-ssl-인증서-설정)
8. [환경 변수 설정](#8-환경-변수-설정)
9. [배포 후 확인](#9-배포-후-확인)
10. [문제 해결](#10-문제-해결)

---

## 1. 사전 준비

### 1.1 필요한 도구 설치

#### Azure CLI 설치
```bash
# Windows (PowerShell 관리자 권한)
winget install -e --id Microsoft.AzureCLI

# 설치 확인
az --version
```

#### Git 설치 확인
```bash
git --version
```

### 1.2 Azure 로그인
```bash
# Azure CLI로 로그인
az login

# 구독 목록 확인
az account list --output table

# 사용할 구독 선택
az account set --subscription "구독이름 또는 구독ID"
```

### 1.3 프로젝트 빌드 테스트
```bash
# 백엔드 빌드 테스트
cd backend
npm install
npm run build

# 프론트엔드 빌드 테스트
cd ../frontend
npm install
npm run build
```

---

## 2. Azure 리소스 생성

### 2.1 리소스 그룹 생성

Azure Portal에서:
1. **Azure Portal** (https://portal.azure.com) 접속
2. 좌측 메뉴에서 **"리소스 그룹"** 클릭
3. **"+ 만들기"** 클릭
4. 설정:
   - **구독**: 본인의 구독 선택
   - **리소스 그룹 이름**: `erp-system-rg` (원하는 이름)
   - **지역**: `Korea Central` (한국 중부) 권장
5. **"검토 + 만들기"** → **"만들기"** 클릭

또는 CLI로:
```bash
# 리소스 그룹 생성
az group create \
  --name erp-system-rg \
  --location koreacentral
```

---

## 3. PostgreSQL 데이터베이스 설정

### 3.1 Azure Database for PostgreSQL 만들기

#### Azure Portal에서:
1. **Azure Portal** → **"리소스 만들기"**
2. **"Azure Database for PostgreSQL"** 검색 → **"유연한 서버"** 선택
3. **"만들기"** 클릭
4. 기본 설정:
   - **구독**: 본인의 구독
   - **리소스 그룹**: `erp-system-rg`
   - **서버 이름**: `erp-postgres-server` (고유한 이름)
   - **지역**: `Korea Central`
   - **PostgreSQL 버전**: `16` 또는 최신 버전
   - **워크로드 유형**: `개발` 또는 `프로덕션` (필요에 따라)
5. 컴퓨팅 + 스토리지:
   - 개발용: **Burstable, B1ms** (저렴)
   - 프로덕션: **범용, D2s_v3** 이상
6. 관리자 계정:
   - **관리자 사용자 이름**: `erpadmin` (원하는 이름)
   - **암호**: 강력한 암호 입력 (기록해두세요!)
7. **네트워킹** 탭:
   - **"Azure 서비스 및 리소스가 이 서버에 액세스할 수 있도록 허용"** 체크
   - **방화벽 규칙 추가**: 개발 시 본인 IP 추가
8. **"검토 + 만들기"** → **"만들기"**

#### CLI로 (선택사항):
```bash
# PostgreSQL 서버 생성
az postgres flexible-server create \
  --resource-group erp-system-rg \
  --name erp-postgres-server \
  --location koreacentral \
  --admin-user erpadmin \
  --admin-password 'Your-Strong-Password-123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32 \
  --public-access 0.0.0.0

# 데이터베이스 생성
az postgres flexible-server db create \
  --resource-group erp-system-rg \
  --server-name erp-postgres-server \
  --database-name erp_system
```

### 3.2 데이터베이스 연결 정보 기록

생성 완료 후 다음 정보를 기록하세요:
- **호스트**: `erp-postgres-server.postgres.database.azure.com`
- **포트**: `5432`
- **데이터베이스**: `erp_system`
- **사용자**: `erpadmin`
- **암호**: 설정한 암호

### 3.3 방화벽 규칙 설정

1. PostgreSQL 서버 → **"네트워킹"** → **"방화벽 규칙"**
2. **"Azure 내의 모든 Azure 서비스에서 이 서버로의 퍼블릭 액세스 허용"** 활성화
3. 로컬 개발을 위해 본인 IP 추가 (선택사항)

---

## 4. 백엔드 배포

### 4.1 App Service 만들기

#### Azure Portal에서:
1. **"리소스 만들기"** → **"Web App"** 검색
2. **"만들기"** 클릭
3. 기본 설정:
   - **구독**: 본인의 구독
   - **리소스 그룹**: `erp-system-rg`
   - **이름**: `erp-backend-app` (고유한 이름, URL에 사용됨)
   - **게시**: `코드`
   - **런타임 스택**: `Node 18 LTS` 또는 `Node 20 LTS`
   - **운영 체제**: `Linux` (권장) 또는 `Windows`
   - **지역**: `Korea Central`
4. App Service 플랜:
   - 개발/테스트: **B1** (기본)
   - 프로덕션: **P1V2** 이상
5. **"검토 + 만들기"** → **"만들기"**

#### CLI로 (선택사항):
```bash
# App Service 플랜 생성
az appservice plan create \
  --name erp-backend-plan \
  --resource-group erp-system-rg \
  --location koreacentral \
  --is-linux \
  --sku B1

# Web App 생성
az webapp create \
  --name erp-backend-app \
  --resource-group erp-system-rg \
  --plan erp-backend-plan \
  --runtime "NODE|18-lts"
```

### 4.2 환경 변수 설정

1. **App Service** → **"구성"** → **"애플리케이션 설정"**
2. **"+ 새 애플리케이션 설정"** 클릭하여 다음 변수들 추가:

```plaintext
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://erp-frontend-app.azurewebsites.net

# 데이터베이스 설정 (위에서 기록한 정보 사용)
DB_TYPE=postgres
DB_HOST=erp-postgres-server.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=erpadmin
DB_PASSWORD=Your-Strong-Password-123!
DB_DATABASE=erp_system
DB_SSL=true

# JWT 시크릿 (강력한 랜덤 문자열 생성)
JWT_SECRET=[64자 이상 랜덤 hex 문자열]
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=[JWT_SECRET과 다른 64자 이상 랜덤 문자열]
JWT_REFRESH_EXPIRES_IN=7d

# 세션 시크릿
SESSION_SECRET=[JWT와 다른 64자 이상 랜덤 문자열]

# 보안 설정
BCRYPT_ROUNDS=12
FORCE_HTTPS=true
DISABLE_CSRF=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# 로깅
LOG_LEVEL=info
```

**시크릿 생성 방법** (로컬 터미널에서):
```bash
# JWT_SECRET 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT_REFRESH_SECRET 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# SESSION_SECRET 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

3. **"저장"** 클릭

### 4.3 배포 방법 선택

#### 옵션 A: GitHub Actions로 자동 배포 (권장)

1. GitHub에 프로젝트 push:
```bash
# 루트 디렉토리에서
git init
git add .
git commit -m "Initial commit for Azure deployment"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

2. Azure Portal:
   - **App Service** → **"배포 센터"**
   - **소스**: `GitHub` 선택
   - GitHub 계정 연결 및 리포지토리 선택
   - **분기**: `main`
   - **빌드 공급자**: `GitHub Actions`
   - **런타임 스택**: `Node`
   - **"저장"** 클릭

3. GitHub Actions 워크플로우 파일 생성 (`.github/workflows/azure-backend.yml`):
```yaml
name: Deploy Backend to Azure

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        cd backend
        npm ci

    - name: Build
      run: |
        cd backend
        npm run build

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'erp-backend-app'
        publish-profile: ${{ secrets.AZURE_BACKEND_PUBLISH_PROFILE }}
        package: './backend'
```

4. Publish Profile 다운로드:
   - **App Service** → **"개요"** → **"게시 프로필 가져오기"**
   - 다운로드된 파일 내용 복사

5. GitHub 리포지토리:
   - **Settings** → **Secrets and variables** → **Actions**
   - **"New repository secret"**
   - 이름: `AZURE_BACKEND_PUBLISH_PROFILE`
   - 값: 복사한 내용 붙여넣기

#### 옵션 B: Azure CLI로 직접 배포

```bash
cd backend

# 배포 사용자 설정 (최초 1회)
az webapp deployment user set \
  --user-name <username> \
  --password <password>

# ZIP 배포
npm install
npm run build
cd ..
zip -r backend.zip backend/dist backend/package*.json backend/node_modules

az webapp deployment source config-zip \
  --resource-group erp-system-rg \
  --name erp-backend-app \
  --src backend.zip
```

#### 옵션 C: VS Code에서 배포

1. VS Code에서 **Azure App Service** 확장 설치
2. Azure 계정 로그인
3. `backend` 폴더 우클릭 → **"Deploy to Web App"**
4. App Service 선택

### 4.4 시작 명령 설정

1. **App Service** → **"구성"** → **"일반 설정"**
2. **"시작 명령"**:
   ```bash
   node dist/index.js
   ```
3. **"저장"**

### 4.5 배포 확인

1. **App Service** → **"개요"** → **"URL"** 클릭
2. 또는 브라우저에서: `https://erp-backend-app.azurewebsites.net/api/health`
3. 정상 응답 확인

---

## 5. 프론트엔드 배포

### 5.1 정적 웹 앱 만들기 (옵션 A - 권장, 저렴)

#### Azure Static Web Apps 사용:

1. **"리소스 만들기"** → **"Static Web App"** 검색
2. **"만들기"** 클릭
3. 기본 설정:
   - **구독**: 본인의 구독
   - **리소스 그룹**: `erp-system-rg`
   - **이름**: `erp-frontend`
   - **플랜 유형**: `Free` (개발용) 또는 `Standard` (프로덕션)
   - **지역**: `East Asia` (가장 가까운 지역)
4. GitHub 배포:
   - **소스**: `GitHub`
   - GitHub 계정 연결
   - **조직**: 본인 계정
   - **리포지토리**: 프로젝트 리포지토리
   - **분기**: `main`
5. 빌드 세부 정보:
   - **빌드 사전 설정**: `React`
   - **앱 위치**: `/frontend`
   - **API 위치**: (비워둠)
   - **출력 위치**: `dist`
6. **"검토 + 만들기"** → **"만들기"**

#### 환경 변수 설정:
1. **Static Web App** → **"구성"** → **"애플리케이션 설정"**
2. 추가:
```plaintext
VITE_API_URL=https://erp-backend-app.azurewebsites.net/api
VITE_APP_ENV=production
VITE_ENABLE_LOGGING=false
VITE_ENFORCE_HTTPS=true
```

### 5.2 App Service로 배포 (옵션 B)

Static Web Apps가 아닌 일반 App Service 사용 시:

1. **"리소스 만들기"** → **"Web App"**
2. 기본 설정:
   - **이름**: `erp-frontend-app`
   - **게시**: `코드`
   - **런타임 스택**: `Node 18 LTS`
   - **운영 체제**: `Linux`
   - **지역**: `Korea Central`
3. **"검토 + 만들기"** → **"만들기"**

#### 배포:
```bash
# 프론트엔드 빌드
cd frontend

# Azure용 환경 변수 파일 생성 (.env.production)
echo "VITE_API_URL=https://erp-backend-app.azurewebsites.net/api" > .env.production
echo "VITE_APP_ENV=production" >> .env.production

# 빌드
npm install
npm run build

# Azure에 배포
az webapp up \
  --name erp-frontend-app \
  --resource-group erp-system-rg \
  --runtime "NODE:18-lts" \
  --location koreacentral \
  --src-path ./dist
```

또는 GitHub Actions:
```yaml
# .github/workflows/azure-frontend.yml
name: Deploy Frontend to Azure

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'
  workflow_dispatch:

env:
  VITE_API_URL: https://erp-backend-app.azurewebsites.net/api
  VITE_APP_ENV: production

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install and Build
      run: |
        cd frontend
        npm ci
        npm run build

    - name: Deploy to Azure Static Web App
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "/frontend"
        output_location: "dist"
```

---

## 6. 가비아 도메인 연결

### 6.1 Azure에서 커스텀 도메인 추가

#### 백엔드 (api.yourdomain.com):

1. **App Service (백엔드)** → **"사용자 지정 도메인"**
2. **"+ 사용자 지정 도메인 추가"** 클릭
3. **도메인 공급자**: `다른 모든 도메인 서비스`
4. **TLS/SSL 인증서**: 나중에 설정
5. **호스트 이름**: `api.yourdomain.com`
6. **도메인 소유권 유효성 검사**:
   - Azure가 제공하는 **TXT 레코드** 정보 복사

#### 프론트엔드 (www.yourdomain.com 또는 yourdomain.com):

1. **Static Web App 또는 App Service (프론트엔드)** → **"사용자 지정 도메인"**
2. **"+ 사용자 지정 도메인 추가"**
3. **호스트 이름**: `yourdomain.com` 또는 `www.yourdomain.com`
4. **유효성 검사 정보** 복사

### 6.2 가비아 DNS 설정

1. **가비아** (https://www.gabia.com) 로그인
2. **My가비아** → **서비스 관리** → **도메인**
3. 본인 도메인 선택 → **"DNS 정보"** → **"DNS 설정"**

#### DNS 레코드 추가:

**백엔드용 (api.yourdomain.com):**
- **레코드 추가**:
  ```
  타입: CNAME
  호스트: api
  값/위치: erp-backend-app.azurewebsites.net
  TTL: 3600
  ```
- **유효성 검사용 TXT 레코드** (Azure에서 제공):
  ```
  타입: TXT
  호스트: asuid.api
  값: [Azure에서 제공한 값]
  TTL: 3600
  ```

**프론트엔드용 (yourdomain.com):**
- **A 레코드** (Static Web App의 경우):
  ```
  타입: A
  호스트: @
  값: [Azure Static Web App IP - Azure에서 제공]
  TTL: 3600
  ```
- **또는 CNAME** (App Service의 경우):
  ```
  타입: CNAME
  호스트: www
  값: erp-frontend-app.azurewebsites.net
  TTL: 3600
  ```
- **유효성 검사용 TXT 레코드**:
  ```
  타입: TXT
  호스트: asuid
  값: [Azure에서 제공한 값]
  TTL: 3600
  ```

4. **"확인"** → 설정 저장

### 6.3 DNS 전파 대기

- DNS 변경사항이 전파되는데 **최대 48시간** 소요 (보통 몇 분~몇 시간)
- 확인: `nslookup api.yourdomain.com`

### 6.4 Azure에서 도메인 유효성 검사

1. DNS 설정 후 **10-30분 대기**
2. Azure Portal → **App Service** → **"사용자 지정 도메인"**
3. **"유효성 검사"** 클릭
4. 성공하면 도메인 추가 완료

---

## 7. SSL 인증서 설정

### 7.1 Azure Managed Certificate (무료, 권장)

#### 백엔드:
1. **App Service (백엔드)** → **"사용자 지정 도메인"**
2. 추가한 도메인(`api.yourdomain.com`) 선택
3. **"TLS/SSL 바인딩 추가"**
4. **TLS/SSL 유형**: `SNI SSL`
5. **인증서**: `새 App Service 관리형 인증서 만들기`
6. **"유효성 검사"** → **"추가"**

#### 프론트엔드:
1. **Static Web App 또는 App Service (프론트엔드)** → **"사용자 지정 도메인"**
2. 동일하게 SSL 바인딩 추가

### 7.2 HTTPS 리디렉션 활성화

#### 백엔드:
1. **App Service** → **"TLS/SSL 설정"**
2. **"HTTPS만"** 토글 → **켜기**

#### 프론트엔드:
1. 동일하게 **"HTTPS만"** 활성화

---

## 8. 환경 변수 설정 (최종 업데이트)

### 8.1 백엔드 환경 변수 업데이트

커스텀 도메인 설정 완료 후:

1. **App Service (백엔드)** → **"구성"**
2. `FRONTEND_URL` 업데이트:
   ```plaintext
   FRONTEND_URL=https://yourdomain.com
   ```
   또는
   ```plaintext
   FRONTEND_URL=https://www.yourdomain.com
   ```
3. **"저장"** → **"계속"**

### 8.2 프론트엔드 환경 변수 업데이트

1. **Static Web App 또는 App Service (프론트엔드)** → **"구성"**
2. `VITE_API_URL` 업데이트:
   ```plaintext
   VITE_API_URL=https://api.yourdomain.com/api
   ```
3. **"저장"**

### 8.3 프론트엔드 재빌드 및 배포

환경 변수 변경 후 프론트엔드를 다시 빌드하고 배포해야 합니다:

```bash
cd frontend

# .env.production 업데이트
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env.production
echo "VITE_APP_ENV=production" >> .env.production
echo "VITE_ENABLE_LOGGING=false" >> .env.production
echo "VITE_ENFORCE_HTTPS=true" >> .env.production

# 재빌드
npm run build

# GitHub에 push하면 자동 배포 (GitHub Actions 사용 시)
git add .
git commit -m "Update production API URL"
git push
```

---

## 9. 배포 후 확인

### 9.1 백엔드 상태 확인

```bash
# Health check
curl https://api.yourdomain.com/health

# 또는
curl https://api.yourdomain.com/api/health
```

### 9.2 프론트엔드 접속

브라우저에서:
- `https://yourdomain.com` 또는 `https://www.yourdomain.com`
- 로그인 페이지가 정상적으로 표시되는지 확인

### 9.3 로그 확인

#### 백엔드 로그:
```bash
# Azure CLI로 실시간 로그 확인
az webapp log tail \
  --resource-group erp-system-rg \
  --name erp-backend-app
```

또는 Azure Portal:
- **App Service** → **"로그 스트림"**

#### 프론트엔드 로그:
- **Static Web App** → **"환경"** → **"로그"**

### 9.4 데이터베이스 연결 확인

1. 백엔드 로그에서 데이터베이스 연결 성공 메시지 확인
2. 로그인 기능 테스트
3. 데이터 조회/생성 테스트

---

## 10. 문제 해결

### 10.1 백엔드가 시작되지 않는 경우

**증상**: 502 Bad Gateway 또는 503 Service Unavailable

**해결 방법**:
1. 로그 확인:
   ```bash
   az webapp log tail --name erp-backend-app --resource-group erp-system-rg
   ```
2. 시작 명령 확인: `node dist/index.js`가 올바른지
3. `package.json`에 `start` 스크립트가 있는지 확인
4. 환경 변수가 모두 설정되었는지 확인
5. Node.js 버전 확인

### 10.2 데이터베이스 연결 실패

**증상**: `ECONNREFUSED` 또는 `Connection timeout`

**해결 방법**:
1. PostgreSQL 방화벽 규칙 확인:
   - **"Azure 서비스 액세스 허용"** 체크되어 있는지
2. 환경 변수 확인:
   - `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` 정확한지
   - `DB_SSL=true` 설정되어 있는지
3. PostgreSQL 서버 상태 확인:
   - Azure Portal에서 서버가 실행 중인지

### 10.3 CORS 오류

**증상**: 프론트엔드에서 API 호출 시 CORS 에러

**해결 방법**:
1. 백엔드 환경 변수 `FRONTEND_URL` 확인
2. 백엔드 코드에서 CORS 설정 확인:
   ```typescript
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```
3. 백엔드 재배포

### 10.4 프론트엔드에서 API 호출 실패

**증상**: `ERR_CONNECTION_REFUSED` 또는 404

**해결 방법**:
1. 프론트엔드 환경 변수 확인:
   - `VITE_API_URL` 값이 정확한지
   - `/api` 경로가 포함되어 있는지
2. 프론트엔드 재빌드 및 재배포
3. 브라우저 개발자 도구(F12) → Network 탭에서 실제 요청 URL 확인

### 10.5 SSL 인증서 오류

**증상**: `NET::ERR_CERT_COMMON_NAME_INVALID`

**해결 방법**:
1. DNS 설정이 올바른지 재확인
2. SSL 인증서가 발급될 때까지 대기 (최대 24시간)
3. Azure Portal에서 인증서 상태 확인

### 10.6 도메인이 연결되지 않음

**증상**: `DNS_PROBE_FINISHED_NXDOMAIN`

**해결 방법**:
1. DNS 전파 확인:
   ```bash
   nslookup api.yourdomain.com
   nslookup yourdomain.com
   ```
2. 가비아 DNS 설정 재확인
3. TTL 시간만큼 대기 (보통 1시간)

### 10.7 배포 후 변경사항이 반영되지 않음

**해결 방법**:
1. 브라우저 캐시 삭제 (Ctrl + Shift + Delete)
2. Azure에서 앱 재시작:
   - **App Service** → **"개요"** → **"다시 시작"**
3. CDN 캐시 제거 (Static Web App 사용 시)

---

## 11. 비용 최적화 팁

### 11.1 개발 단계
- **App Service**: B1 (Basic) 플랜 사용
- **PostgreSQL**: Burstable B1ms 사용
- **Static Web App**: Free 플랜

### 11.2 프로덕션
- **App Service**: P1V2 이상 (성능에 따라)
- **PostgreSQL**: 자동 백업 활성화
- **모니터링**: Application Insights 활성화

### 11.3 자동 스케일링
- App Service에서 자동 크기 조정 규칙 설정
- 트래픽이 적을 때 인스턴스 감소

---

## 12. 다음 단계

배포가 완료되었습니다! 다음 단계를 권장합니다:

1. **모니터링 설정**:
   - Application Insights 활성화
   - 알림 규칙 설정

2. **백업 설정**:
   - PostgreSQL 자동 백업 활성화
   - App Service 백업 구성

3. **CI/CD 파이프라인 구축**:
   - GitHub Actions로 자동 테스트 및 배포

4. **보안 강화**:
   - Azure Key Vault로 시크릿 관리
   - DDoS Protection 활성화

5. **성능 최적화**:
   - CDN 설정 (Azure Front Door 또는 Azure CDN)
   - 캐싱 전략 수립

---

## 13. 유용한 명령어

```bash
# Azure 로그인
az login

# 리소스 그룹 목록
az group list --output table

# App Service 목록
az webapp list --resource-group erp-system-rg --output table

# 앱 재시작
az webapp restart --name erp-backend-app --resource-group erp-system-rg

# 실시간 로그
az webapp log tail --name erp-backend-app --resource-group erp-system-rg

# 환경 변수 확인
az webapp config appsettings list --name erp-backend-app --resource-group erp-system-rg

# PostgreSQL 연결 문자열 확인
az postgres flexible-server show-connection-string --server-name erp-postgres-server

# 배포 슬롯 생성 (무중단 배포용)
az webapp deployment slot create --name erp-backend-app --resource-group erp-system-rg --slot staging
```

---

## 14. 참고 자료

- [Azure App Service 문서](https://docs.microsoft.com/ko-kr/azure/app-service/)
- [Azure Static Web Apps 문서](https://docs.microsoft.com/ko-kr/azure/static-web-apps/)
- [Azure Database for PostgreSQL 문서](https://docs.microsoft.com/ko-kr/azure/postgresql/)
- [Azure CLI 참조](https://docs.microsoft.com/ko-kr/cli/azure/)

---

## 문의 및 지원

배포 중 문제가 발생하면:
1. Azure Portal의 **"지원 + 문제 해결"** 메뉴 활용
2. [Azure 커뮤니티 포럼](https://aka.ms/azureforums)
3. 로그를 확인하여 구체적인 오류 메시지 파악

---

**배포 완료를 축하합니다! 🎉**
