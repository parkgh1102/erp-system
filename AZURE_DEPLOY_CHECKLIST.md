# Azure 배포 체크리스트 ✅

이 체크리스트를 따라가면서 Azure 배포를 완료하세요.

## 📌 1단계: 사전 준비

- [ ] Azure CLI 설치 완료
- [ ] Azure 계정 로그인 (`az login`)
- [ ] 구독 확인 및 선택
- [ ] 로컬에서 백엔드 빌드 테스트 (`cd backend && npm run build`)
- [ ] 로컬에서 프론트엔드 빌드 테스트 (`cd frontend && npm run build`)

## 📌 2단계: Azure 리소스 생성

### 리소스 그룹
- [ ] 리소스 그룹 생성 완료
  - 이름: `erp-system-rg` (또는 원하는 이름)
  - 지역: `Korea Central`

### PostgreSQL 데이터베이스
- [ ] Azure Database for PostgreSQL 유연한 서버 생성
  - 서버 이름: `erp-postgres-server` (고유한 이름)
  - 버전: PostgreSQL 16 이상
  - 관리자 계정 정보 안전하게 기록
- [ ] 데이터베이스 생성: `erp_system`
- [ ] 방화벽 규칙 설정:
  - [ ] Azure 서비스 액세스 허용 활성화
  - [ ] (선택) 로컬 IP 추가
- [ ] 연결 정보 기록:
  ```
  호스트: _______________________________
  포트: 5432
  데이터베이스: erp_system
  사용자: _______________________________
  암호: _______________________________
  ```

### 백엔드 App Service
- [ ] App Service 플랜 생성
  - 플랜 이름: `erp-backend-plan`
  - SKU: B1 (개발) 또는 P1V2 (프로덕션)
- [ ] Web App 생성
  - 앱 이름: `erp-backend-app` (고유한 이름)
  - 런타임: Node 18 LTS
  - OS: Linux 권장
- [ ] 백엔드 URL 기록: `https://______________.azurewebsites.net`

### 프론트엔드 (옵션 선택)

**옵션 A: Static Web App (권장)**
- [ ] Static Web App 생성
  - 앱 이름: `erp-frontend`
  - 플랜: Free 또는 Standard
- [ ] 프론트엔드 URL 기록: `https://______________.azurestaticapps.net`

**옵션 B: App Service**
- [ ] App Service 생성
  - 앱 이름: `erp-frontend-app`
  - 런타임: Node 18 LTS
- [ ] 프론트엔드 URL 기록: `https://______________.azurewebsites.net`

## 📌 3단계: 시크릿 생성

로컬 터미널에서 다음 명령어를 3번 실행하여 고유한 시크릿 생성:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

- [ ] JWT_SECRET: `_________________________________________________`
- [ ] JWT_REFRESH_SECRET: `_________________________________________________`
- [ ] SESSION_SECRET: `_________________________________________________`

## 📌 4단계: 백엔드 환경 변수 설정

Azure Portal → App Service (백엔드) → 구성 → 애플리케이션 설정

**기본 설정:**
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `8080`
- [ ] `FRONTEND_URL` = (프론트엔드 URL - 나중에 커스텀 도메인으로 업데이트)

**데이터베이스:**
- [ ] `DB_TYPE` = `postgres`
- [ ] `DB_HOST` = (PostgreSQL 서버 호스트)
- [ ] `DB_PORT` = `5432`
- [ ] `DB_USERNAME` = (PostgreSQL 관리자 이름)
- [ ] `DB_PASSWORD` = (PostgreSQL 암호)
- [ ] `DB_DATABASE` = `erp_system`
- [ ] `DB_SSL` = `true`

**JWT 및 세션:**
- [ ] `JWT_SECRET` = (위에서 생성한 값)
- [ ] `JWT_EXPIRES_IN` = `15m`
- [ ] `JWT_REFRESH_SECRET` = (위에서 생성한 값)
- [ ] `JWT_REFRESH_EXPIRES_IN` = `7d`
- [ ] `SESSION_SECRET` = (위에서 생성한 값)

