import React from 'react';
import { Card } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { getChartTheme, withAlpha, compactWon, MARK } from './chartTheme';

export interface StatCardProps {
  label: string;
  value: number;
  /** 값 뒤 단위. 금액은 '원', 개수는 '개' */
  suffix?: string;
  /** 증감률(%). 없으면 배지 미표시. 음수 가능 */
  delta?: number;
  /** 증감 비교 대상 이름 (예: '직전 기간') */
  deltaLabel?: string;
  /**
   * 상승이 '좋음'인 지표인지. sales처럼 명확한 경우만 true.
   * 매입처럼 상승의 좋고나쁨이 단정되지 않는 지표는 undefined로 두어 중립(회색)으로 표시.
   */
  upIsGood?: boolean;
  /** 스파크라인 데이터. 2개 미만이면 미표시 */
  trend?: number[];
  /** 스파크라인 색 (마크 색). 없으면 미표시 */
  trendColor?: string;
  /** 값 옆 아이콘 대신 쓰는 보조 설명 (증감이 없는 지표용) */
  caption?: string;
  /**
   * 큰 금액만 축약 표기(12.4억). 모바일 금액 카드용.
   *
   * 375px에서 값 영역은 146px. 실측 결과 12.4억(1,240,000,000원)은 142px로 들어가고
   * 124억부터 153px로 잘림 → 잘린 금액은 오독을 유발하므로 축약이 필요하지만,
   * 일반적인 금액까지 축약하면 정밀도만 잃음. 그래서 COMPACT_THRESHOLD 이상만 축약.
   */
  compact?: boolean;
  loading?: boolean;
}

/**
 * 모바일에서 축약을 시작하는 금액. 1억 미만은 그대로 두어 정밀도를 지키고,
 * 1억 이상은 '12.4억'이 '1,240,000,000'보다 읽기 쉬우면서 잘림(≈124억~)도 원천 차단.
 */
const COMPACT_THRESHOLD = 1e8;

/** 스파크라인 — 축·그리드·툴팁 없는 순수 추세선 (단일 계열이라 범례도 없음) */
const Sparkline: React.FC<{ data: number[]; color: string; surface: string }> = ({
  data,
  color,
  surface,
}) => {
  const W = 100;
  const H = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = data.length > 1 ? W / (data.length - 1) : 0;

  const pts = data.map((v, i) => {
    const x = i * step;
    // 상단·하단 2px 여백을 둬 선이 잘리지 않게
    const y = H - 2 - ((v - min) / span) * (H - 4);
    return [x, y] as const;
  });

  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const [lastX, lastY] = pts[pts.length - 1];

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <path d={area} fill={withAlpha(color, MARK.areaOpacity)} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={MARK.lineWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* 최신 지점만 강조 — 표면색 링으로 선 위에서도 또렷하게 */}
      <circle
        cx={lastX}
        cy={lastY}
        r={3}
        fill={color}
        stroke={surface}
        strokeWidth={MARK.pointRingWidth}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  suffix,
  delta,
  deltaLabel = '직전 기간 대비',
  upIsGood,
  trend,
  trendColor,
  caption,
  compact,
  loading,
}) => {
  const { isDark } = useThemeStore();
  const t = getChartTheme(isDark);

  const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
  const rising = hasDelta && (delta as number) > 0;
  const falling = hasDelta && (delta as number) < 0;

  // 색은 '방향 × 상승이 좋은지'로 결정. upIsGood이 undefined면 판단하지 않고 중립.
  let deltaColor = t.textMuted;
  if (hasDelta && upIsGood !== undefined && (rising || falling)) {
    const good = rising ? upIsGood : !upIsGood;
    deltaColor = good ? t.deltaUp : t.deltaDown;
  }

  // 색에만 의존하지 않도록 방향은 아이콘으로도 표시
  const DeltaIcon = rising ? ArrowUpOutlined : falling ? ArrowDownOutlined : MinusOutlined;

  const showTrend = trend && trend.length > 1 && trendColor;

  return (
    <Card className="erp-stat-card" loading={loading} styles={{ body: { padding: 18 } }}>
      <div className="erp-stat-label">{label}</div>

      {/* 축약 시에도 원값을 title로 남겨 정확한 금액을 확인할 수 있게 */}
      <div className="erp-stat-value" title={`${value.toLocaleString()}${suffix ?? ''}`}>
        {compact && Math.abs(value) >= COMPACT_THRESHOLD ? compactWon(value) : value.toLocaleString()}
        {suffix && <span className="erp-stat-suffix">{suffix}</span>}
      </div>

      <div className="erp-stat-foot">
        {hasDelta ? (
          <span className="erp-stat-delta" style={{ color: deltaColor }}>
            <DeltaIcon />
            {/* 부호는 값에서 직접 — 음수면 '-3.1%', 양수면 '+3.1%' */}
            {`${rising ? '+' : ''}${(delta as number).toLocaleString()}%`}
            <span className="erp-stat-delta-label">{deltaLabel}</span>
          </span>
        ) : (
          <span className="erp-stat-caption">{caption}</span>
        )}

        {showTrend && (
          <span className="erp-stat-spark">
            <Sparkline data={trend} color={trendColor} surface={t.surface} />
          </span>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
