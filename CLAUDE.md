# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고하는 프로젝트 가이드 및 활동 기록입니다.

## 프로젝트 개요

**ERP 통합시스템** — 중소사업체용 회계/거래 관리 ERP. 매출·매입·견적·발주·거래원장·고객·재고·결제 관리와 PDF/엑셀 출력, 국세청 계산서 연동, AI 챗봇을 제공합니다.

- 구조: npm workspaces 모노레포 (`backend`, `frontend`)
- 언어: TypeScript 전체
- 인터페이스/문구: 한국어

## 기술 스택

### Backend (`backend/`)
- Node.js + Express + TypeScript
- TypeORM (개발: SQLite `erp_system_final.db`, 운영: PostgreSQL `pg`)
- 인증: JWT (`jsonwebtoken`) + bcryptjs, 세션/CSRF (`@hapi/crumb`, `csurf`)
- AI 챗봇: `@google/generative-ai` (Gemini)
- 파일: `multer`, `cloudinary`
- 실행: `ts-node-dev` (dev), `tsc` 빌드 후 `node dist/index.js` (prod)

### Frontend (`frontend/`)
- React 18 + TypeScript + Vite
- UI: Ant Design (`antd`), `@ant-design/icons`, `@ant-design/plots`
- 상태관리: Zustand
- 라우팅: React Router v6
- 폼: React Hook Form
- 차트: Chart.js / react-chartjs-2
- 출력: jsPDF + jspdf-autotable, html2canvas, react-to-print, ExcelJS, file-saver
- 보안: DOMPurify
- 테스트: Vitest + Testing Library

## 디렉터리 구조

```
erp0520/
├── backend/src/
│   ├── entities/        # TypeORM 엔티티 (User, Business, Customer, Product,
│   │                    #   Sales, Purchase, Quotation, PurchaseOrder, Payment,
│   │                    #   Transaction, Invoice, Account, Notification 등)
│   ├── controllers/     # 도메인별 컨트롤러 (Sales, Purchase, Quotation,
│   │                    #   transactionLedger, Excel, Chatbot, Dashboard 등)
│   ├── routes/          # Express 라우트
│   ├── services/ middleware/ config/ utils/ constants/ types/
│   └── index.ts         # 서버 엔트리
└── frontend/src/
    ├── components/      # 도메인별 폴더: Auth, Sales, Purchase, Quotation,
    │                    #   PurchaseOrder, Customer, Product, Inventory,
    │                    #   Payment, TransactionLedger, Print, Dashboard,
    │                    #   Chatbot, Settings, Profile, Layout, Common 등
    ├── pages/ hooks/ services/ stores/ utils/ types/ styles/
    └── App.tsx, main.tsx
```

## 개발 명령어

루트에서 실행 (npm workspaces):

```bash
npm run install:all     # 전체 의존성 설치
npm run dev             # backend + frontend 동시 실행 (concurrently)
npm run dev:backend     # 백엔드만
npm run dev:frontend    # 프론트만
npm run build           # 전체 빌드
npm run lint            # 전체 lint
npm run test:frontend   # 프론트 테스트 (Vitest)
npm run test:backend    # 백엔드 테스트 (Jest)
```

백엔드 PostgreSQL 모드: `cd backend && npm run dev:postgres`
DB 마이그레이션: `cd backend && npm run migration:run` / `migration:generate`

## 배포

여러 플랫폼 설정 파일 존재: `vercel.json`(프론트), `railway.json`, `render.yaml`, `azure-deploy.md`/`deploy-azure.ps1`, `amplify.yml`/`deploy-aws.sh`, `Dockerfile`(백엔드).

## 핵심 도메인 / 주의사항

- **거래원장 (TransactionLedger)**: 웹 화면 / 인쇄 / PDF / 엑셀 4가지 출력 경로가 있으며 변경 시 모두 일관되게 반영해야 함. 빈 셀은 '-' 대신 빈칸, 잔액 색상은 양수 파랑 / 음수 빨강.
- **PDF 출력**: 견적서·발주서·거래원장은 벡터 방식 PDF로 전환됨 (jsPDF). 가독성(폰트 크기·대비)과 모바일 줌 화질이 반복 이슈였음.
- **거래명세표 (Print/TransactionStatement.tsx)**: 공급자 주소 줄바꿈, 서명란, 컬럼 폭 관련 조정 빈번.
- **국세청 계산서 엑셀**: 면세계산서 공급가액1 자동 입력, 품목 '농산물 외' 통일 등 포맷 규칙 존재.
- **모바일 대응**: 숫자 입력 `inputMode="numeric"`, Select 드롭다운 위치, 테이블 롱프레스 수정 등.