**보안:**
- [ ] `BCRYPT_ROUNDS` = `12`
- [ ] `FORCE_HTTPS` = `true`
- [ ] `DISABLE_CSRF` = `false`
- [ ] `RATE_LIMIT_WINDOW_MS` = `900000`
- [ ] `RATE_LIMIT_MAX` = `100`

**로깅:**
- [ ] `LOG_LEVEL` = `info`

- [ ] 모든 설정 저장 클릭

## 📌 5단계: 프론트엔드 환경 변수 설정

Azure Portal → Static Web App/App Service (프론트엔드) → 구성

- [ ] `VITE_API_URL` = (백엔드 URL + `/api` - 나중에 커스텀 도메인으로 업데이트)
- [ ] `VITE_APP_ENV` = `production`
- [ ] `VITE_ENABLE_LOGGING` = `false`
- [ ] `VITE_ENFORCE_HTTPS` = `true`
- [ ] `VITE_APP_NAME` = `ERP 통합시스템`
- [ ] `VITE_APP_VERSION` = `1.0.0`
- [ ] 설정 저장

## 📌 6단계: GitHub 설정 (자동 배포)

### GitHub 리포지토리 생성
- [ ] GitHub에 새 리포지토리 생성
- [ ] 로컬 프로젝트를 Git 초기화 및 푸시:
  ```bash
  git init
  git add .
  git commit -m "Initial commit for Azure deployment"
  git branch -M main
  git remote add origin https://github.com/사용자명/리포지토리명.git
  git push -u origin main
  ```

### GitHub Secrets 설정

**백엔드용:**
- [ ] Azure Portal → App Service (백엔드) → 개요 → "게시 프로필 가져오기"
- [ ] GitHub 리포지토리 → Settings → Secrets and variables → Actions
- [ ] `AZURE_BACKEND_PUBLISH_PROFILE` 추가 (다운로드한 파일 내용)

**프론트엔드용 (Static Web App):**
- [ ] Azure Portal → Static Web App → 개요 → "배포 토큰 관리"
- [ ] GitHub에 `AZURE_STATIC_WEB_APPS_API_TOKEN` 추가

**또는 프론트엔드용 (App Service):**
- [ ] "게시 프로필 가져오기"
- [ ] GitHub에 `AZURE_FRONTEND_PUBLISH_PROFILE` 추가

**Azure Credentials (선택사항):**
- [ ] Azure에서 Service Principal 생성
- [ ] GitHub에 `AZURE_CREDENTIALS` 추가

## 📌 7단계: 배포 실행

### 자동 배포 (GitHub Actions)
- [ ] GitHub Actions 워크플로우 파일 확인
- [ ] GitHub에 코드 푸시
- [ ] Actions 탭에서 배포 진행 상황 확인
- [ ] 배포 성공 확인

### 또는 수동 배포

**백엔드:**
```bash
cd backend
npm install
npm run build
az webapp up --name erp-backend-app --resource-group erp-system-rg
```
- [ ] 백엔드 수동 배포 완료

**프론트엔드:**
```bash
cd frontend
npm install
npm run build
# Static Web App 또는 App Service에 배포
```
- [ ] 프론트엔드 수동 배포 완료

## 📌 8단계: 시작 명령 설정

### 백엔드
- [ ] App Service → 구성 → 일반 설정 → 시작 명령
- [ ] 입력: `node dist/index.js`
- [ ] 저장 후 재시작

## 📌 9단계: 배포 확인

- [ ] 백엔드 Health Check 테스트:
  ```bash
  curl https://erp-backend-app.azurewebsites.net/api/health
  ```
- [ ] 프론트엔드 접속 테스트 (브라우저)
- [ ] 로그인 기능 테스트
- [ ] 기본 기능 동작 확인

## 📌 10단계: 커스텀 도메인 연결 (선택사항)

### 가비아 도메인 준비
- [ ] 가비아에서 도메인 소유 확인

### Azure에서 커스텀 도메인 추가

**백엔드 (api.yourdomain.com):**
- [ ] App Service → 사용자 지정 도메인 → 도메인 추가
- [ ] 호스트 이름: `api.yourdomain.com`
- [ ] 유효성 검사 정보 복사 (TXT 레코드)

