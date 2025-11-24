# 🚀 ERP 시스템 배포 가이드 (Vercel + Render)

## 📋 배포 구조

```
┌─────────────────────────────────────────────────────────┐
│                    가비아 도메인                          │
│              webapperp.ai.kr (프론트엔드)                 │
│              api.webapperp.ai.kr (백엔드)                 │
└───────────────┬─────────────────────┬───────────────────┘
                │                     │
       ┌────────▼────────┐   ┌────────▼────────┐
       │     Vercel      │   │     Render      │
       │   (Frontend)    │   │   (Backend)     │
       │   React + Vite  │   │  Express + API  │
       └─────────────────┘   └────────┬────────┘
                                      │
                             ┌────────▼────────┐
                             │  Render DB      │
                             │  PostgreSQL     │
                             └─────────────────┘
```

---

## 📦 Step 1: GitHub 저장소 준비

```bash
# 1. GitHub에 저장소 생성 후
git init
git add .
git commit -m "Initial commit: ERP System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/erp-system.git
git push -u origin main
```

---

## 🗄️ Step 2: Render 백엔드 + DB 배포

### 2-1. Render 계정 생성
1. https://render.com 접속
2. GitHub 계정으로 가입

### 2-2. Blueprint로 자동 배포 (추천)
1. Render 대시보드 → **New** → **Blueprint**
2. GitHub 저장소 연결
3. `render.yaml` 자동 감지 → **Apply**
4. 약 5-10분 후 배포 완료

### 2-3. 수동 배포 (Blueprint 사용 안 할 경우)

#### PostgreSQL 데이터베이스 생성
1. **New** → **PostgreSQL**
2. 설정:
   - Name: `erp-database`
   - Database: `erp_system`
   - User: `erp_user`
   - Region: `Singapore` (한국과 가까움)
   - Plan: `Free`
3. **Create Database** 클릭

#### Backend Web Service 생성
1. **New** → **Web Service**
2. GitHub 저장소 연결
3. 설정:
   - Name: `erp-backend`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: `Free`

4. **Environment Variables** 추가:
   ```
   NODE_ENV=production
   PORT=3001
   DB_TYPE=postgres
   DB_HOST=(PostgreSQL에서 복사)
   DB_PORT=5432
   DB_USERNAME=erp_user
   DB_PASSWORD=(PostgreSQL에서 복사)
   DB_DATABASE=erp_system
   JWT_SECRET=(Generate 클릭)
   JWT_REFRESH_SECRET=(Generate 클릭)
   SESSION_SECRET=(Generate 클릭)
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   BCRYPT_ROUNDS=12
   FRONTEND_URL=https://webapperp.ai.kr
   ```

5. **Create Web Service** 클릭

### 2-4. 배포 완료 확인
- Backend URL: `https://erp-backend.onrender.com`
- Health Check: `https://erp-backend.onrender.com/api/health`

---

## ⚡ Step 3: Vercel 프론트엔드 배포

### 3-1. Vercel 계정 생성
1. https://vercel.com 접속
2. GitHub 계정으로 가입

### 3-2. 프로젝트 배포
1. **New Project** → GitHub 저장소 선택
2. 설정:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables** 추가:
   ```
   VITE_API_URL=https://erp-backend.onrender.com/api
   VITE_ENFORCE_HTTPS=true
   VITE_APP_ENV=production
   ```

4. **Deploy** 클릭

### 3-3. 배포 완료 확인
- Frontend URL: `https://your-project.vercel.app`

---

## 🌐 Step 4: 가비아 도메인 연결 (webapperp.ai.kr)

### 4-1. Vercel에 커스텀 도메인 추가 (프론트엔드)

1. Vercel 대시보드 → 프로젝트 → **Settings** → **Domains**
2. `webapperp.ai.kr` 입력 → **Add**
3. 표시되는 DNS 레코드 확인

### 4-2. 가비아 DNS 설정 (프론트엔드)

1. 가비아 로그인 → **My가비아** → **DNS 관리**
2. `webapperp.ai.kr` 도메인 선택 → **DNS 설정**
3. 기존 레코드 삭제 후 새로 추가:

   **A 레코드 (루트 도메인)**
   ```
   호스트: @
   타입: A
   값: 76.76.21.21
   TTL: 600
   ```

   **CNAME 레코드 (www)**
   ```
   호스트: www
   타입: CNAME
   값: cname.vercel-dns.com
   TTL: 600
   ```

