/**
 * 디자인 토큰 (단일 소스)
 * ------------------------------------------------------------------
 * 앱 전체의 색·간격·radius·그림자를 여기 한 곳에서 정의한다.
 * - Ant Design 테마(ConfigProvider)는 이 토큰을 사용한다. (themeStore.ts)
 * - 커스텀 CSS/인라인 스타일은 index.css 의 :root CSS 변수를 사용한다.
 *   (두 값은 항상 동일하게 유지할 것 — 아래 표 참고)
 *
 *   브랜드 색      JS                CSS 변수
 *   primary       brand.primary     --color-primary
 *   success       brand.success     --color-success
 *   error         brand.error       --color-error
 *   warning       brand.warning     --color-warning
 */

// 브랜드 색상 (모던/차분한 톤)
export const brand = {
  primary: '#1B61A8',       // 메인 - 차분한 블루
  primaryHover: '#2C77C2',
  primaryActive: '#134B83',
  success: '#0F8A6A',       // 차분한 틸그린
  error: '#C0392B',         // 차분한 레드
  warning: '#C77F0A',       // 차분한 앰버
  info: '#1B61A8',
} as const;

// 간격 스케일 (8pt 기반)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// 모서리 둥글기
export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
} as const;

// 그림자
export const shadow = {
  card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.08)',
  popup: '0 6px 16px rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12)',
} as const;

/**
 * Ant Design seed/map 토큰.
 * defaultAlgorithm / darkAlgorithm 양쪽 공통으로 쓰는 기본 토큰.
 */
export const antdSeedToken = {
  colorPrimary: brand.primary,
  colorSuccess: brand.success,
  colorError: brand.error,
  colorWarning: brand.warning,
  colorInfo: brand.info,
  borderRadius: radius.md,
  fontSize: 14,
  // 모던하게: 컨트롤 약간 키움 (모바일은 mobile.css 에서 44px 강제)
  controlHeight: 38,
  wireframe: false,
} as const;
