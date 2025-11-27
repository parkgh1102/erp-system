# 🚀 보안 개선사항 적용 가이드

**작성일**: 2025-10-30
**소요 시간**: 5분 ~ 2시간 (단계별)

---

## 📁 생성된 파일 목록

### Backend (8개 파일)
```
backend/src/
├── utils/
│   └── safeConsole.ts                          # 안전한 console wrapper
├── middleware/
│   ├── fileUploadSecurity.ts                   # 파일 업로드 보안
│   └── csrfProtection.improved.ts              # 개선된 CSRF 보호
├── constants/
│   └── errorCodes.ts                           # 에러 코드 체계
└── config/
    ├── sessionConfig.improved.ts               # 개선된 세션 설정
    ├── database.improved.ts                    # 개선된 DB 설정
    └── envValidator.improved.ts                # 개선된 환경 변수 검증
```

### Frontend (3개 파일)
```
frontend/
├── vite.config.improved.ts                     # 개선된 Vite 설정
└── src/utils/
    ├── api.improved.ts                         # 개선된 API 유틸리티
    └── errorCodes.ts                           # 에러 코드 (프론트엔드)
```

### 문서 (2개 파일)
```
프로젝트 루트/
├── SECURITY_RECOMMENDATIONS.md                 # 상세 권장사항
└── IMPLEMENTATION_GUIDE.md                     # 이 파일
```

---

## ⚡ 빠른 적용 (5분 - 즉시 효과)

### 1단계: Vite Sourcemap 비활성화

**현재 파일**: `frontend/vite.config.ts`

```bash
# 기존 파일 백업
mv frontend/vite.config.ts frontend/vite.config.old.ts

# 개선된 설정으로 교체
mv frontend/vite.config.improved.ts frontend/vite.config.ts
```

**또는 수동 수정** (1줄):
```typescript
// frontend/vite.config.ts:20
sourcemap: process.env.NODE_ENV !== 'production',  // true → 조건부로 변경
```

**효과**:
- ✅ 프로덕션에서 소스 코드 노출 방지
- ✅ 빌드 속도 향상
- ✅ 번들 크기 감소

---

### 2단계: Session Fallback 제거

**현재 파일**: `backend/src/index.ts:108`

**기존 코드**:
```typescript
secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-this',
```

**개선 코드**:
```typescript
secret: validatedEnv.SESSION_SECRET,  // fallback 제거
```

**또는 전체 교체**:
```typescript
// backend/src/index.ts에서 기존 session 설정 부분을
import { sessionConfig } from './config/sessionConfig.improved';
app.use(session(sessionConfig));
```

**효과**:
- ✅ 약한 시크릿 키 사용 방지
- ✅ 환경 변수 누락 시 즉시 감지

---

## 🔧 단계별 적용 (1-2시간)

### 3단계: Console.log → Logger 변환

#### Option 1: Safe Console 사용 (추천)

**적용 파일 우선순위**:
1. `backend/src/controllers/AuthController.ts`
2. `backend/src/controllers/SalesController.ts`
3. `backend/src/middleware/auth.ts`

**변경 예시**:
```typescript
// 파일 상단에 추가
import safeConsole from '../utils/safeConsole';

// 변경 전
console.log('🔍 Sales getAll - User info:', userInfo);

// 변경 후
safeConsole.log('🔍 Sales getAll - User info:', userInfo);

// 민감 정보가 포함된 경우
safeConsole.sensitive('User info', userInfo); // 자동 마스킹
```

#### Option 2: Logger 직접 사용

```typescript
import { logger } from '../utils/logger';

// 변경 전
console.log('User login:', userId);

// 변경 후
logger.info('User login', { userId });
```

**일괄 변경 스크립트** (선택사항):
```bash
# backend 폴더에서 실행
find src -name "*.ts" -type f -exec sed -i 's/console\.log/safeConsole.log/g' {} +
```

---

### 4단계: 에러 코드 체계 적용

**백엔드 적용 예시**:
```typescript
// backend/src/controllers/AuthController.ts
import { ErrorCodes } from '../constants/errorCodes';

// 변경 전
return res.status(401).json({
  success: false,
  message: '이메일 또는 비밀번호가 틀립니다.'
});

// 변경 후
return res.status(401).json({
  success: false,
  message: '이메일 또는 비밀번호가 틀립니다.',
  code: ErrorCodes.AUTH_INVALID_CREDENTIALS
});
```

**프론트엔드 에러 처리**:
```typescript
// frontend/src/components/Auth/LoginForm.tsx
import { ErrorCodes } from '../../utils/errorCodes';

try {
  await authAPI.login(data);
} catch (error: any) {
  const errorCode = error.response?.data?.code;

  switch (errorCode) {
    case ErrorCodes.AUTH_INVALID_CREDENTIALS:
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      break;
    case ErrorCodes.RATE_LIMIT_AUTH_EXCEEDED:
      setError('로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.');
      break;
    default:
      setError('로그인 중 오류가 발생했습니다.');
  }
}
```

---

### 5단계: 파일 업로드 보안 강화

**기존 라우트 수정** (`backend/src/routes/authRoutes.ts`):
```typescript
// 기존
import multer from 'multer';
const upload = multer({ dest: 'uploads/avatars' });

// 개선
import { avatarUpload } from '../middleware/fileUploadSecurity';

// 라우트 정의
router.post(
  '/upload-avatar',
  authenticateToken,
  avatarUpload.single('avatar'),  // 보안 강화된 미들웨어
  AuthController.uploadAvatar
);
```