## 활동 기록 (Activity Log)

> 작업할 때마다 여기에 한 줄씩 추가합니다. (날짜 / 내용)

### 최근 커밋으로 본 작업 내역
- 매입관리 거래처·품목 전체 로드 및 거래명세표 서명란·컬럼 폭 개선
- 거래원장 인쇄 빈셀 회색 배경 제거, 견적서 PDF 벡터 방식 전환
- 국세청 면세계산서 다운로드 시 공급가액1 자동 입력
- 거래원장 인쇄/PDF/엑셀 '-' 표시를 빈칸으로 변경
- 거래원장 수량 컬럼 추가 (웹/인쇄/PDF/엑셀 전체)
- PDF 모바일 줌 화질 개선 (floatPrecision 최대화, 압축 해제)
- 견적서/발주서/거래원장 PDF 가독성·색상 개선
- 매출/매입 테이블 하단 검색결과 합계금액 표시
- 모바일 숫자 키패드, Select 드롭다운, 다크모드 등 UI 개선
- 사업체 정보 수정 즉시 반영, 거래명세표 단독 인쇄 주소 문제 수정

### 2026-06-04
- CLAUDE.md 신규 작성: 프로젝트 가이드 + 활동 기록 체계 수립.

### 2026-06-30
- 설정>사용자관리: 관리자용 "비밀번호 초기화" 버튼/모달 추가(전화번호 뒤 4자리 기본 제안, 로그인 ID 복사), 기존 update API 재사용(백엔드 변경 없음), 테이블 가로 스크롤.
- 로그인 화면 아이디/비번 찾기(PasswordReset) 모바일 최적화: 반응형 패딩, Steps progressDot, 카드 본문 패딩.
- 매출조회(sales_viewer) 모바일 하단 탭바에 '내 정보' 탭 추가(기존엔 더보기가 비어 프로필/로그아웃 동선 부재).
- 거래처 잔액(getCustomerBalance) 404 해결: 거래처 마스터가 삭제된 고아 매출/매입도 매출·매입·수금 데이터로 잔액 계산하도록 404 제거(fallback 이름 '(삭제된 거래처)'). 프론트(Sales/Purchase) 전잔금 조회는 4xx 재시도 중단·404는 0 처리로 인쇄 차단 방지.
- 로그인 화면 '찾으러가기'를 버튼화(아이디/비밀번호 찾기). 사용자(매출조회) 셀프 비번 재설정 흐름 신설: POST /auth/request-phone-reset(전화번호→OTP), resetPassword 역할별 검증(sales_viewer 4자리 허용), PasswordReset에 관리자/사용자 모드 토글(전화번호→OTP→4자리).
- 사용자 생성 시 전화번호 중복 에러 메시지 구체화: 본인 관리자 번호/내 사업장 등록 계정(회사명·이름·역할)/외부 계정을 구분 안내(전역 유일성 검사는 유지).
- sales_viewer 모바일 추가 개선: (1) getProfile이 다중 접근 사업장 모두 반환하도록 수정 + Profile 진입 시 setAuth→updateUser로 변경해 상단 사업장 선택기가 사라지던 문제 해결, (2) 헤더 사용자 이름이 한 글자씩 세로로 줄바꿈되던 것 whiteSpace:nowrap + 사업장 Select 폭 제한으로 수정, (3) 거래처 잔액(/customer-balance)을 sales_viewer 메뉴·하단탭에 노출, (4) 거래원장 모바일 컬럼 폭 축소(요약 행 정렬 유지 위해 컬럼 숨김 대신 폭만 축소).

### 2026-06-25
- 검색바 회전 무지개 그라데이션 테두리 제거(AnimatedSearchBar).
- 미수금/미지급 현황(CustomerBalance) 샘플 데이터 → 실제 API 연동. 매출·매입·수금·지급으로 거래처별 잔액 계산.
- 미수금 연령분석(Aging) 구현: 수금액 FIFO 차감 후 0~30/31~60/61~90/90일 초과 구간 분포 + 경과일수. 계산 로직을 `utils/receivableAging.ts`로 분리하고 Vitest 테스트 12종 작성(첫 테스트 도입, setup.ts 추가).
