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

### 2026-07-03
- 매출조회 페이지네이션을 Instagram "Track"(슬라이더형) 스타일로 교체. 공통 컴포넌트 `components/Common/TrackPagination.tsx` 신설(그라데이션 손잡이가 트랙 위를 이동, 다크모드 대응, 페이지 수 많으면 양끝+현재/총 컴팩트 모드로 자동 전환). SalesManagement는 Table `pagination={false}` + 직접 slice(`pagedSales`)로 표시, 합계금액·페이지크기(5/10/20/50)·검색결과 건수는 `extra` prop으로 유지. 검색으로 결과 줄면 현재 페이지 자동 보정.
- Track 페이지네이션을 매입·견적·발주·거래처·재고 화면으로 확대 적용. 클라이언트 slice형(매입=제어형 상태, 견적/발주/재고=현재페이지 상태 신설)과 서버 사이드형(거래처: slice 없이 상태 변경→기존 refetch useEffect 트리거) 구분 처리. 각 화면의 기존 합계/건수 표기는 `extra`로 이관, `pagination={false}` 전환 후 정렬 onChange가 페이지 상태를 덮어쓰지 않도록 `handleTableChange` 가드. `vite build` 통과.
- Track 페이지네이션 2차 확대: 결제(수금/지급 2개 테이블 각각)·품목·사용자관리·사업체(서버사이드)·거래원장·미수금(CustomerBalance)까지 적용. 거래원장은 `summary`가 현재 페이지 데이터(pageData) 기준이라 slice 후에도 페이지 합계 동작 동일, 미수금 summary는 `filteredBalances` 전체 기준이라 영향 없음(둘 다 데스크톱 Table 분기만 교체, 모바일 카드뷰는 유지). 손잡이 색을 보라→핑크에서 프로젝트 파랑 톤(`#378ADD→#1B61A8`)으로 변경(공통 컴포넌트 GRADIENT 1곳 수정→전 화면 반영). `vite build` 통과. 대시보드는 모달 내 위젯 테이블이라 제외.
- 매출 품목명 컬럼 2줄 줄바꿈 → 한 줄(`ellipsis` + nowrap, 넘치면 …, 마우스오버 툴팁으로 전체 이름) 처리.
- 테이블 컬럼 마우스 드래그 리사이즈 도입: `react-resizable` 설치 + 공통 `components/Common/ResizableTitle.tsx`(+css) & `hooks/useResizableColumns.ts`(퍼센트폭→px 환산 baseWidth, 조절 폭 localStorage `erp:colWidths:<key>` 저장, `enabled: !isMobile`로 모바일 비활성). 매출·매입·견적·발주·거래처·재고·결제(2테이블)·품목·사용자관리·사업체·미수금·거래원장 12개 화면(훅 13개) 적용. 각 화면 고유 storageKey, baseWidth는 해당 테이블 scroll.x에 맞춤. 데스크톱 Table의 columns/components만 교체, 모바일/모달/합계행은 유지.
- ⚠️ 리사이즈 로컬 실검증 중 버그 발견·수정: react-draggable이 `process.env.DRAGGABLE_DEBUG`를 참조하는데 브라우저 번들에 `process`가 없어 **드래그 시작 시 'process is not defined'로 리사이즈가 깨짐(프로덕션도 동일)**. `frontend/vite.config.ts` define에 `'process.env.DRAGGABLE_DEBUG': 'false'` 추가로 해결. Preview로 로그인→매출 화면에서 드래그 시 폭 변경·localStorage 저장·새로고침 후 폭 복원까지 확인, 프로덕션 번들에서 해당 참조 제거 확인. `vite build` 통과.
- 로그인 화면 아이디/비번 찾기(PasswordReset) 모바일 최적화: 반응형 패딩, Steps progressDot, 카드 본문 패딩.
- 매출조회(sales_viewer) 모바일 하단 탭바에 '내 정보' 탭 추가(기존엔 더보기가 비어 프로필/로그아웃 동선 부재).
- 거래처 잔액(getCustomerBalance) 404 해결: 거래처 마스터가 삭제된 고아 매출/매입도 매출·매입·수금 데이터로 잔액 계산하도록 404 제거(fallback 이름 '(삭제된 거래처)'). 프론트(Sales/Purchase) 전잔금 조회는 4xx 재시도 중단·404는 0 처리로 인쇄 차단 방지.
- 로그인 화면 '찾으러가기'를 버튼화(아이디/비밀번호 찾기). 사용자(매출조회) 셀프 비번 재설정 흐름 신설: POST /auth/request-phone-reset(전화번호→OTP), resetPassword 역할별 검증(sales_viewer 4자리 허용), PasswordReset에 관리자/사용자 모드 토글(전화번호→OTP→4자리).
- 사용자 생성 시 전화번호 중복 에러 메시지 구체화: 본인 관리자 번호/내 사업장 등록 계정(회사명·이름·역할)/외부 계정을 구분 안내(전역 유일성 검사는 유지).
- sales_viewer 모바일 추가 개선: (1) getProfile이 다중 접근 사업장 모두 반환하도록 수정 + Profile 진입 시 setAuth→updateUser로 변경해 상단 사업장 선택기가 사라지던 문제 해결, (2) 헤더 사용자 이름이 한 글자씩 세로로 줄바꿈되던 것 whiteSpace:nowrap + 사업장 Select 폭 제한으로 수정, (3) 거래처 잔액(/customer-balance)을 sales_viewer 메뉴·하단탭에 노출, (4) 거래원장 모바일 컬럼 폭 축소(요약 행 정렬 유지 위해 컬럼 숨김 대신 폭만 축소).

