# Render 자동 배포 가이드

이 프로젝트는 Render를 통해 자동으로 배포됩니다.

## 자동 배포 설정 방법

### 1. Render 계정 생성
1. [Render](https://render.com/)에 접속
2. GitHub 계정으로 로그인

### 2. GitHub 저장소 연결
1. Render 대시보드에서 "New +" 클릭
2. "Blueprint" 선택
3. GitHub 저장소 연결: `parkgh1102/erp-system`
4. `render.yaml` 파일이 자동으로 감지됨

### 3. 환경 변수 확인
다음 환경 변수가 자동으로 생성됩니다:
- `NODE_ENV`: production
- `PORT`: 3001
- `DB_TYPE`: postgres
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`: 자동 생성된 PostgreSQL 데이터베이스 정보
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`: 자동 생성
- `FRONTEND_URL`: https://webapperp.ai.kr

### 4. 추가 설정이 필요한 환경 변수
Render 대시보드에서 다음 환경 변수를 수동으로 추가해야 합니다:

```bash
# 이메일 전송 (선택사항)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# 파일 업로드 (선택사항)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# 알림톡 (선택사항)
ALIMTALK_PROFILE_KEY=your-profile-key
ALIMTALK_REST_API_KEY=your-rest-api-key

# Gemini AI (챗봇, 선택사항)
GEMINI_API_KEY=your-gemini-api-key
```

## 자동 배포 프로세스

### Git Push로 자동 배포
```bash
# 코드 수정 후
git add .
git commit -m "Fix: 버그 수정"
git push origin master

# Render가 자동으로 감지하고 배포 시작
```

### 배포 단계
1. GitHub에 코드 푸시
2. Render가 자동으로 변경사항 감지
3. 빌드 시작:
   - `npm install` (의존성 설치)
   - `npm run build` (TypeScript 컴파일)
4. 서비스 재시작
5. Health Check (`/api/health`)
6. 배포 완료

### 배포 상태 확인
1. Render 대시보드 접속
2. "erp-backend" 서비스 클릭
3. "Events" 탭에서 배포 로그 확인

## 롤백 방법

### 이전 버전으로 롤백
```bash
# Git에서 이전 커밋으로 되돌리기
git log --oneline  # 커밋 히스토리 확인
git reset --hard <commit-hash>
git push -f origin master

# 또는 Render 대시보드에서 수동 롤백
```

## 데이터베이스 마이그레이션

### 자동 마이그레이션
- `DB_SYNCHRONIZE=true`로 설정되어 있어 스키마가 자동으로 동기화됩니다.
- 프로덕션 환경에서는 주의가 필요합니다!

### 수동 마이그레이션 (권장)
1. Render Shell 접속
2. 마이그레이션 실행:
```bash
npm run migration:run
```

## 로그 확인

### 실시간 로그 보기
1. Render 대시보드
2. "erp-backend" 서비스
3. "Logs" 탭

### 로그 레벨
- `INFO`: 일반 정보
- `WARN`: 경고
- `ERROR`: 오류

## 트러블슈팅

### 배포 실패 시
1. Render 로그 확인
2. 환경 변수 확인
3. 빌드 로그에서 에러 메시지 확인

### 데이터베이스 연결 실패
1. PostgreSQL 서비스 상태 확인
2. 환경 변수 확인 (DB_HOST, DB_PORT 등)
3. 네트워크 설정 확인

### 메모리 부족
- Free 플랜은 512MB 메모리 제한
- 필요시 Starter 플랜으로 업그레이드

## 성능 최적화

### 빌드 캐시
- Node.js 의존성 캐싱 활성화됨
- 빌드 시간 단축

### Health Check
- `/api/health` 엔드포인트로 서비스 상태 모니터링
- 30초마다 자동 확인

## 비용

### Free 플랜
- 백엔드: $0/월
- PostgreSQL: $0/월 (90일간 무료)
- 제한사항:
  - 15분 무활동 시 슬립 모드
  - 750시간/월 사용 가능
  - 공유 CPU/메모리

### Starter 플랜 (권장)
- 백엔드: $7/월
- PostgreSQL: $7/월
- 슬립 모드 없음
- 전용 리소스

## 참고 링크

- [Render 문서](https://render.com/docs)
- [Blueprint 스펙](https://render.com/docs/blueprint-spec)
- [환경 변수 관리](https://render.com/docs/configure-environment-variables)
- [데이터베이스 관리](https://render.com/docs/databases)

## 문의
- GitHub Issues: https://github.com/parkgh1102/erp-system/issues
