import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useThemeStore } from '../../stores/themeStore';
import { getChartTheme, compactWon, MARK } from './chartTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface SalesTrendChartProps {
  labels: string[];
  sales: number[];
  purchases: number[];
  height?: number;
}

/**
 * 매출·매입 추이 (라인, 2계열).
 * 두 계열 모두 '원' 단위라 축은 하나 — 이중축은 쓰지 않음.
 *
 * 영역 채움(fill)은 일부러 쓰지 않음: 채움 두 개가 겹치면 서로를 물들여
 * 매입선이 검증한 #cf1322가 아니라 (189,27,48)로 렌더됨(= 0.1×파랑 + 0.9×빨강).
 * Chart.js가 dataset 0을 마지막에 그려 매출 채움이 매입선을 덮기 때문.
 * 단일 계열인 스파크라인(StatCard)은 겹침이 없어 채움을 유지함.
 */
const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  labels,
  sales,
  purchases,
  height = 280,
}) => {
  const { isDark } = useThemeStore();
  const t = getChartTheme(isDark);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: '매출',
          data: sales,
          borderColor: t.sales,
          backgroundColor: t.sales,
          borderWidth: MARK.lineWidth,
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: MARK.pointRadius,
          pointBackgroundColor: t.sales,
          pointHoverBackgroundColor: t.sales,
          // 표면색 링 — 두 선이 겹쳐도 점이 또렷하게
          pointHoverBorderColor: t.surface,
          pointHoverBorderWidth: MARK.pointRingWidth,
        },
        {
          label: '매입',
          data: purchases,
          borderColor: t.purchase,
          backgroundColor: t.purchase,
          borderWidth: MARK.lineWidth,
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: MARK.pointRadius,
          pointBackgroundColor: t.purchase,
          pointHoverBackgroundColor: t.purchase,
          pointHoverBorderColor: t.surface,
          pointHoverBorderWidth: MARK.pointRingWidth,
        },
      ],
    }),
    [labels, sales, purchases, t]
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      // 크로스헤어형: 한 지점에 두 계열 값을 함께
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          // 2계열이므로 범례는 항상 노출 (색만으로 식별하게 두지 않음)
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            padding: 16,
            // 범례 텍스트는 계열색이 아니라 텍스트 토큰
            color: t.textMuted,
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: t.tooltipBg,
          titleColor: t.tooltipText,
          bodyColor: t.tooltipText,
          padding: 10,
          cornerRadius: 8,
          displayColors: true,
          usePointStyle: true,
          callbacks: {
            label: (ctx: TooltipItem<'line'>) =>
              ` ${ctx.dataset.label}  ${Number(ctx.parsed.y).toLocaleString()}원`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: t.axis },
          ticks: { color: t.textMuted, font: { size: 12 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: t.grid },
          border: { display: false, dash: undefined },
          ticks: {
            color: t.textMuted,
            font: { size: 12 },
            maxTicksLimit: 5,
            callback: (v) => compactWon(Number(v)),
          },
        },
      },
    }),
    [t]
  );

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default SalesTrendChart;
