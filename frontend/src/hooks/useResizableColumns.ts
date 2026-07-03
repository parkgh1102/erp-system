import { useCallback, useState } from 'react';
import type { ResizeCallbackData } from 'react-resizable';
import ResizableTitle from '../components/Common/ResizableTitle';

const PREFIX = 'erp:colWidths:';

/** 컬럼 width('12%', '80', 80 등)를 픽셀 숫자로 변환 */
const toPx = (w: unknown, base: number): number | undefined => {
  if (typeof w === 'number') return w;
  if (typeof w === 'string') {
    if (w.trim().endsWith('%')) return Math.round((parseFloat(w) / 100) * base);
    const n = parseInt(w, 10);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
};

const colKey = (col: any): string =>
  String(
    col.key ??
      (Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex) ??
      col.title
  );

interface Options {
  /** 퍼센트 폭을 픽셀로 환산할 기준 너비 (테이블 scroll.x 값과 맞추면 자연스러움) */
  baseWidth?: number;
  /** false 면 리사이즈 비활성(원본 컬럼 그대로 반환). 모바일에서 끌 때 사용 */
  enabled?: boolean;
}

/**
 * antd Table 컬럼을 마우스로 폭 조절 가능하게 만들고, 조절한 폭을 localStorage 에 기억한다.
 *
 * 사용:
 *   const { columns, components } = useResizableColumns('sales', baseColumns, { baseWidth: 1200, enabled: !isMobile });
 *   <Table columns={columns} components={components} ... />
 *
 * storageKey 는 화면마다 고유해야 한다(예: 'sales', 'purchase').
 */
export function useResizableColumns(
  storageKey: string,
  columns: any[],
  options?: Options
) {
  const base = options?.baseWidth ?? 1200;
  const enabled = options?.enabled ?? true;

  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(PREFIX + storageKey) || '{}');
    } catch {
      return {};
    }
  });

  const handleResize = useCallback(
    (key: string) =>
      (_e: React.SyntheticEvent, data: ResizeCallbackData) => {
        setWidths((prev) => {
          const next = { ...prev, [key]: Math.max(40, Math.round(data.size.width)) };
          try {
            localStorage.setItem(PREFIX + storageKey, JSON.stringify(next));
          } catch {
            /* 저장 실패는 무시 */
          }
          return next;
        });
      },
    [storageKey]
  );

  if (!enabled) {
    return { columns, components: undefined as any };
  }

  const resizableColumns = columns.map((col) => {
    const key = colKey(col);
    const width = widths[key] ?? toPx(col.width, base);
    // 폭을 숫자로 구할 수 없는 컬럼은 리사이즈 비활성(자동 폭 유지)
    if (width == null) return col;
    return {
      ...col,
      width,
      onHeaderCell: () => ({
        width,
        onResize: handleResize(key),
      }),
    };
  });

  return {
    columns: resizableColumns,
    components: { header: { cell: ResizableTitle } },
  };
}
