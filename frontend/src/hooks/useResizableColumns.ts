import { useCallback, useMemo, useRef, useState } from 'react';
import type { ResizeCallbackData } from 'react-resizable';
import ResizableTitle from '../components/Common/ResizableTitle';

const PREFIX = 'erp:colWidths:';
const HIDDEN_PREFIX = 'erp:colHidden:';

/** 마우스 이동 대비 폭 변경 감쇠 계수. 1=1:1, 0.5=절반 속도(더 정밀) */
const RESIZE_DAMP = 0.5;

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

export interface ColumnMetaItem {
  key: string;
  /** 체크박스 라벨용 (title 문자열, 없으면 key) */
  label: React.ReactNode;
  hidden: boolean;
}

interface Options {
  /** 퍼센트 폭을 픽셀로 환산할 기준 너비 (테이블 scroll.x 값과 맞추면 자연스러움) */
  baseWidth?: number;
  /** false 면 리사이즈 비활성(원본 컬럼 그대로 반환). 모바일에서 끌 때 사용 */
  enabled?: boolean;
  /** 숨김 토글에서 제외할 컬럼 key (예: 'actions' 작업 컬럼은 항상 표시) */
  alwaysVisibleKeys?: string[];
}

/**
 * antd Table 컬럼을 마우스로 폭 조절 가능하게 만들고, 조절한 폭/숨김 상태를 localStorage 에 기억한다.
 *
 * 사용:
 *   const { columns, components, columnMeta, toggleColumn, reset } =
 *     useResizableColumns('sales', baseColumns, { baseWidth: 1200, enabled: !isMobile });
 *   <Table columns={columns} components={components} ... />
 *   <TableColumnSettings columns={columnMeta} onToggle={toggleColumn} onReset={reset} />
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
  const alwaysVisible = options?.alwaysVisibleKeys ?? [];

  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(PREFIX + storageKey) || '{}');
    } catch {
      return {};
    }
  });

  const [hidden, setHidden] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HIDDEN_PREFIX + storageKey) || '[]');
    } catch {
      return [];
    }
  });

  // 각 컬럼의 기본 픽셀 폭(드래그 시작 기준). 렌더마다 갱신되어 handleResize가 참조.
  const defaultsRef = useRef<Record<string, number>>({});
  // 드래그 시작 시점의 폭. react-resizable은 data.size.width = 시작폭 + 전체마우스이동 을 보고하므로,
  // 감쇠 기준을 '드래그 시작 폭'으로 고정해야 정확히 절반 속도가 된다(변하는 prev를 쓰면 1:1에 수렴).
  const dragStartRef = useRef<Record<string, number>>({});

  const handleResizeStart = useCallback(
    (key: string) =>
      (_e: React.SyntheticEvent, data: ResizeCallbackData) => {
        dragStartRef.current[key] = data.size.width;
      },
    []
  );

  const handleResize = useCallback(
    (key: string) =>
      (_e: React.SyntheticEvent, data: ResizeCallbackData) => {
        const base0 =
          dragStartRef.current[key] ?? defaultsRef.current[key] ?? data.size.width;
        const damped = base0 + (data.size.width - base0) * RESIZE_DAMP;
        setWidths((prev) => {
          const next = { ...prev, [key]: Math.max(40, Math.round(damped)) };
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

  const handleResizeStop = useCallback(
    (key: string) => () => {
      delete dragStartRef.current[key];
    },
    []
  );

  const toggleColumn = useCallback(
    (key: string) => {
      setHidden((prev) => {
        const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
        try {
          localStorage.setItem(HIDDEN_PREFIX + storageKey, JSON.stringify(next));
        } catch {
          /* 무시 */
        }
        return next;
      });
    },
    [storageKey]
  );

  const reset = useCallback(() => {
    setWidths({});
    setHidden([]);
    try {
      localStorage.removeItem(PREFIX + storageKey);
      localStorage.removeItem(HIDDEN_PREFIX + storageKey);
    } catch {
      /* 무시 */
    }
  }, [storageKey]);

  // 설정 UI용 컬럼 목록 (항상표시 컬럼은 제외)
  const columnMeta: ColumnMetaItem[] = useMemo(
    () =>
      columns
        .map((col) => {
          const key = colKey(col);
          const label = typeof col.title === 'string' ? col.title : (col.columnLabel ?? key);
          return { key, label, hidden: hidden.includes(key) };
        })
        .filter((m) => !alwaysVisible.includes(m.key)),
    [columns, hidden, alwaysVisible]
  );

  if (!enabled) {
    // 모바일 등: 리사이즈/숨김 미적용(카드뷰 사용). API 형태만 유지.
    return {
      columns,
      components: undefined as any,
      columnMeta,
      toggleColumn,
      reset,
    };
  }

  const visibleColumns = columns.filter((col) => !hidden.includes(colKey(col)));

  const resizableColumns = visibleColumns.map((col) => {
    const key = colKey(col);
    const dw = toPx(col.width, base);
    if (dw != null) defaultsRef.current[key] = dw; // 감쇠 기준용 기본폭 기록
    const width = widths[key] ?? dw;
    // 폭을 숫자로 구할 수 없는 컬럼은 리사이즈 비활성(자동 폭 유지)
    if (width == null) return col;
    return {
      ...col,
      width,
      onHeaderCell: () => ({
        width,
        onResize: handleResize(key),
        onResizeStart: handleResizeStart(key),
        onResizeStop: handleResizeStop(key),
      }),
    };
  });

  return {
    columns: resizableColumns,
    components: { header: { cell: ResizableTitle } },
    columnMeta,
    toggleColumn,
    reset,
  };
}
