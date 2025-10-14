# 🔒 ERP 시스템 보안 가이드

## 개요
이 문서는 ERP 시스템의 보안 설정 및 운영 가이드입니다.

## 🚀 운영환경 배포 전 체크리스트

### 1. 환경 변수 설정
- [ ] `.env.production` 파일의 `JWT_SECRET` 변경
- [ ] 강력한 데이터베이스 비밀번호 설정 (8자 이상, 특수문자 포함)
- [ ] `NODE_ENV=production` 설정 확인
- [ ] CORS 설정에서 운영 도메인만 허용

### 2. 파일 권한 설정
```bash
# 데이터베이스 파일 권한
chmod 600 backend/database/erp_system.db

# 로그 디렉토리 권한
chmod 755 backend/logs/
chmod 644 backend/logs/*.log

# 환경 변수 파일 권한
chmod 600 backend/.env*
```

### 3. 방화벽 설정
- [ ] 필요한 포트만 개방 (기본: 3001)
- [ ] SSH 포트 변경 (기본 22 → 다른 포트)
- [ ] 불필요한 서비스 비활성화

### 4. SSL/TLS 설정
- [ ] HTTPS 인증서 설치
- [ ] HTTP → HTTPS 리다이렉션 설정
- [ ] HSTS 헤더 활성화 (이미 구현됨)

## 🛡️ 보안 기능

### 인증 및 권한
- **JWT 토큰**: 24시간 만료, 256bit 비밀키
- **비밀번호 해싱**: bcrypt (rounds: 12/14)
- **Rate Limiting**:
  - 일반 API: 15분/100회
  - 인증 API: 15분/10회
  - 실시간 API: 1분/100회

### 보안 헤더
- **CSP**: Content Security Policy 설정
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: 클릭재킹 방지
- **X-Content-Type-Options**: MIME 타입 스니핑 방지

### 입력 검증
- **Joi 스키마**: 모든 입력값 검증
- **SQL 파라미터화**: SQL 인젝션 방지
- **XSS 필터링**: 자동 탐지 및 로깅

### 보안 로깅
로그 파일 위치: `backend/logs/security.log`
- 로그인 실패/성공
- Rate limit 초과
- 의심스러운 활동 감지
- 시스템 오류

## 📊 모니터링

### 보안 이벤트 모니터링
```bash
# 실시간 보안 로그 모니터링
tail -f backend/logs/security.log

# 최근 인증 실패 확인
grep "AUTH_FAILURE" backend/logs/security.log | tail -20

# Rate limit 초과 확인
grep "RATE_LIMIT" backend/logs/security.log | tail -10
```

### 정기 보안 점검
```bash
# 패키지 취약점 점검
npm audit

# 코드 품질 점검
npm run security:check
```

## 보안 테스트 자동화

### 사용 가능한 보안 스크립트

#### 백엔드 보안 스크립트 (`backend/package.json`)
```bash
# 보안 감사 (중간 수준 이상의 취약점 검사)
npm run security:audit

# 보안 검사 (감사 + 린트)
npm run security:check

# 자동 보안 수정
npm run security:fix
```

#### 프론트엔드 보안 스크립트 (`frontend/package.json`)
```bash
# 보안 감사 (중간 수준 이상의 취약점 검사)
npm run security:audit

# 보안 검사 (감사 + 린트)
npm run security:check

# 자동 보안 수정
npm run security:fix
```

#### 루트 보안 스크립트 (전체 프로젝트)
```bash
# 전체 워크스페이스 보안 감사
npm run security:audit

# 전체 워크스페이스 보안 검사
npm run security:check

# 전체 워크스페이스 자동 보안 수정
npm run security:fix
```

### 보안 점검 체크리스트

#### 배포 전 필수 점검
- [ ] `npm run security:check` 실행 및 통과
- [ ] JWT_SECRET 환경변수 설정 확인
- [ ] HTTPS 활성화 확인
- [ ] CSRF 보호 활성화 확인
- [ ] Rate Limiting 설정 확인
- [ ] 프로덕션 소스맵 비활성화 확인
- [ ] 환경변수 파일(.env) git 제외 확인

#### 정기 점검 (주 1회)
- [ ] `npm audit` 실행
- [ ] 의존성 업데이트 확인
- [ ] 로그 검토

#### 보안 사고 대응 절차
1. 즉시 영향받은 시스템 격리
2. 로그 수집 및 분석
3. JWT Secret 재발급
4. 사용자 패스워드 재설정 안내

## 🚨 보안 사고 대응

### 1. 의심스러운 활동 감지시
1. 즉시 해당 IP 차단
2. 사용자 계정 임시 비활성화
3. 보안 로그 백업
4. 관리자에게 알림

### 2. 데이터 유출 의심시
1. 즉시 서비스 중단
2. 데이터베이스 백업
3. 포렌식 조사 준비
4. 법적 요구사항 확인

### 3. 시스템 복구
1. 취약점 패치
2. 비밀번호 초기화
3. JWT 시크릿 키 변경
4. 전체 시스템 재시작

## 📞 보안 연락처
- 보안팀: security@example.com
- 시스템 관리자: [관리자 연락처]
- 보안 담당자: [보안 담당자 연락처]
- 긴급 상황: [긴급 연락처]

## 📝 업데이트 이력
- 2024-09-26: 초기 보안 설정 완료
- 보안 강화 항목 추가
- 로깅 시스템 구축