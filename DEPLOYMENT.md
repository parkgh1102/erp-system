# Railway 배포 가이드

## 🚀 가장 쉬운 배포 방법

Railway를 사용하여 ERP 시스템을 배포합니다.

---

## 1️⃣ 준비 사항

### 계정 생성
1. https://railway.app 접속
2. GitHub 계정으로 로그인
3. 무료 $5 크레딧 자동 제공

### GitHub 저장소 생성
```bash
cd C:\Users\black\Desktop\신erp1013
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

---

## 2️⃣ 데이터베이스 배포 (PostgreSQL)

### Railway에서 PostgreSQL 추가
1. Railway 대시보드 → **New Project**
2. **Provision PostgreSQL** 클릭
3. 자동으로 데이터베이스 생성 완료

### 환경변수 자동 설정
Railway가 자동으로 다음 변수를 생성합니다:
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`

---

## 3️⃣ 백엔드 배포

### Railway에서 백엔드 서비스 추가
1. 같은 프로젝트에서 **New Service** 클릭
2. **Deploy from GitHub repo** 선택
3. 저장소 선택
4. Root Directory: `/backend` 또는 루트 (설정에 따라)

### 환경변수 설정
Railway 대시보드 → Backend Service → **Variables** 탭:

```bash
# PostgreSQL (자동으로 연결됨)
PGHOST=${{Postgres.PGHOST}}
PGPORT=${{Postgres.PGPORT}}
PGUSER=${{Postgres.PGUSER}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
PGDATABASE=${{Postgres.PGDATABASE}}

# JWT 시크릿 (랜덤 생성 추천)
JWT_SECRET=your-super-secret-jwt-key-here-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-change-this

# 프론트엔드 URL (나중에 업데이트)
FRONTEND_URL=https://your-frontend-url.railway.app

# 기타
NODE_ENV=production
```

### 배포 확인
- Railway가 자동으로 빌드 및 배포
- 배포 URL: `https://your-backend.railway.app`

---

## 4️⃣ 프론트엔드 배포

### Railway에서 프론트엔드 서비스 추가
1. 같은 프로젝트에서 **New Service** 클릭
2. **Deploy from GitHub repo** 선택
3. 저장소 선택
4. Root Directory: `/frontend` 또는 루트

### 환경변수 설정
Railway 대시보드 → Frontend Service → **Variables** 탭:

```bash
# 백엔드 API URL
VITE_API_URL=https://your-backend.railway.app

# 기타
NODE_ENV=production
```

### 배포 확인
- Railway가 자동으로 빌드 및 배포
- 배포 URL: `https://your-frontend.railway.app`

---

## 5️⃣ CORS 설정 업데이트

### 백엔드 환경변수에 프론트엔드 URL 추가
```bash
FRONTEND_URL=https://your-frontend.railway.app
```

Railway 대시보드에서 백엔드 서비스를 재시작합니다.

---

## 6️⃣ 데이터베이스 초기화

### 방법 1: Railway CLI 사용
```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 데이터베이스 마이그레이션 실행
railway run npm run migration:run
```

### 방법 2: 수동 SQL 실행
1. Railway 대시보드 → PostgreSQL Service
2. **Data** 탭 → **Query** 클릭
3. `setup-db.sql` 파일 내용 복사 후 실행

---

## 7️⃣ 배포 완료 확인

### 테스트
1. 프론트엔드 URL 접속: `https://your-frontend.railway.app`
2. 로그인 테스트
3. 기본 기능 동작 확인

### 모니터링
- Railway 대시보드에서 실시간 로그 확인
- Deployments 탭에서 배포 히스토리 확인

---

## 🔄 자동 배포 (CI/CD)

GitHub에 푸시하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "Update feature"
git push
```

Railway가 자동으로:
1. 변경사항 감지
2. 빌드
3. 배포
4. 헬스체크

---

## 💰 비용

### 무료 플랜
- $5 무료 크레딧 (매월)
- 충분히 소규모 팀에서 사용 가능

### 예상 월 비용 (유료 전환 시)
- PostgreSQL: ~$5
- Backend: ~$5
- Frontend: ~$5
- **총 ~$15/월**

---

## 🆘 문제 해결

### 빌드 실패
```bash
# Railway 로그 확인
railway logs

# 로컬에서 빌드 테스트
cd backend && npm run build
cd ../frontend && npm run build
```

### 데이터베이스 연결 실패
- PostgreSQL 서비스가 실행 중인지 확인
- 환경변수가 올바르게 설정되었는지 확인

### CORS 오류
- `FRONTEND_URL` 환경변수가 프론트엔드 URL과 일치하는지 확인
- 백엔드 서비스 재시작

---

## 📚 추가 리소스

- Railway 공식 문서: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway 헬프센터: https://help.railway.app

---

## ✅ 체크리스트

- [ ] GitHub 저장소 생성 및 푸시
- [ ] Railway 계정 생성
- [ ] PostgreSQL 서비스 생성
- [ ] 백엔드 서비스 배포 및 환경변수 설정
- [ ] 프론트엔드 서비스 배포 및 환경변수 설정
- [ ] CORS 설정 업데이트
- [ ] 데이터베이스 초기화
- [ ] 배포 확인 및 테스트

배포 완료! 🎉