**프론트엔드 (yourdomain.com):**
- [ ] Static Web App/App Service → 사용자 지정 도메인 → 도메인 추가
- [ ] 호스트 이름: `yourdomain.com` 또는 `www.yourdomain.com`
- [ ] 유효성 검사 정보 복사

### 가비아 DNS 설정

- [ ] 가비아 로그인 → DNS 관리
- [ ] 백엔드용 레코드 추가:
  - CNAME: `api` → `erp-backend-app.azurewebsites.net`
  - TXT: `asuid.api` → (Azure 제공 값)
- [ ] 프론트엔드용 레코드 추가:
  - A 또는 CNAME: `@` 또는 `www` → (Azure 제공 값)
  - TXT: `asuid` → (Azure 제공 값)
- [ ] DNS 전파 대기 (10분~48시간)
- [ ] DNS 전파 확인:
  ```bash
  nslookup api.yourdomain.com
  nslookup yourdomain.com
  ```

### Azure에서 도메인 유효성 검사
- [ ] 백엔드 도메인 유효성 검사 통과
- [ ] 프론트엔드 도메인 유효성 검사 통과

## 📌 11단계: SSL 인증서 설정

**백엔드:**
- [ ] App Service → 사용자 지정 도메인 → TLS/SSL 바인딩 추가
- [ ] Azure 관리형 인증서 선택
- [ ] 인증서 발급 완료

**프론트엔드:**
- [ ] Static Web App/App Service → 사용자 지정 도메인 → TLS/SSL 바인딩 추가
- [ ] Azure 관리형 인증서 선택
- [ ] 인증서 발급 완료

**HTTPS 리디렉션:**
- [ ] 백엔드: TLS/SSL 설정 → "HTTPS만" 활성화
- [ ] 프론트엔드: TLS/SSL 설정 → "HTTPS만" 활성화

## 📌 12단계: 환경 변수 최종 업데이트

### 백엔드
- [ ] `FRONTEND_URL` 업데이트 → `https://yourdomain.com`
- [ ] 저장 및 재시작

### 프론트엔드
- [ ] `VITE_API_URL` 업데이트 → `https://api.yourdomain.com/api`
- [ ] 저장

### 프론트엔드 재배포
- [ ] `.env.production` 파일 업데이트
- [ ] 재빌드 및 재배포
- [ ] 변경사항 GitHub에 푸시 (자동 배포 시)

## 📌 13단계: 최종 테스트

- [ ] `https://yourdomain.com` 접속 확인
- [ ] `https://api.yourdomain.com/api/health` 상태 확인
- [ ] HTTPS 리디렉션 동작 확인
- [ ] 로그인 기능 테스트
- [ ] 주요 기능 동작 테스트
- [ ] 모바일/데스크톱 브라우저 테스트
- [ ] 성능 확인

## 📌 14단계: 모니터링 및 보안 (선택사항)

- [ ] Application Insights 활성화
- [ ] 알림 규칙 설정
- [ ] PostgreSQL 자동 백업 활성화
- [ ] App Service 백업 구성
- [ ] Azure Key Vault로 시크릿 이전 (선택)
- [ ] DDoS Protection 활성화 (선택)

## 📌 15단계: 문서화

- [ ] 배포 URL 기록
- [ ] 관리자 계정 정보 안전하게 저장
- [ ] 데이터베이스 백업 절차 문서화
- [ ] 장애 대응 계획 수립

---

## ✅ 배포 완료!

모든 항목을 체크했다면 Azure 배포가 완료되었습니다!

### 배포 정보 요약

```
프론트엔드 URL: https://___________________________
백엔드 URL: https://___________________________
데이터베이스: erp-postgres-server.postgres.database.azure.com
리소스 그룹: erp-system-rg
지역: Korea Central
```

### 유용한 명령어

```bash
# 백엔드 로그 확인
az webapp log tail --name erp-backend-app --resource-group erp-system-rg

# 앱 재시작
az webapp restart --name erp-backend-app --resource-group erp-system-rg

# 환경 변수 확인
az webapp config appsettings list --name erp-backend-app --resource-group erp-system-rg
```

---

**문제가 발생하면 `AZURE_DEPLOY_GUIDE.md`의 "문제 해결" 섹션을 참고하세요!**
