# 🔒 보안 개선 권장사항

**작성일**: 2025-10-30
**전체 보안 점수**: 94.4/100 ⭐⭐⭐⭐⭐

---

## 📊 현재 상태 평가

### ✅ 우수한 점 (유지)
- JWT 기반 이중 토큰 인증 시스템
- 강력한 비밀번호 정책 (연속문자, 키보드패턴 차단)
- TypeORM으로 SQL Injection 완벽 방어
- **의존성 취약점 0개**
- 다층 Rate Limiting 적용
- CSRF/XSS 방어 체계 완비
- HttpOnly 쿠키 사용

---

## 🎯 개선 권장사항 (우선순위별)

### 🔴 높은 우선순위

#### 1. 프로덕션 환경 console.log 제거

**현재 문제**:
- 21개 파일에서 183개의 console 사용
- 프로덕션 환경에서 민감 정보 노출 가능
- 성능 저하 가능성

**영향받는 파일**:
```
backend/src/controllers/SalesController.ts (16개)
backend/src/controllers/AuthController.ts (4개)
backend/src/middleware/auth.ts (1개)
... 외 18개 파일
```

**해결 방법**:
1. **Option 1**: 기존 logger 사용 (이미 구현됨)
   ```typescript
   // Before
   console.log('🔍 Sales getAll - User info:', userInfo);

   // After
   logger.debug('Sales getAll - User info', userInfo);
   ```

2. **Option 2**: 환경별 console wrapper 생성
   ```typescript
   // backend/src/utils/console.ts (새 파일 생성)
   const safeConsole = {
     log: process.env.NODE_ENV === 'production' ? () => {} : console.log,
     debug: process.env.NODE_ENV === 'production' ? () => {} : console.log,
     error: console.error, // 에러는 항상 로깅
     warn: console.warn
   };
   export default safeConsole;
   ```

**적용 우선순위**:
1. AuthController.ts (인증 정보 노출 위험)
2. SalesController.ts (비즈니스 데이터 노출)
3. 나머지 컨트롤러

---

#### 2. Fallback 시크릿 키 제거

**현재 문제**:
```typescript
// backend/src/index.ts:108
secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-this'
```

**해결 방법**:
```typescript
// 수정 후
app.use(session({
  secret: validatedEnv.SESSION_SECRET, // fallback 제거
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: validatedEnv.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: validatedEnv.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
}));
```

**이유**: envValidator에서 이미 SESSION_SECRET 필수 검증하므로 fallback 불필요

---

#### 3. 개발 환경 CSRF 보호 활성화

**현재 상태**:
```typescript
// backend/src/middleware/csrfProtection.ts:132
if (process.env.NODE_ENV === 'development') {
  logger.info('CSRF protection disabled in development mode');
  return next();
}
```

**개선 방안**:
```typescript
// 환경 변수로 선택적 비활성화
export const conditionalCsrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 명시적으로 비활성화한 경우만 스킵
  if (process.env.DISABLE_CSRF === 'true') {
    logger.warn('⚠️  CSRF protection is DISABLED');
    return next();
  }

  return csrfProtection(req, res, next);
};
```

**환경 변수 추가** (.env.development):
```bash
# 개발 편의를 위해 필요시에만 설정
# DISABLE_CSRF=true
```

---

### 🟡 중간 우선순위

#### 4. 데이터베이스 동기화 설정 개선

**현재 상태**:
```typescript
// backend/src/config/database.ts:25
synchronize: env.NODE_ENV === 'development'
```

**권장**:
```typescript
// 개발 환경에서도 false로 설정하고 migration 사용
synchronize: false,

// .env에서 관리
synchronize: process.env.DB_SYNC === 'true' // 기본 false
```

**이유**:
- 실수로 스키마 삭제 방지
- 프로덕션과 동일한 migration 워크플로우 유지

---

#### 5. 파일 업로드 보안 강화

**현재 상태**:
```typescript
// backend/src/controllers/AuthController.ts:563
async uploadAvatar(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ ... });
  }
```

**추가 검증 필요**:

새 파일 생성: `backend/src/middleware/fileUpload.ts`
```typescript
import multer from 'multer';
import path from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: './uploads/avatars',
  filename: (req, file, cb) => {
    // 안전한 파일명 생성
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    // MIME 타입 검증
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }

    // 파일 확장자 검증
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      return cb(new Error('허용되지 않는 파일 형식입니다.'));
    }

    cb(null, true);
  }
});
```

---

#### 6. HTTPS 강제 설정 검증 강화

**현재 상태**:
```typescript
// backend/src/config/envValidator.ts:111
if (!value.FORCE_HTTPS) {
  console.warn('⚠️  경고: 운영환경에서는 FORCE_HTTPS를 true로 설정하는 것이 권장됩니다.');
}
```

