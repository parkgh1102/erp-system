# 🏢 ERP 통합시스템

## 📋 프로젝트 개요
중소기업을 위한 현대적이고 사용자 친화적인 웹 기반 ERP 통합 솔루션입니다.

## ✨ 주요 기능

### 🔐 인증 시스템
- **회원가입**: 개인정보 + 사업자정보 2단계 가입
- **로그인**: 이메일/비밀번호 기반 JWT 인증
- **사업자번호 검증**: 실시간 사업자등록번호 유효성 검사
- **보안**: BCrypt 해싱, JWT 토큰 관리

### 📊 메인 대시보드
- **실시간 통계**: 매출/매입/거래처/품목 현황
- **차트 시각화**: 월별 매출 추이, 카테고리별 분석
- **빠른 작업**: 매출전표, 매입전표, 거래처 등록 버튼
- **최근 거래**: 최신 거래 내역 테이블

### 👥 거래처 관리
- **CRUD 기능**: 거래처 등록/수정/삭제/조회
- **분류 관리**: 매출처/매입처/기타 구분
- **검색 기능**: 이름, 사업자번호 검색
- **페이지네이션**: 효율적인 데이터 로딩

### 📦 품목 관리
- **상품 등록**: 품목명, 단가, 규격, 단위 관리
- **품목코드**: 자동/수동 코드 부여
- **재고 추적**: 수량 및 단가 이력 관리
- **카테고리**: 품목별 분류 시스템

### 💰 매출/매입 관리
- **전표 작성**: 세금계산서 기반 거래 입력
- **자동 계산**: 공급가액, 세액, 합계 자동 계산
- **거래 유형**: 매출/매입 구분 관리
- **승인 워크플로**: 전표 승인 프로세스

### 💳 수금/지급 관리
- **채권 관리**: 미수금 현황 및 수금 처리
- **채무 관리**: 미지급금 현황 및 지급 처리
- **결제 수단**: 현금, 카드, 계좌이체 등
- **만기일 관리**: 수금/지급 예정일 추적

### 📈 거래원장
- **거래처별 원장**: 개별 거래처 거래 이력
- **기간별 조회**: 일/월/분기/연 단위 조회
- **잔액 관리**: 채권/채무 잔액 추적
- **엑셀 내보내기**: 원장 데이터 Excel 다운로드

### 🎨 UI/UX 특징
- **다크/라이트 모드**: 테마 전환 지원
- **반응형 디자인**: 모바일/태블릿/데스크톱 최적화
- **토스트 알림**: 사용자 친화적 알림 시스템
- **Ant Design**: 일관성 있는 UI 컴포넌트

### 📄 인쇄/내보내기
- **PDF 생성**: 전표, 원장 PDF 출력
- **Excel 내보내기**: 데이터 Excel 파일 다운로드
- **이미지 저장**: JPG, PNG 형식 이미지 내보내기
- **클립보드**: 데이터 클립보드 복사

## 🛠️ 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Ant Design 5** - UI 컴포넌트
- **Zustand** - 상태 관리
- **Chart.js** + **React-ChartJS-2** - 차트
- **Axios** - HTTP 클라이언트
- **React Router Dom** - 라우팅
- **Day.js** - 날짜 처리
- **Vite** - 빌드 도구

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **TypeORM** - ORM
- **SQLite** (개발) / **MySQL** (운영) - 데이터베이스
- **JWT** - 인증
- **BCrypt** - 비밀번호 해싱
- **Joi** - 데이터 검증
- **Helmet** - 보안
- **Morgan** - 로깅

### 개발 도구
- **ESLint** + **Prettier** - 코드 품질
- **Concurrently** - 동시 실행
- **Nodemon** - 자동 재시작
- **Git** - 버전 관리

## 🚀 설치 및 실행

### 전체 설치
```bash
npm run install:all
```

### 개발 서버 실행 (프론트엔드 + 백엔드 동시)
```bash
npm run dev
```

### 개별 실행
```bash
# 백엔드만 실행
npm run dev:backend

# 프론트엔드만 실행
npm run dev:frontend
```

### 프로덕션 빌드
```bash
npm run build
npm start
```

## 📁 프로젝트 구조

```
erp-system/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   │   ├── Auth/        # 로그인/회원가입
│   │   │   ├── Dashboard/   # 대시보드
│   │   │   └── Layout/      # 레이아웃
│   │   ├── stores/          # Zustand 상태 관리
│   │   ├── utils/           # 유틸리티 함수
│   │   └── types/           # TypeScript 타입
│   ├── public/              # 정적 파일
│   └── package.json
├── backend/                  # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/     # API 컨트롤러
│   │   ├── entities/        # TypeORM 엔티티
│   │   ├── routes/          # Express 라우트
│   │   ├── middleware/      # 미들웨어
│   │   ├── config/          # 설정 파일
│   │   └── utils/           # 유틸리티
│   └── package.json
├── package.json              # 루트 패키지
└── README.md
```

## 🗄️ 데이터베이스 스키마

### 주요 테이블
- **users** - 사용자 계정
- **businesses** - 사업자 정보
- **customers** - 거래처 정보
- **products** - 품목 정보
- **transactions** - 거래 내역
- **transaction_items** - 거래 품목 상세
- **payments** - 수금/지급 내역
- **invoices** - 전자계산서
- **accounts** - 계정과목
- **notes** - 메모/노트
- **company_settings** - 회사별 설정

## 🔧 환경 설정

### Backend (.env)
```
NODE_ENV=development
PORT=3001
JWT_SECRET=your-jwt-secret-key
DB_PATH=./entax_web.db
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=ERP 통합시스템
VITE_APP_VERSION=1.0.0
```

## 📡 API 엔드포인트

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/profile` - 프로필 조회
- `PUT /api/auth/profile` - 프로필 수정

### 거래처 관리
- `GET /api/business/:businessId/customers` - 거래처 목록
- `POST /api/business/:businessId/customers` - 거래처 등록
- `PUT /api/business/:businessId/customers/:id` - 거래처 수정
- `DELETE /api/business/:businessId/customers/:id` - 거래처 삭제

### 품목 관리
- `GET /api/business/:businessId/products` - 품목 목록
- `POST /api/business/:businessId/products` - 품목 등록
- `PUT /api/business/:businessId/products/:id` - 품목 수정
- `DELETE /api/business/:businessId/products/:id` - 품목 삭제

## 🔐 보안 특징

- **JWT 토큰** 기반 인증
- **BCrypt** 비밀번호 해싱 (솔트 라운드 12)
- **Helmet.js** HTTP 보안 헤더
- **CORS** 설정으로 출처 제한
- **입력 검증** Joi 라이브러리 사용
- **SQL 인젝션** 방지 (TypeORM)
- **XSS 공격** 방지

## 📱 반응형 지원

- **데스크톱**: 1200px 이상 최적화
- **태블릿**: 768px - 1199px 적응형 레이아웃
- **모바일**: 767px 이하 모바일 최적화
- **접근성**: WCAG 2.1 가이드라인 준수

## 🎯 성능 최적화

- **코드 스플리팅**: React.lazy + Suspense
- **메모이제이션**: useMemo, useCallback 활용
- **가상화**: 대용량 리스트 가상 스크롤
- **이미지 최적화**: WebP 포맷 지원
- **번들 최적화**: Tree shaking, 압축

## 📞 지원 및 문의

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **이메일**: support@erp-system.com
- **문서**: [ERP 통합시스템 사용자 가이드](https://docs.erp-system.com)

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 기여하기

1. 저장소 Fork
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

---

**ERP 통합시스템** - 중소기업을 위한 스마트 회계 솔루션 💼