**에러 처리 추가**:
```typescript
import { handleUploadError } from '../middleware/fileUploadSecurity';

router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error) {
    const errorResponse = handleUploadError(error);
    return res.status(400).json(errorResponse);
  }
  next();
});
```

---

### 6단계: 개선된 CSRF 보호 적용

**backend/src/index.ts 수정**:
```typescript
// 기존
import { conditionalCsrfProtection, getCsrfToken } from './middleware/csrfProtection';

// 개선
import { improvedCsrfProtection, getCsrfToken } from './middleware/csrfProtection.improved';

// 미들웨어 적용
app.use(improvedCsrfProtection);  // conditionalCsrfProtection 대신
app.get('/api/csrf-token', getCsrfToken);
```

**환경 변수 추가** (`.env.development`):
```bash
# 개발 시 CSRF 보호 비활성화 (선택사항)
# DISABLE_CSRF=true
```

---

## 🏗️ 고급 적용 (선택사항)

### 7단계: Database 설정 개선

```typescript
// backend/src/config/database.ts 대신
import { ImprovedAppDataSource, initializeDatabase } from './config/database.improved';

// backend/src/index.ts에서
async function bootstrap() {
  try {
    await initializeDatabase();  // AppDataSource.initialize() 대신

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
}
```

---

### 8단계: EnvValidator 강화

```typescript
// backend/src/config/envValidator.ts 대신
import { getValidatedEnvImproved } from './config/envValidator.improved';

const env = getValidatedEnvImproved();
```

**시크릿 키 생성**:
```typescript
import { generateSecretKey } from './config/envValidator.improved';

console.log('새 JWT_SECRET:', generateSecretKey(64));
console.log('새 JWT_REFRESH_SECRET:', generateSecretKey(64));
console.log('새 SESSION_SECRET:', generateSecretKey(64));
```

---

### 9단계: 프론트엔드 API 개선

```typescript
// frontend/src/utils/api.ts 대신
import { api, uploadAPI, fileAPI } from './utils/api.improved';

// 일반 API 요청
const response = await api.get('/endpoint');

// 파일 업로드 (재시도 포함)
await fileAPI.uploadAvatar(file);

// 에러 처리
import { handleAPIError } from './utils/api.improved';

try {
  await api.post('/endpoint', data);
} catch (error) {
  const { message } = handleAPIError(error);
  alert(message);
}
```

---

## 📋 적용 체크리스트

### 즉시 적용 (필수)
- [ ] Vite sourcemap 비활성화
- [ ] Session fallback 제거
- [ ] 프로덕션 환경 변수 확인 (FORCE_HTTPS=true)

### 단기 적용 (1주일 이내)
- [ ] Console.log → safeConsole 변환 (우선순위 높은 파일)
- [ ] 에러 코드 체계 도입 (주요 컨트롤러)
- [ ] 파일 업로드 보안 강화

### 중기 적용 (1개월 이내)
- [ ] CSRF 보호 개선
- [ ] Database 설정 최적화
- [ ] EnvValidator 강화

### 장기 적용 (2개월 이내)
- [ ] 모든 console.log 변환 완료
- [ ] 전체 API 에러 코드 적용
- [ ] 보안 모니터링 대시보드 구축

---

## 🔍 적용 후 확인사항

### 1. 빌드 확인
```bash
# Frontend 빌드
cd frontend
npm run build

# dist/assets/*.js.map 파일이 없는지 확인
ls -la dist/assets/*.map  # 파일이 없어야 정상
```

### 2. 환경 변수 검증
```bash
# Backend 실행 시 에러 메시지 확인
cd backend
npm start

# ✅ 정상: "Database connection established"
# ❌ 오류: "환경변수 검증 실패" → .env 파일 확인 필요
```

### 3. 파일 업로드 테스트
```bash
# 큰 파일 업로드 시 에러 메시지 확인
# ✅ 예상: "파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다."
# ✅ 에러 코드: ERR_FILE_001
```

### 4. Console.log 확인
```bash
# 프로덕션 빌드 후 브라우저 콘솔 확인
# ❌ 민감 정보 노출 여부 체크
# ✅ 개발 환경에서만 로그 출력 확인
```

---

## 🆘 문제 해결

### Q1: 기존 코드가 작동하지 않아요
**A**: 기존 파일은 그대로 두고, `.improved` 파일만 사용하세요.

```bash
# 예: database.ts는 그대로 두고
# database.improved.ts만 import 경로 변경
```

### Q2: TypeScript 에러가 발생해요
**A**: 타입 정의 확인
```bash
npm install --save-dev @types/multer
npm install --save-dev @types/express-session
```

### Q3: CSRF 토큰 에러
**A**: 개발 환경에서 비활성화
```bash
# .env.development
DISABLE_CSRF=true
```

### Q4: 파일 업로드 실패
**A**: uploads 폴더 확인
```bash
mkdir -p backend/uploads/avatars
mkdir -p backend/uploads/statements
mkdir -p backend/uploads/documents
chmod 755 backend/uploads
```

---

## 📞 추가 지원

- **보안 권장사항 상세**: `SECURITY_RECOMMENDATIONS.md` 참고
- **에러 코드 전체 목록**: `backend/src/constants/errorCodes.ts` 참고
- **파일별 상세 설명**: 각 파일 상단 주석 확인

---

**🎉 모든 개선사항이 기존 코드를 건드리지 않고 적용 가능합니다!**

필요한 부분만 선택적으로 적용하세요.
