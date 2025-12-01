# 🚀 GitHub 저장소 생성부터 Render 배포까지 완벽 가이드

## 📋 목차
1. [GitHub 저장소 생성하기](#1-github-저장소-생성하기)
2. [로컬 Git 설정하기](#2-로컬-git-설정하기)
3. [코드를 GitHub에 푸시하기](#3-코드를-github에-푸시하기)
4. [Render 배포하기](#4-render-배포하기)

---

## 1. GitHub 저장소 생성하기

### Step 1-1: GitHub 접속 및 로그인
1. 브라우저에서 https://github.com 접속
2. 우측 상단 **"Sign in"** 클릭하여 로그인
   - 계정이 없다면 **"Sign up"** 클릭하여 가입

### Step 1-2: 새 저장소 생성
1. 로그인 후 우측 상단 **"+"** 아이콘 클릭
2. **"New repository"** 선택

### Step 1-3: 저장소 설정
다음과 같이 입력하세요:

```
Repository name: erp-system
Description: ERP 통합 시스템 (선택사항)

□ Public  (누구나 볼 수 있음)
☑ Private (본인만 볼 수 있음 - 권장)

☑ Add a README file (체크 해제!)
☑ Add .gitignore (체크 해제!)
☑ Choose a license (체크 해제!)
```

⚠️ **중요**: README, .gitignore, license는 체크하지 마세요! (이미 로컬에 있음)

### Step 1-4: 저장소 생성 완료
1. 하단 **"Create repository"** 버튼 클릭
2. 생성된 저장소 URL 복사:
   ```
   https://github.com/사용자이름/erp-system.git
   ```

---

## 2. 로컬 Git 설정하기

### Step 2-1: Git 초기화 확인
터미널(명령 프롬프트)을 열고:

```bash
cd "C:\Users\black\Desktop\신erp1125 완성"
git status
```

**이미 Git이 초기화되어 있으면:**
```
On branch master
```
→ Step 2-2로 이동

**Git이 초기화되지 않았으면:**
```
fatal: not a git repository
```
→ 다음 명령어 실행:
```bash
git init
```

### Step 2-2: Git 사용자 정보 설정 (최초 1회)

```bash
# 사용자 이름 설정
git config --global user.name "본인이름"

# 이메일 설정 (GitHub 이메일과 동일하게)
git config --global user.email "your-email@example.com"

# 설정 확인
git config --global --list
```

### Step 2-3: 원격 저장소 연결

#### 기존 원격 저장소 제거 (있는 경우)
```bash
git remote remove origin
```

#### 새 원격 저장소 추가
```bash
git remote add origin https://github.com/사용자이름/erp-system.git
```

**예시:**
```bash
git remote add origin https://github.com/parkgh1102/erp-system.git
```

#### 연결 확인
```bash
git remote -v
```

**출력 예시:**
```
origin  https://github.com/parkgh1102/erp-system.git (fetch)
origin  https://github.com/parkgh1102/erp-system.git (push)
```

---

## 3. 코드를 GitHub에 푸시하기

### Step 3-1: 변경사항 스테이징

```bash
# 모든 파일 추가 (dist 폴더 제외됨 - .gitignore에 설정됨)
git add .

# 추가된 파일 확인
git status
```

### Step 3-2: 커밋 생성

```bash
git commit -m "Initial commit: ERP 시스템 초기 버전"
```

### Step 3-3: 메인 브랜치 이름 확인 및 변경

```bash
# 현재 브랜치 확인
git branch

# master → main으로 변경 (GitHub 권장)
git branch -M main
```

### Step 3-4: GitHub에 푸시

#### 방법 1: HTTPS 사용 (권장 - 간단함)

```bash
git push -u origin main
```

**처음 푸시 시 인증 요청:**
- Username: GitHub 사용자명 입력
- Password: **Personal Access Token** 입력 (아래 참조)

#### Personal Access Token 생성 방법:

1. GitHub 웹사이트 접속
2. 우측 상단 프로필 → **Settings**
3. 왼쪽 메뉴 맨 아래 **Developer settings**
4. **Personal access tokens** → **Tokens (classic)**
5. **Generate new token** → **Generate new token (classic)**
6. 설정:
   ```
   Note: erp-system-deploy
   Expiration: 90 days

   Scopes (체크):
   ☑ repo (전체 체크)
   ☑ workflow
   ```
7. **Generate token** 클릭
8. 생성된 토큰 복사 (한 번만 보임! 꼭 저장하세요)

#### 토큰으로 푸시:
```bash
# Password 입력 시 복사한 토큰 붙여넣기
git push -u origin main
```

#### 방법 2: SSH 사용 (고급)

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "your-email@example.com"

# 공개키 복사
cat ~/.ssh/id_ed25519.pub

# GitHub Settings → SSH and GPG keys → New SSH key
# 복사한 공개키 붙여넣기

# 원격 저장소를 SSH로 변경
git remote set-url origin git@github.com:사용자이름/erp-system.git

# 푸시
git push -u origin main
```

### Step 3-5: GitHub에서 확인

1. 브라우저에서 저장소 접속:
   ```
   https://github.com/사용자이름/erp-system
   ```

2. 파일이 업로드된 것 확인:
   ```
   ✓ backend/
   ✓ frontend/
   ✓ render.yaml
   ✓ package.json
   ✓ README.md
   ```

---

## 4. Render 배포하기

### Step 4-1: Render 계정 생성 및 로그인

1. https://render.com 접속
2. **"Get Started"** 클릭
3. **"Sign up with GitHub"** 선택 (권장)
   - GitHub 계정으로 자동 로그인
   - 저장소 접근 권한 승인

### Step 4-2: Blueprint 생성

1. Render 대시보드 접속
2. 우측 상단 **"New +"** 버튼 클릭
3. 드롭다운에서 **"Blueprint"** 선택

### Step 4-3: GitHub 저장소 연결

1. **"Connect a repository"** 화면에서
2. 검색창에 **"erp-system"** 입력
3. **"사용자이름/erp-system"** 선택
4. **"Connect"** 버튼 클릭

### Step 4-4: Blueprint 자동 감지 확인

Render가 `render.yaml` 파일을 자동으로 읽고 표시합니다:

```
Blueprint Details:

✓ Services to create:

  1. erp-backend (Web Service)
     - Runtime: Node
     - Region: Singapore
     - Plan: Free
     - Build Command: npm install --no-workspaces...
     - Start Command: node dist/index.js
     - Health Check: /api/health

  2. erp-database (PostgreSQL)
     - Plan: Free
     - Region: Singapore
     - Database: erp_system
     - User: erp_user

✓ Environment Variables:
  - NODE_ENV: production
  - PORT: 3001
  - DB_TYPE: postgres
  - DB_HOST: (from database)
  - DB_PORT: (from database)
  - DB_USERNAME: (from database)
  - DB_PASSWORD: (from database)
  - DB_DATABASE: (from database)
  - JWT_SECRET: (auto-generated)
  - JWT_REFRESH_SECRET: (auto-generated)
  - SESSION_SECRET: (auto-generated)
  - FRONTEND_URL: https://webapperp.ai.kr
  ... 등
```

### Step 4-5: 배포 시작

1. 설정 확인 후 하단 **"Apply"** 버튼 클릭
2. 배포가 시작됩니다!

### Step 4-6: 배포 진행 상황 모니터링

**예상 시간: 5-8분**

#### Phase 1: Creating Resources (1-2분)
```
Creating PostgreSQL database...
✓ erp-database created

Creating Web Service...
✓ erp-backend created
```

#### Phase 2: Building (3-5분)
```
📍 Current directory: /opt/render/project/src/backend
📦 Installing dependencies (no workspace)...
  ✓ npm install successful

🔨 Building TypeScript...
  ✓ TypeScript compilation complete

✅ Build complete - Checking dist folder...
  ✓ dist/index.js exists (10KB)
```

#### Phase 3: Deploying (1-2분)
```
Starting service with command: node dist/index.js
⏳ Connecting to database... (attempts remaining: 3)
✅ Database connected successfully
🚀 Server running on port 3001
✅ Server is ready to accept requests
```

#### Phase 4: Live! ✅
```
Status: 🟢 Live
URL: https://erp-backend-xxxx.onrender.com
```

### Step 4-7: 배포 완료 확인

#### 1. Render 대시보드에서 확인
- **erp-backend** 상태: 🟢 Live
- **erp-database** 상태: 🟢 Available

#### 2. 배포 URL 확인
```
https://erp-backend-xxxx.onrender.com
```

#### 3. API 헬스 체크
브라우저에서 접속:
```
https://erp-backend-xxxx.onrender.com/api/health
```

**성공 응답:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-01T11:30:00.000Z",
  "environment": "production",
  "service": "erp-backend",
  "database": "connected"
}
```

#### 4. 프론트엔드 연결 테스트
1. https://webapperp.ai.kr 접속
2. 로그인 시도
3. ✅ 503 에러 없이 정상 작동 확인!

---

## 🎯 배포 후 추가 설정 (선택사항)

### 커스텀 도메인 연결

1. Render 대시보드에서 **erp-backend** 서비스 클릭
2. **Settings** 탭
3. **Custom Domain** 섹션에서 **Add Custom Domain**
4. 도메인 입력 및 DNS 설정

### 환경 변수 추가

선택적으로 추가 가능:

```bash
# 이메일 전송
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# 파일 업로드 (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI 챗봇 (Gemini)
GEMINI_API_KEY=your-gemini-api-key
```

---

## 🔄 코드 수정 후 재배포

### 로컬에서 코드 수정 후:

```bash
# 1. 변경사항 확인
git status

# 2. 변경된 파일 추가
git add .

# 3. 커밋
git commit -m "Fix: 버그 수정"

# 4. GitHub에 푸시
git push origin main
```

### Render가 자동으로:
1. GitHub 푸시 감지
2. 자동으로 빌드 시작
3. 빌드 성공 시 자동 배포
4. 서비스 재시작

**재배포 시간:** 약 3-5분

---

## 🐛 문제 해결

### 푸시 실패: "Authentication failed"
**원인:** Personal Access Token 만료 또는 잘못된 입력

**해결:**
1. 새 토큰 생성 (GitHub Settings → Developer settings)
2. 다시 푸시 시도
3. Password에 새 토큰 입력

### 푸시 실패: "Permission denied"
**원인:** SSH 키 설정 문제

**해결:**
```bash
# HTTPS로 변경
git remote set-url origin https://github.com/사용자이름/erp-system.git
git push origin main
```

### Render 빌드 실패
**확인 사항:**
1. Render 로그에서 에러 메시지 확인
2. `render.yaml` 파일 존재 여부
3. `backend/package.json` 파일 확인
4. TypeScript 컴파일 에러 확인

### 503 에러 발생
**원인:** 서버가 아직 시작 중

**해결:**
- 배포 완료까지 대기 (최대 10분)
- "Live" 상태 확인
- 로그에서 "Server is ready" 메시지 확인

---

## 📊 전체 프로세스 체크리스트

### GitHub 설정
- [ ] GitHub 계정 생성/로그인
- [ ] 새 저장소 생성 (erp-system)
- [ ] 저장소 URL 복사

### 로컬 Git 설정
- [ ] Git 사용자 정보 설정
- [ ] 원격 저장소 연결
- [ ] 변경사항 커밋
- [ ] GitHub에 푸시

### Render 배포
- [ ] Render 계정 생성 (GitHub 연동)
- [ ] Blueprint 생성
- [ ] GitHub 저장소 연결
- [ ] render.yaml 자동 감지 확인
- [ ] Apply 클릭하여 배포 시작

### 배포 확인
- [ ] 빌드 로그 확인
- [ ] "Live" 상태 확인
- [ ] /api/health 엔드포인트 테스트
- [ ] 프론트엔드 연결 테스트

---

## 🎉 완료!

이제 ERP 시스템이 GitHub에 안전하게 저장되고, Render에서 자동으로 배포됩니다!

**앞으로 코드를 수정하면:**
1. 로컬에서 코드 수정
2. `git add .` → `git commit -m "메시지"` → `git push`
3. Render가 자동으로 감지하여 재배포

**모든 과정이 자동화됩니다!** 🚀

---

## 📞 추가 도움이 필요하면

- GitHub 도움말: https://docs.github.com/
- Render 도움말: https://render.com/docs
- Git 도움말: https://git-scm.com/doc