### 2026-07-04
- 테이블 리사이즈 핸들 가시성 + 컬럼 최소폭. ① 컬럼 경계 리사이즈 핸들이 `background-image:none`으로 안 보이던 것 → `ResizableTitle.css`에 `.react-resizable-handle::after` 세로 그립 바(2px, 라이트 #b8bfc9 / 다크 #5c6673) 추가, 헤더 셀 hover 또는 핸들 hover 시 파랑(#1B61A8 / 다크 #4da3ff)+두껍게 강조로 '여기를 끌면 폭 조절' 표시. `@media print` 숨김. ② `useResizableColumns` 최소폭 하한 40→20px(수량 등 좁은 컬럼이 40에서 더 안 줄던 것 해소; 감쇠 0.5라 한 번 드래그는 시작폭과 하한의 중간까지, 반복 드래그로 20까지 수렴). Preview 실검증(tempA): 그립 렌더(2px 회색), 수량 84→반복 드래그로 28px(<40) 확인. vite build 통과.
- 사용자(sales_viewer) 모바일 4건. ① 매출 모바일 헤더 검색폼-날짜폼 겹침: AnimatedSearchBar 프레임(scale·padding)이 44px affix 입력을 다 못 감싸 프레임 아래로 삐져나와 시각적 겹침 → 매출 모바일만 프레임 제거하고 일반 AutoComplete+Input.Search로, Space size small→middle(gap 4→10px). ② 매출 카드 탭 시 매출 상세 모달(읽기전용: 거래처·일자·품목별 규격/단위/수량/단가/금액·공급/세액/합계·비고) 신설 — sales_viewer는 카드 탭=상세, admin은 기존(선택/이름수정) 유지. ③ 거래원장 모바일 요약카드: `매출 합계 공급 X · 세액 Y · 합계 Z`가 한 줄에 몰려 '합계'가 줄바꿈되던 것 → 라벨 위 / 공급가액·세액·합계 각 행으로 분리(tabular-nums nowrap). ④ 잔액 상세 모달 거래내역: 모바일에서 테이블 컬럼이 좁아 금액이 숫자 중간 줄바꿈(`4,284,0\n00원`)되던 것 → 모바일은 카드 리스트(구분 태그+일자 / 내용 / 금액·잔액 nowrap), 데스크톱 테이블은 nowrap. Preview 실검증(temp8, sales_viewer 주입): 검색-날짜 gap 10px, 매출 상세 모달 콘텐츠, 거래원장 요약 정렬, 잔액 상세 카드형. vite build 통과. ⚠️ **보류: 모달 안드로이드 백버튼 닫기** — pushState/popstate 커스텀 훅이 React Router(BrowserRouter) popstate 처리와 충돌해 모달 닫힘을 방해하는 정황 + headless 프리뷰가 antd close 애니메이션 `animationend`를 안 쏴 검증 불가(모달이 `ant-zoom-leave-start`에 멈춤 — 실브라우저에선 정상 닫힘). 리스크 커서 제거, 추후 React Router 통합 방식으로 재시도 필요.
- 테이블 설정 3종(리사이즈 속도·컬럼 표시숨김·초기화). `hooks/useResizableColumns.ts` 확장: ① **리사이즈 감쇠 0.5** — react-resizable은 `data.size.width = 드래그시작폭 + 전체마우스이동`을 보고하므로(mousedown에 시작폭 고정 캡처, 이후 widthProp 변경 무시), 변하는 prev가 아닌 **드래그 시작 폭**을 기준으로 감쇠해야 정확히 절반이 됨 → `onResizeStart`로 시작폭을 `dragStartRef`에 캡처(`ResizableTitle`에 onResizeStart/onResizeStop 전달 추가), `damped = 시작폭 + (data.size.width - 시작폭)*0.5`. Preview 드래그 시뮬레이션(비동기 틱 분리 필수 — 동기 루프는 리렌더 안 돼 오측정)으로 마우스 120px→폭 60px(ratio 0.50) 확인. ② **컬럼 표시/숨김** — `erp:colHidden:<key>` localStorage, `toggleColumn`/숨김 컬럼 필터, `columnMeta` 반환. ③ **초기화** — `reset()`이 폭+숨김 localStorage/state 모두 제거. 신규 공통 `Common/TableColumnSettings.tsx`(⚙ '컬럼' 드롭다운: 체크박스 목록 + '기본값으로 초기화'; body portal이라 `.dark-mode` 못 닿아 `useThemeStore`로 색 직접 지정). 감쇠는 훅 전역이라 리사이즈 쓰는 13개 테이블 전부 자동 적용, 컬럼설정 UI는 주요 5화면(매출·매입·거래처·품목·거래원장) 액션행에 배선(`alwaysVisibleKeys`로 작업 컬럼은 숨김 목록서 제외). Preview 실검증(temp7): 컬럼 체크박스 토글로 규격 숨김/복원, 초기화로 폭·숨김 전부 리셋, 리사이즈 0.50. vite build 통과.
- CSS 개선 프로젝트(davidm_ai 인스타 스타일 마이크로 인터랙션) 5종 일괄 적용. 신규 `styles/effects.css` (erp* 접두사 키프레임, `.dark-mode` 재정의, hover는 `@media (hover:hover)` PC 한정, `@media print` 전부 제외, `prefers-reduced-motion` 대응): ① antd Spin 기본 인디케이터를 그라데이션 링 스피너로 전역 교체(`Spin.setDefaultIndicator`, main.tsx) ② primary 버튼 hover 리프트+눌림(scale .97), 입력/셀렉트/피커 포커스 파랑 글로우 ③ 모바일(≤767px) 카드 계단식 등장(`erpCardIn`, `.balance-mobile-cards`·`.erp-stagger` 유틸) ④ 다크모드 토글을 해↔달 회전 커스텀 토글로 교체(신규 `Common/ThemeToggle.tsx`, AppLayout 사이드바+Settings 2곳) ⑤ 로그인 화면 글래스모피즘 시범(그라데이션 배경+떠다니는 orb+blur 14px 프로스트 카드, 로그인은 항상 라이트 테마라 다크 이슈 없음). vite build 통과, Preview로 로그인 글래스/포커스 글로우/다크 토글 동작/라우트 전환 시 erp-spinner 표출/모바일 stagger delay까지 실검증. 참고: `.dark .responsive-card` 등 기존 `.dark` 접두사 CSS는 실제 적용 클래스(`dark-mode`)와 달라 죽은 코드로 보임.
- 죽은 `.dark ` 접두사 다크모드 CSS 정리(responsive-tables.css·mobile.css 12개 규칙 전부 — 앱은 `dark-mode` 클래스만 사용). 커스텀 요소 보정 규칙 6개는 `.dark-mode`로 교체, antd darkAlgorithm/index.css `.dark-mode` 규칙이 이미 처리하는 3개(카드 배경, 테이블 헤더 2곳)는 삭제. 조사로 확인된 사실: ① Modal/Drawer/Dropdown은 portal로 body에 렌더되어 `dark-mode`(AppLayout의 Layout에만 부여) 조상 선택자가 절대 도달 못 함 — index.css의 `.dark-mode .ant-modal-*`/`.ant-dropdown-*` 규칙도 같은 이유로 죽어 있음(antd darkAlgorithm이 토큰으로 대신 처리해 무해). ② mobile.css `.ant-modal-footer`의 `background:#fff`/`border-top:#f0f0f0`은 antd 자체 규칙(`:where(...).ant-modal .ant-modal-footer`, 특이성 0,2,0 > 0,1,0)에 밀려 애초 적용된 적 없는 죽은 선언 → 함께 제거(모달 footer는 원래부터 투명이었고 본문 내부 스크롤이라 문제없음). ③ 반면 `.ant-drawer-footer`의 `background:#fff`는 실제 적용되던 값 → 다크모드에서 흰 footer 실버그였고, 제거로 수정(antd drawer footer는 테마 인지 border-top만 가짐). Preview 실검증(다크+모바일 375px, 계정 darktest@example.com): 테이블 sticky 헤더 rgb(38,38,38), 모달 콘텐츠 #1f1f1f/footer 투명 확인. vite build 통과. 부수 개선: vite dev 포트 `process.env.PORT` 지원 + launch.json `autoPort: true`, `frontend/.env.development.local`(VITE_API_URL=/api — 프록시 경유로 5173 외 포트에서도 CORS 없이 로컬 API 사용).
- 거래처·품목 모바일 카드뷰 전환: 거래처(기존 3컬럼 축소 테이블)·품목(기존 가로 1200px 스크롤 테이블)의 모바일 분기를 카드 리스트로 교체. 거래처 카드=거래처명(수정 링크)+코드 태그/대표자·사업자번호/전화번호 `tel:` 링크(탭하면 전화)/주소(한 줄 ellipsis, 탭하면 클립보드 복사+토스트), 품목 카드=품목명+코드/규격·단위·분류/매입가(빨강)·매출가(파랑)/세금구분 태그. 체크박스+카드 탭 선택 토글(선택삭제 호환), 수정·삭제 버튼 40px 터치 영역, `.erp-stagger` 계단식 등장 재사용. 데스크톱 테이블·컬럼 리사이즈 미변경, 내보내기는 데이터 기반(exportUtils `_tableId` 미사용)이라 카드 전환 영향 없음. 다크모드 이름 링크·매입가 색 보정(#7db4e8/#e57368). Preview 실검증(모바일 375px 카드 3건·tel 링크·stagger delay·다크 카드 bg #1f1f1f, 데스크톱 리사이즈 핸들 12개 유지). vite build 통과.
- 모바일 sticky 검색바(거래처·품목): 신규 `Common/MobileStickyBar.tsx`(scroll 리스너로 고정 감지 — IntersectionObserver는 프리뷰 환경에서 콜백 미발화라 배제) + effects.css `.erp-sticky-search`(top:64px 헤더 아래 고정, 반투명+blur 8px, 고정 시 그림자, z-index 50, 다크모드/인쇄 대응). ⚠️ 두 함정 해결: ① AppLayout Content의 `overflow:auto`가 sticky를 무력화 → 거래처/품목 라우트+모바일에서만 `visible`로 전환(매출 화면은 545px 고정폭 검색인풋을 Content 가로스크롤로 흡수 중이라 auto 유지 필수 — 전환 시 body 가로스크롤 발생 확인) ② sticky는 부모 박스 밖으로 못 붙으므로 검색바를 작은 헤더 div에서 페이지 레벨로 이동. 품목 모바일 헤더를 거래처식(검색+추가/더보기 하단 드로어)으로 재구성(기존 버튼 8개는 드로어로 이관). Preview 실검증: 스크롤 시 top 64px 고정+erp-stuck 그림자 토글, /sales 가로스크롤 회귀 없음. vite build 통과.
- 글래스모피즘을 회원가입(SignupForm)·비밀번호 찾기(PasswordReset)·비밀번호 변경(PasswordChange)까지 확대 (`erp-login-bg`+orb+`erp-login-glass` 동일 패턴, PasswordReset/Change는 Card header 투명+흰 구분선 처리). PasswordChange의 deprecated `headStyle`→`styles.header` 정리. 세 화면 모두 공개 페이지(항상 라이트 테마)라 다크모드 영향 없음. Preview 모바일/PC 확인, vite build 통과.
- 관리자 페이지 헤더/테이블 정리(같은 PR): ① 매입·수금지급 데스크톱 헤더도 매출/거래원장과 동일하게 필터행(검색+레인지피커+기간선택)/액션행(추가·수금·지급·엑셀·파일저장·인쇄 등) 2행 분리, 모바일은 기간선택을 버튼행으로 이동. ② 발주서 관리: '발주서 작성' 버튼이 상단 우측 헤더에 멀리 있던 것을 견적서와 동일하게 필터 Card 내 검색 인풋 우측으로 이동(헤더는 제목만). ③ 미수금/미지급 현황: 사업자번호에 하이픈 포맷(`formatBusinessNumber`, 데스크톱 컬럼+모바일 카드) — 신규 import. 테이블 마우스 조작 걸끄러움 원인=`scroll={{x:700}}`로 생긴 컨테이너에서 컬럼 합(1075)이 폭(1070)을 5px 초과→불필요한 가로 스크롤바 → 데스크톱은 `scroll` 제거(모바일만 `{x:700}` 유지)해 컬럼이 컨테이너에 정확히 맞도록(thSum 1070) 수정, 스크롤바 제거. Preview 실검증(계정 temp6, 거래처5+매출5): 매입/수금지급 필터·액션 2행, 발주서 작성 버튼 검색 우측, 사업자번호 123-45-67801 하이픈, 미수금 테이블 page/content 가로스크롤 0. vite build 통과.
- 사용자 페이지 헤더/검색 레이아웃 정리(위 3종 PR에 이어): ① 모바일 검색 입력 글씨 아래로 밀림 수정 — mobile.css `.ant-input` min-height:44 강제가 affix wrapper(검색/비번, 38px) 내부 input에도 걸려 input이 래퍼보다 커지며 텍스트가 아래로 밀린 것 → affix wrapper에 min-height:44+flex center 부여, 내부 `.ant-input`은 min-height:0으로 해제(래퍼가 터치영역 담당). Preview centeredDiff 0 확인. ② 매출·거래원장 모바일에서 DateRangeFilter(기간선택)를 별도 줄→조회/추가+더보기 같은 Space 행으로 이동. ③ 매출·거래원장 데스크톱 헤더를 필터행(검색+레인지피커+기간선택[+조회])/액션행(추가·엑셀·파일저장·인쇄·전자서명 등)으로 2행 분리(기존엔 검색+버튼 전부 한 Space에 섞여 wrap). Preview 실검증(⚠️ preview_resize가 resize 이벤트 미발화라 useMediaQuery가 모바일 상태 유지 → `window.dispatchEvent(new Event('resize'))` 강제 후 측정): 매출/거래원장 필터행 top 정렬·액션행 하단 배치 확인. vite build 통과.
- 사용자(sales_viewer) 페이지 개선 3종. **A. 거래처 조회전용 노출**: AppLayout 메뉴/하단탭 `/customers`에 sales_viewer 추가(하단탭 5개: 거래처·매출·거래원장·잔액·내정보, `거래처잔액`→`잔액` 축약). 백엔드 CustomerController는 sales_viewer의 CRUD를 모두 허용(전체삭제만 admin)하므로 프론트에서 `isSalesViewer` 가드로 조회전용화 — 카드/테이블의 체크박스·수정·삭제·추가·엑셀업로드·선택삭제·전체삭제 숨김, 거래처명은 편집링크→일반 텍스트, 작업 컬럼 `hidden`, rowSelection/onRow 비활성. 전화 `tel:`·주소복사·엑셀/PDF 내보내기는 유지. **B. 매출 모바일 카드뷰**: 기존 4컬럼 가로스크롤 테이블(scroll x:320)→카드 리스트(거래처명+서명태그 / 날짜·품목외N·수량 / 합계금액 색상). admin은 체크박스+이름링크(수정), sales_viewer는 조회전용. longpress 편집 로직 제거(카드 탭=선택, 이름=수정). **C. 기간 필터 통합**: `Common/DateRangeFilter.tsx`의 프리셋 6개 버튼(각 드롭다운/팝업)을 단일 "기간 선택" 드롭다운 1개로 재작성 — 최상위 최근7일/30일/3개월/6개월 + 하위메뉴 일/월(그룹: 올해·작년)/분기/반기/연도. 기존 커스텀 팝업 JSX 제거, antd Menu items로 통일(darkAlgorithm 자동 테마라 isDark 분기 삭제). 매출·거래원장 공용 반영. Preview 실검증(역할 주입 방식): 매출 카드 3건·기간 드롭다운 통합메뉴·"최근7일" 적용 시 기간 2026-06-28~07-04 변경, sales_viewer 거래처(모바일 카드 체크박스0/수정삭제0/전화3, 데스크톱 작업컬럼 숨김·tbody버튼0)·매출(체크박스0), admin 원복 시 정상(작업컬럼·수정삭제9·선택4) 확인. vite build 통과.

### 2026-06-25
- 검색바 회전 무지개 그라데이션 테두리 제거(AnimatedSearchBar).
- 미수금/미지급 현황(CustomerBalance) 샘플 데이터 → 실제 API 연동. 매출·매입·수금·지급으로 거래처별 잔액 계산.
- 미수금 연령분석(Aging) 구현: 수금액 FIFO 차감 후 0~30/31~60/61~90/90일 초과 구간 분포 + 경과일수. 계산 로직을 `utils/receivableAging.ts`로 분리하고 Vitest 테스트 12종 작성(첫 테스트 도입, setup.ts 추가).

### 2026-07-09
- 인스타(designcodewithav) 프리미엄 UI 릴스 1차 검토 후 ROI 있는 2건 적용. 나머지(Pagination=TrackPagination 이미 적용, Date Picker=RangePicker+통합 기간드롭다운 이미 구축, Multi Select=사용처 2곳뿐 antd mode="multiple"로 충분, Input floating label=antd Form 상단라벨과 충돌)는 제외. ① **카드형 라디오** 신규 공통 `Common/PremiumRadioCard.tsx`(antd Form.Item value/onChange 규약 호환, 아이콘+제목+설명 카드, role=radiogroup/radio 접근성) + `styles/effects.css` `.erp-radio-card` 계열(선택 시 파랑 테두리·글로우·점 채움, `.dark-mode` 재정의 #4da3ff, hover PC한정, print 제외). 결제 일괄등록 모달 수금/지급 라디오(`PaymentManagement.tsx`)를 카드형으로 교체(수금=파랑 MoneyCollect·"거래처로부터 받는 금액" / 지급=빨강 PayCircle·"거래처에 지급하는 금액"), 미사용된 antd `Radio` import 제거. ② **글자수 카운터** 비고/메모 데이터입력 TextArea 6곳(매출·매입·결제2·품목·견적·발주)에 antd 네이티브 `showCount maxLength={200}` 부여(BusinessForm 주소·검색인풋·인쇄메모는 제외). Preview 실검증(임시 `/preview-radio` 공개 라우트→검증 후 삭제): 선택 상태(수금 파랑 강조·점 채움)·클릭 전환 시 Form value 갱신(receipt↔payment, aria-checked 동기)·카운터 0/200·아이콘·다크모드(#4da3ff 테두리/글로우) 확인. vite build 통과.
- 인스타 프리미엄 UI 2차 검토 후 ROI 있는 2건 적용(Dropdown/Switch/Checkbox는 antd 기본으로 충분해 제외). ① **토스트(message) 전역 프리미엄화** — `message.*` 355곳 호출부 **무수정**. antd v5 static message는 ConfigProvider 밖 body 포털이라 항상 라이트 카드 → 라이트 기준 디자인. base(배경/그림자/라운드/패딩/등장 애니메이션)는 `index.css`의 기존 `.ant-message-notice-content { …!important }` 블록을 프리미엄 값으로 갱신(radius 8→12, box-shadow 0 12px 32px rgba(15,23,42,.16), padding 11px 20px, position/overflow 추가, `animation: erpToastIn`). effects.css는 그 블록이 안 다루는 것만 담당: 아이콘 17px, 타입별 `--erp-toast` 색변수(success #16a34a/error #dc2626/warning #d97706/info #2563eb, `:has()`로 판별), 하단 진행바 `::after`(scaleX 1→0, `erpToastProgress 2s`=전역 duration과 동일, 로딩 무한은 `:not(:has(.ant-message-loading))`로 제외), reduced-motion/print 대응. ⚠️ 함정: 처음 effects.css에 2-클래스 규칙으로 넣었으나 **index.css의 기존 `!important` 블록**(antd가 아니라 우리 코드)이 base를 소유 중이라 안 먹음 → 4-클래스로 올려도 `!important`는 못 이겨, 결국 그 index.css 블록 자체를 갱신하는 방식으로 일원화(중복 제거). ② **로그인 CTA 버튼**(`LoginForm.tsx`) — 릴스 modern button의 hover 광택 sweep + 화살표 슬라이드를 `.erp-cta` 클래스로 히어로 버튼에만 한정 적용(전 버튼 X). effects.css `.erp-cta::before`(좌→우 광택, `@media hover` PC한정) + `.erp-cta-arrow`(ArrowRightOutlined, hover 시 translateX 5px), 로딩 중엔 화살표 숨김. Preview 실검증(임시 `/preview-toast` 공개 라우트→삭제, computed-style 정밀 확인): 토스트 radius 12·그림자·아이콘 17·등장 애니메이션·타입별 진행바색(초록/빨강/주황)·로딩 진행바 제외 확인, CTA 화살표 DOM 확인. (headless 프리뷰 screenshot이 이 세션 idle 대기 타임아웃이라 computed-style로 검증 — inspect가 screenshot보다 정밀). vite build 통과.
- 다크모드 토스트 대응. static message는 `AntApp`/ConfigProvider 밖 body 포털이라 antd darkAlgorithm도 못 받고(`[antd: message] Static function can not consume context` 경고가 그 증거), `index.css`가 흰 배경을 `!important`로 강제 중 → 다크에서도 흰 토스트였음. **body에 기존 `.dark-mode`를 붙이면 CLAUDE.md에 정리된 죽은 `.dark-mode .ant-modal-*`/`.ant-dropdown-*` 포털 규칙이 되살아나 회귀 위험** → 토스트 전용 신호 클래스 `erp-dark`를 `<html>`(documentElement)에 부여하는 방식 채택. `App.tsx` ThemeWrapper에 `useEffect([isDark, isPublicPage])`로 `document.documentElement.classList.toggle('erp-dark', isDark && !isPublicPage)`(공개페이지는 항상 라이트라 제외). effects.css에 `.erp-dark .ant-message-notice-content { background:#262626 !important; color:rgba(255,255,255,.88) !important; box-shadow:0 12px 32px rgba(0,0,0,.5) !important }`(index.css의 흰 배경 `!important`를 이기려 `.erp-dark` 접두사로 specificity ↑ + `!important`) + 다크용 진행바 밝은 색(success #22c55e/error #f87171/warning #fbbf24/info #60a5fa). Preview 실검증(임시 `/preview-toast`→삭제, `erp-dark` 수동 토글로 CSS 확인): on→bg rgb(38,38,38)·텍스트 rgba(255,255,255,.88)·success 진행바 #22c55e·loading 진행바 제외, off→흰 배경/검은 텍스트 복원 확인. vite build 통과.
- 다크모드 notification 대응(위 토스트에 이어). `index.css`가 `.ant-notification`/`.ant-notification-notice`도 흰 배경·검은 텍스트를 `!important`로 강제 중이라, antd notification이 뜨면 다크에서 흰 팝업이 되는 동일 잠재버그. 토스트와 같은 `erp-dark` 신호(`<html>`, App.tsx ThemeWrapper가 이미 토글) 재사용해 effects.css에 `.erp-dark .ant-notification-notice { bg #262626 / color rgba(255,255,255,.88) / shadow …!important }` + message/description 밝은 텍스트 + close 아이콘 색 override(`.erp-dark` 접두사로 index.css !important 이김). 참고: antd notification은 `hooks/useMessage.ts`의 `useNotification`(App.useApp) 훅으로 노출돼 있으나 현재 실제 호출처는 없음 → 선제 대응(향후 사용 시 다크 정상). Preview 실검증(임시 `/preview-toast`→삭제, static notification.success/error로 확인): erp-dark on→bg rgb(38,38,38)·제목/설명 rgba(255,255,255,.88), off→흰 배경/검은 텍스트 복원. vite build 통과.
- CTA sheen(`.erp-cta`)을 주요 거래 커밋 버튼에 선별 확대(로그인 버튼에 이어). 각 도메인 입력 모달의 저장/등록 버튼 10곳: 매출(저장·금액 + 저장F8)·매입(동일 2)·결제(저장 + 일괄등록)·품목(저장)·거래처(모달 저장 2: 컴팩트+footer)·견적서/발주서(antd Modal이라 명시적 Button이 아닌 `okButtonProps={{ className:'erp-cta' }}`로 OK버튼에 부여). 화살표(`.erp-cta-arrow`)는 로그인 히어로 버튼만 유지하고, 나머지는 sheen(hover 시 좌→우 광택 sweep)만 — className만 추가라 JSX 구조 무변경. 공개(로그인 제외 회원가입/비번찾기/변경)·설정/프로필 등 부차 버튼은 제외(선별). effects.css `.erp-cta`는 이미 존재(⑧), 재사용만. Preview 실검증(임시 `/preview-cta`→삭제): 기본 antd primary '저장' 버튼에서 라이트/다크 배경 모두 정지/hover(대각선 광택 band) 자연스러움 확인(로그인은 커스텀 그라데이션 bg였는데 기본 primary에서도 양호). vite build 통과.
- 최근 검색어(Recent Searches) 공용 훅 신설·적용(인스타 프리미엄 Search UI 중 우리에게 없던 유일 기능; 추천/Clear/돋보기는 이미 antd AutoComplete+allowClear로 구현돼 있어 제외). 신규 `hooks/useRecentSearches.tsx`: localStorage `erp:recentSearch:<key>` 기반, `{recent, addRecent, removeRecent, clearRecent}` + `buildRecentOptions({searchText, suggestions, recent, onClear, isDark})`. addRecent는 2글자 미만 무시·중복 제거·최신순 prepend·최대 8개. buildRecentOptions는 입력이 비면 "최근 검색어" 그룹(항목=시계아이콘+검색어, 헤더에 '지우기' 링크 onMouseDown preventDefault로 blur 방지)을, 입력 있으면 기존 추천 옵션 그대로 반환. 적용 3화면(AutoComplete 쓰는 곳): 매출(sales)·매입(purchase)·품목(product) — 각 모바일/데스크톱 AutoComplete 2블록씩, `options`를 buildRecentOptions로 교체, `onSelect`/`handleSearch`(onSearch)에 addRecent 추가. 거래처(customer)는 AutoComplete 없이 AnimatedSearchBar 단독(서버사이드, 추천 드롭다운 없음)이라 이 기능과 안 맞아 제외. Preview 실검증(임시 `/preview-recent`→삭제, DOM 확인): Enter 검색 시 localStorage+state 기록, 입력 비우고 포커스 시 '최근 검색어' 그룹+항목+'지우기' 노출, '지우기' 클릭 시 localStorage/state 비움, 4개 시드값이 저장 순서대로 렌더 확인(screenshot은 이 세션 idle 타임아웃이라 DOM으로 검증 — inspect가 더 정밀). vite build 통과.
- 🐛 거래명세표 인쇄 시 전잔금 간헐 누락 버그 원인분석·수정. **원인**: 세션 연장("연장하기") 시 프론트가 서버가 준 새 access token을 버림. `authStore.refreshToken()`이 `loginTime`만 갱신하고 `token`은 안 바꿔서, 연장해도 스토어 Bearer 토큰은 로그인 원본 그대로 유지. 미들웨어([auth.ts:8-14](backend/src/middleware/auth.ts))는 Bearer 헤더를 쿠키보다 우선하므로 갱신된 쿠키가 아닌 원본 토큰을 계속 사용 → `loginTime`만 계속 리셋돼 프론트는 세션이 살아있다 착각하지만 **원본 토큰이 로그인+세션시간(기본 8h)에 만료**되는 순간 인쇄의 전잔금 조회 요청이 401 → 값 누락. "가끔(세션 오래됨)/재로그인하면 정상(새 토큰)"과 정확히 일치. (참고: 로그인 토큰은 15m이 아니라 세션설정 기반 8h — [AuthController.ts:318](backend/src/controllers/AuthController.ts). refresh 엔드포인트는 새 토큰을 body로 반환하는데 프론트가 무시했던 것.) **수정 3종**: ① `authStore.refreshToken(token?)`이 새 토큰을 저장(`set({ token: token ?? state.token, loginTime: Date.now() })`) ② `TokenExpirationNotifier`가 연장 성공 시 `refreshToken(res.data.data.token)` 전달 ③ (하드닝) `api.ts` 응답 인터셉터에 **401 시 single-flight로 `/auth/refresh-token`(raw axios, 쿠키 기반, 인증 불필요) 호출→새 토큰 저장→원요청 Authorization 갱신 후 1회 재시도**, 실패 시에만 로그아웃. Preview 실검증(임시 `/preview-auth`→삭제): `refreshToken('NEW')`→token=NEW_TOKEN(기존 버그면 OLD 유지), no-arg→기존 토큰 유지 확인. vite build 통과.
- hover 프리페치 적용(요청 워터폴 진단 후속). 신규 `utils/routePreload.ts`(경로→lazy import thunk 맵, `prefetchRoute(path)`가 requestIdleCallback으로 유휴 시 청크 로드, 중복 방지 Set). AppLayout 사이드바 `menuItems`의 각 label을 `<span onMouseEnter={()=>prefetchRoute(item.key)}>`로 감싸 hover 시 해당 라우트 청크 프리페치(App.tsx lazy()와 동일 모듈 경로라 Vite가 동일 청크 dedupe→실제 라우트 청크를 데움). Preview 실검증(임시 `/preview-prefetch`→삭제, performance resource 확인): `prefetchRoute('/sales')`→`SalesManagement.tsx` 모듈 로드됨. vite build 통과. 참고: 페이지 내부 데이터는 이미 `Promise.all` 병렬이라 최악 워터폴은 원래 없었고(진단), 이번은 라우트 청크 로딩 선반영만.
- 프론트 세션 타이머를 실제 세션 길이에 맞춰 단일화(위 전잔금/토큰 버그 후속). 문제: 프론트에 세션 만료 타이머가 2개였는데 — `App.tsx ProtectedRoute`는 실제 세션길이(localStorage 'sessionTimeout'=로그인 응답 security.sessionTimeout, 백엔드 토큰 만료와 동일 기준)를 썼지만, `TokenExpirationNotifier`는 **하드코딩 2시간**이라 실제 8h(기본) 세션인데도 2h에 경고/로그아웃 → 너무 이른 로그아웃. 해결: 신규 `utils/session.ts`(`getSessionTimeoutMs()` 1h/4h/8h/24h→ms, `getSessionTimeoutLabel()` "N시간")로 로직 단일화. App.tsx는 로컬 `getSessionTimeoutMs` 제거하고 util import. TokenExpirationNotifier는 `TOKEN_EXPIRATION_MS=2h` 상수 제거하고 `getSessionTimeoutMs()` 사용(checkExpiration/만료타이머 2곳), 연장 성공 메시지도 `세션이 ${getSessionTimeoutLabel()} 연장되었습니다`로 동적화. 이제 경고는 실제 만료 5분 전, 로그아웃은 실제 만료 시점에 발생(연장 시 loginTime 리셋+새 토큰 저장은 앞 커밋에서 처리됨 → 타이머도 함께 리셋). Preview 실검증(임시 `/preview-session`→삭제): sessionTimeout 1h→ms 3600000·"1시간", 24h→86400000·"24시간" 확인. vite build 통과.