### 4-3. Render에 커스텀 도메인 추가 (백엔드)

1. Render 대시보드 → `erp-backend` → **Settings** → **Custom Domains**
2. `api.webapperp.ai.kr` 입력 → **Add Custom Domain**
3. 표시되는 DNS 레코드 확인

### 4-4. 가비아 DNS 설정 (백엔드 API)

1. 가비아 DNS 설정으로 이동
2. CNAME 레코드 추가:
   ```
   호스트: api
   타입: CNAME
   값: erp-backend.onrender.com
   TTL: 600
   ```

### 4-5. SSL 인증서
- Vercel과 Render 모두 **자동으로 SSL 인증서 발급**
- 도메인 연결 후 약 10-30분 대기

---

## ⚙️ Step 5: 환경변수 최종 업데이트

### Render (Backend)
```
FRONTEND_URL=https://webapperp.ai.kr
```

### Vercel (Frontend)
```
VITE_API_URL=https://api.webapperp.ai.kr/api
```

> **중요**: 도메인 연결 완료 후 Vercel 환경변수를 업데이트하고 재배포해야 합니다.

---

## 📋 가비아 DNS 설정 요약

| 호스트 | 타입 | 값 | 용도 |
|--------|------|-----|------|
| @ | A | 76.76.21.21 | 프론트엔드 (Vercel) |
| www | CNAME | cname.vercel-dns.com | www 리다이렉트 |
| api | CNAME | erp-backend.onrender.com | 백엔드 API (Render) |

---

## ✅ Step 6: 배포 확인 체크리스트

- [ ] Backend Health Check: `https://api.webapperp.ai.kr/api/health`
- [ ] Frontend 접속: `https://webapperp.ai.kr`
- [ ] 로그인 테스트
- [ ] 데이터 CRUD 테스트
- [ ] HTTPS 적용 확인 (자물쇠 아이콘)

---

## 🔧 문제 해결

### 1. CORS 에러
- Backend `FRONTEND_URL` 환경변수가 `https://webapperp.ai.kr`인지 확인
- Render 서비스 재시작

### 2. 502 Bad Gateway
- Render 무료 플랜은 15분 비활성 시 슬립
- 첫 요청 시 30초~1분 대기 필요

### 3. 데이터베이스 연결 실패
- Render PostgreSQL 연결 정보 재확인
- DB_HOST, DB_PASSWORD 확인

### 4. 도메인 SSL 에러
- DNS 전파에 최대 48시간 소요 가능
- 보통 10-30분 내 완료
- `nslookup webapperp.ai.kr`로 DNS 확인

### 5. API 호출 실패
- Vercel 환경변수 `VITE_API_URL` 확인
- 브라우저 개발자 도구 Network 탭에서 요청 URL 확인

---

## 💰 비용 요약

| 서비스 | 플랜 | 월 비용 |
|--------|------|---------|
| Vercel | Hobby | **무료** |
| Render Web Service | Free | **무료** |
| Render PostgreSQL | Free | **무료** (90일) |
| 가비아 도메인 (webapperp.ai.kr) | - | 연 1-2만원 |

**총 예상 비용: 연 1-2만원 (도메인만)**

> ⚠️ **주의**: Render PostgreSQL 무료 플랜은 90일 후 만료됩니다.
> 지속 사용 시 $7/월 또는 Supabase/Neon 등 무료 대안 고려

---

## 🚀 프로덕션 권장 설정 (향후)

1. **Render Pro** ($7/월): 슬립 없이 항상 활성화
2. **Supabase**: 무료 PostgreSQL (500MB, 무제한)
3. **Neon**: 무료 PostgreSQL (3GB, Serverless)
4. **Cloudflare**: 추가 CDN 및 보안

---

## 📞 빠른 배포 순서

1. **GitHub Push** → 저장소에 코드 올리기
2. **Render 배포** → Blueprint로 Backend + DB 배포
3. **Render URL 확인** → `https://erp-backend.onrender.com`
4. **Vercel 배포** → Frontend 배포 + 환경변수 설정
5. **가비아 DNS** → A, CNAME 레코드 설정
6. **최종 확인** → `https://webapperp.ai.kr` 접속 테스트
