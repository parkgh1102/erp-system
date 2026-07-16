/**
 * 대시보드 차트 팔레트 · 마크 스펙.
 *
 * 색은 눈대중이 아니라 검증 스크립트(dataviz validate_palette)로 확정함.
 * 앱의 기존 도메인 컨벤션(매출=파랑 / 매입=빨강)을 그대로 따르되,
 * 다크는 라이트 색의 반전이 아니라 다크 표면에 맞춰 따로 고른 스텝임.
 *
 *  라이트 (surface #ffffff): #1B61A8 / #cf1322 → 전항목 PASS, 최소 인접 CVD ΔE 71.3
 *  다크  (surface #1f1f1f): #378add / #e34948 → 전항목 PASS, 최소 인접 CVD ΔE 70.0
 *
 * 앱의 기존 다크톤(#4da3ff/#e57368)은 명도 밴드(L 0.48–0.67)를 벗어나 FAIL이라 쓰지 않음.
 * 라이트 색을 다크에 그대로 쓰면 대비 3:1 미달(2.61/2.96)이라 반전도 불가.
 * 색을 바꿀 일이 생기면 반드시 검증기를 다시 돌릴 것.
 */

export interface ChartTheme {
  sales: string;
  purchase: string;
  surface: string;
  grid: string;
  axis: string;
  textMuted: string;
  textPrimary: string;
  tooltipBg: string;
  tooltipText: string;
  /** 증감 배지: 상승이 '좋음'인 지표에만 사용 */
  deltaUp: string;
  deltaDown: string;
}

const LIGHT: ChartTheme = {
  sales: '#1B61A8',
  purchase: '#cf1322',
  surface: '#ffffff',
  grid: '#f0f0f0',
  axis: '#d9d9d9',
  textMuted: '#8c8c8c',
  textPrimary: '#1f1f1f',
  tooltipBg: 'rgba(15, 23, 42, 0.92)',
  tooltipText: '#ffffff',
  deltaUp: '#006300',
  deltaDown: '#cf1322',
};

const DARK: ChartTheme = {
  sales: '#378add',
  purchase: '#e34948',
  surface: '#1f1f1f',
  grid: '#303030',
  axis: '#434343',
  textMuted: '#8c8c8c',
  textPrimary: 'rgba(255, 255, 255, 0.88)',
  tooltipBg: 'rgba(0, 0, 0, 0.88)',
  tooltipText: 'rgba(255, 255, 255, 0.92)',
  deltaUp: '#0ca30c',
  deltaDown: '#e34948',
};

export const getChartTheme = (isDark: boolean): ChartTheme => (isDark ? DARK : LIGHT);

/** 마크 스펙 (dataviz: 선 2px / 마커 지름 ≥8px / 영역 채움 ~10% / 그리드는 hairline solid) */
export const MARK = {
  lineWidth: 2,
  pointRadius: 4,
  pointRingWidth: 2,
  areaOpacity: 0.1,
} as const;

/** 'rgb(...)'/'#rrggbb' → 지정 알파의 rgba. 영역 채움용. */
export const withAlpha = (hex: string, alpha: number): string => {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** 큰 숫자 축약 (축 눈금·스파크라인 툴팁용). 1,284 / 12.9만 / 4.2억 */
export const compactWon = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1e8) return `${(n / 1e8).toFixed(1).replace(/\.0$/, '')}억`;
  if (abs >= 1e4) return `${(n / 1e4).toFixed(1).replace(/\.0$/, '')}만`;
  return n.toLocaleString();
};
