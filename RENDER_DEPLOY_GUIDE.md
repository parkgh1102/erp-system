# Render 처음부터 새로 배포하기 (Blueprint 방식)

## 📋 사전 준비

### 1. GitHub 저장소 확인
- ✅ 저장소: `parkgh1102/erp-system`
- ✅ 최신 커밋: `fd34c62`
- ✅ render.yaml 존재 확인

### 2. 필요한 정보
- GitHub 계정 (저장소 접근 권한)
- Render 계정

---

## 🚀 Render Blueprint 배포 단계별 가이드

### Step 1: Render 대시보드 접속
1. https://render.com/ 접속
2. **"Sign In"** 또는 **"Get Started"** 클릭
3. **GitHub 계정으로 로그인**

### Step 2: 새 Blueprint 생성
1. 대시보드 우측 상단 **"New +"** 버튼 클릭
2. 드롭다운에서 **"Blueprint"** 선택

### Step 3: GitHub 저장소 연결
1. **"Connect a repository"** 섹션에서
2. 검색창에 **"erp-system"** 입력
3. **"parkgh1102/erp-system"** 선택
4. **"Connect"** 클릭

### Step 4: Blueprint 설정 확인
Render가 자동으로 `render.yaml`을 감지합니다.

**표시되는 내용:**
```
✓ erp-backend (Web Service)
  - Build Command: npm install --no-workspaces...
  - Start Command: node dist/index.js
  - Environment: production

✓ erp-database (PostgreSQL Database)
  - Database: erp_system
  - User: erp_user
  - Region: Singapore
```

### Step 5: 환경 변수 자동 생성 확인
다음 값들이 자동으로 생성됩니다:
- ✅ `JWT_SECRET` (자동 생성)
- ✅ `JWT_REFRESH_SECRET` (자동 생성)
- ✅ `SESSION_SECRET` (자동 생성)
- ✅ `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` (데이터베이스에서 자동 연결)

### Step 6: Blueprint 배포 시작
1. 하단의 **"Apply"** 버튼 클릭
2. 배포가 시작됩니다!

---

## ⏱️ 배포 진행 상황

### 예상 시간
- **데이터베이스 생성**: 2-3분
- **백엔드 빌드**: 3-5분
- **총 소요 시간**: 약 5-8분

### 배포 단계
1. **Creating Resources** (30초)
   - PostgreSQL 데이터베이스 생성
   - Web Service 생성

2. **Building** (3-5분)
   ```
   📍 Current directory: /opt/render/project/src/backend
   📦 Installing dependencies (no workspace)...
   🔨 Building TypeScript...
   ✅ Build complete - Checking dist folder...
   📄 Checking dist/index.js... ✓
   ```

3. **Deploying** (1-2분)
   ```
   Starting service with command: node dist/index.js
   ⏳ Connecting to database... (attempts remaining: 3)
   ✅ Database connected successfully
   🚀 Server running on port 3001
   ✅ Server is ready to accept requests
   ```

4. **Live** ✅
   - 서비스가 정상 작동 중!

---

## ✅ 배포 성공 확인

### 1. Render 대시보드에서 확인
- **"erp-backend"** 서비스 상태: **🟢 Live**
- **"erp-database"** 상태: **🟢 Available**

### 2. 로그에서 확인할 메시지
```
✅ Database connected successfully
🚀 Server running on port 3001
✅ Server is ready to accept requests
```

### 3. API 엔드포인트 확인
배포된 URL: `https://erp-backend-xxxx.onrender.com`

브라우저에서 헬스 체크:
```
https://erp-backend-xxxx.onrender.com/api/health
```

응답:
```json
{
  "status": "OK",
  "timestamp": "2025-12-01T...",
  "environment": "production",
  "service": "erp-backend",
  "database": "connected"
}
```

### 4. 프론트엔드 연결 테스트
1. https://webapperp.ai.kr 접속
2. 로그인 시도
3. ✅ 503 에러 없이 정상 작동!

---

## 🔧 배포 후 추가 설정 (선택사항)

### 커스텀 도메인 연결 (이미 있는 경우)
1. "erp-backend" 서비스 → "Settings" 탭
2. "Custom Domain" 섹션
3. `erp-backend-gaee.onrender.com` 또는 원하는 도메인 추가

### 환경 변수 추가 (필요시)
선택적으로 추가 가능한 변수:
```bash
# 이메일 (선택)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Cloudinary (선택)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Gemini AI (선택)
GEMINI_API_KEY=your-gemini-api-key
```

---

## 🐛 문제 해결

### 빌드 실패 시
1. "Events" 탭에서 로그 확인
2. 에러 메시지 확인
3. 주요 확인 사항:
   - ✅ dist/index.js 생성되었는지
   - ✅ npm install 성공했는지
   - ✅ TypeScript 컴파일 성공했는지

### 데이터베이스 연결 실패 시
1. PostgreSQL 서비스 상태 확인
2. 환경 변수 `DB_*` 자동 설정 확인
3. 로그에서 연결 오류 메시지 확인

### 503 에러 발생 시
- 배포가 완료될 때까지 대기 (최대 10분)
- "Live" 상태가 되어야 정상 접속 가능

---

## 📊 최종 체크리스트

- [ ] Render 대시보드 로그인 완료
- [ ] Blueprint로 새 서비스 생성
- [ ] GitHub 저장소 연결 완료
- [ ] render.yaml 자동 감지 확인
- [ ] "Apply" 클릭하여 배포 시작
- [ ] 배포 완료 대기 (5-8분)
- [ ] "Live" 상태 확인
- [ ] /api/health 엔드포인트 테스트
- [ ] 프론트엔드 연결 테스트

---

## 🎉 완료!

모든 단계가 성공하면:
- ✅ 백엔드 서버: 정상 작동
- ✅ PostgreSQL: 연결됨
- ✅ API: 접근 가능
- ✅ 프론트엔드: 백엔드와 통신 정상

**배포 URL**: Render 대시보드에서 확인 가능

이제 ERP 시스템을 사용할 수 있습니다! 🚀