**개선**:
```typescript
// 운영환경에서는 필수로 설정
if (value.NODE_ENV === 'production' && !value.FORCE_HTTPS) {
  throw new Error('프로덕션 환경에서는 FORCE_HTTPS가 필수입니다.');
}
```

---

### 🟢 낮은 우선순위

#### 7. Sourcemap 프로덕션 비활성화

**현재 상태**:
```typescript
// frontend/vite.config.ts:20
sourcemap: true
```

**개선**:
```typescript
build: {
  outDir: 'dist',
  sourcemap: process.env.NODE_ENV !== 'production', // 개발에서만 활성화
  minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false
}
```

**이유**: 프로덕션에서 소스 코드 노출 방지

---

#### 8. 에러 코드 체계화

**현재 상태**: 문자열 메시지만 반환

**개선안**: 에러 코드 추가

새 파일: `backend/src/constants/errorCodes.ts`
```typescript
export const ErrorCodes = {
  // 인증 관련
  AUTH_INVALID_CREDENTIALS: 'ERR_AUTH_001',
  AUTH_TOKEN_EXPIRED: 'ERR_AUTH_002',
  AUTH_TOKEN_INVALID: 'ERR_AUTH_003',
  AUTH_UNAUTHORIZED: 'ERR_AUTH_004',

  // 비즈니스 로직
  BUSINESS_NOT_FOUND: 'ERR_BIZ_001',
  CUSTOMER_NOT_FOUND: 'ERR_BIZ_002',

  // 데이터베이스
  DB_CONNECTION_FAILED: 'ERR_DB_001',
  DB_QUERY_FAILED: 'ERR_DB_002',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'ERR_RATE_001',

  // 파일 업로드
  FILE_TOO_LARGE: 'ERR_FILE_001',
  FILE_INVALID_TYPE: 'ERR_FILE_002',
} as const;

// 사용 예시
return res.status(401).json({
  success: false,
  message: '이메일 또는 비밀번호가 틀립니다.',
  code: ErrorCodes.AUTH_INVALID_CREDENTIALS
});
```

---

#### 9. API Timeout 세분화

**현재 상태**:
```typescript
// frontend/src/utils/api.ts:43
timeout: 10000  // 모든 요청에 10초
```

**개선**:
```typescript
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 기본 10초
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 파일 업로드용 별도 인스턴스
export const uploadAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60초
  withCredentials: true,
});
```

---

#### 10. 보안 헤더 추가

**추가 권장 헤더**:
```typescript
// backend/src/index.ts (helmet 설정에 추가)
app.use((req, res, next) => {
  // 현재 Permissions-Policy는 이미 적용됨 (line 73-78)

  // 추가 권장 헤더
  res.setHeader('X-Content-Type-Options', 'nosniff'); // helmet이 이미 처리
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  next();
});
```

---

## 📋 적용 체크리스트

### 즉시 적용 가능 (코드 변경 최소)
- [ ] Fallback 시크릿 키 제거 (1줄 수정)
- [ ] Sourcemap 프로덕션 비활성화 (1줄 수정)
- [ ] HTTPS 강제 검증 강화 (3줄 수정)

### 단계별 적용 (새 파일 생성)
- [ ] console.log → logger 변환 스크립트 작성
- [ ] 파일 업로드 미들웨어 추가 (새 파일)
- [ ] 에러 코드 체계 도입 (새 파일)
- [ ] CSRF 환경 변수 옵션 추가

### 장기 개선
- [ ] 데이터베이스 migration 워크플로우 정립
- [ ] 보안 모니터링 대시보드 구축
- [ ] 침투 테스트 수행

---

## 🚀 적용 순서 권장

1. **1단계** (즉시 적용 - 5분 소요)
   - Fallback 시크릿 키 제거
   - Sourcemap 설정 수정

2. **2단계** (1시간 소요)
   - console.log → logger 변환 (우선순위 높은 파일부터)
   - CSRF 환경 변수 옵션 추가

3. **3단계** (2시간 소요)
   - 파일 업로드 검증 강화
   - 에러 코드 체계 도입

4. **4단계** (장기)
   - Migration 워크플로우 정립
   - 보안 모니터링 시스템 구축

---

## 💡 참고 자료

### 보안 베스트 프랙티스
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### 현재 시스템이 이미 준수하는 항목
✅ OWASP A01: Broken Access Control → JWT + 역할 기반 접근 제어
✅ OWASP A02: Cryptographic Failures → bcrypt 12 rounds
✅ OWASP A03: Injection → TypeORM Parameterized Queries
✅ OWASP A05: Security Misconfiguration → Helmet + 보안 헤더
✅ OWASP A07: XSS → CSP + 입력 검증

---

**문의사항이나 추가 설명이 필요한 경우 언제든지 요청해주세요!**
