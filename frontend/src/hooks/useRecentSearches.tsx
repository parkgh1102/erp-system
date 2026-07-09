import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';

/**
 * 최근 검색어 공용 훅 (localStorage 기반).
 * 검색창(antd AutoComplete)에 얹어, 입력이 비어 있을 때 최근 검색어를 드롭다운에 노출.
 * 저장 키: `erp:recentSearch:<key>` (화면별로 분리).
 */
const PREFIX = 'erp:recentSearch:';
const DEFAULT_MAX = 8;
const MIN_LEN = 2; // 2글자 미만은 기록하지 않음 (앱 검색 규칙과 동일)

function load(key: string): string[] {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useRecentSearches(key: string, max: number = DEFAULT_MAX) {
  const [recent, setRecent] = useState<string[]>(() => load(key));

  // key 변경 시 재로딩
  useEffect(() => {
    setRecent(load(key));
  }, [key]);

  const persist = useCallback(
    (list: string[]) => {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(list));
      } catch {
        /* 저장 실패(용량 등)는 무시 */
      }
    },
    [key]
  );

  const addRecent = useCallback(
    (termRaw: string) => {
      const term = (termRaw || '').trim();
      if (term.length < MIN_LEN) return;
      setRecent((prev) => {
        const next = [term, ...prev.filter((t) => t !== term)].slice(0, max);
        persist(next);
        return next;
      });
    },
    [max, persist]
  );

  const removeRecent = useCallback(
    (term: string) => {
      setRecent((prev) => {
        const next = prev.filter((t) => t !== term);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearRecent = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* 무시 */
    }
  }, [key]);

  return { recent, addRecent, removeRecent, clearRecent };
}

interface OptionItem {
  value: string;
  label?: ReactNode;
}

/**
 * AutoComplete에 넘길 options 생성.
 * - 입력이 비어 있고 최근 검색어가 있으면 → "최근 검색어" 그룹(지우기 링크 포함) 반환
 * - 그 외 → 기존 추천 옵션(suggestions) 그대로 반환
 */
export function buildRecentOptions(params: {
  searchText: string;
  suggestions: OptionItem[];
  recent: string[];
  onClear: () => void;
  isDark?: boolean;
}): OptionItem[] | { label: ReactNode; options: OptionItem[] }[] {
  const { searchText, suggestions, recent, onClear, isDark } = params;
  if ((searchText || '').trim().length > 0) return suggestions;
  if (recent.length === 0) return suggestions;

  return [
    {
      label: (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: isDark ? '#9aa0aa' : '#8c8c8c',
            fontSize: 12,
          }}
        >
          <span>최근 검색어</span>
          <a
            // onMouseDown preventDefault로 input blur/선택 방지
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            style={{ fontSize: 12 }}
          >
            지우기
          </a>
        </div>
      ),
      options: recent.map((term) => ({
        value: term,
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined style={{ color: isDark ? '#7b828c' : '#bfbfbf' }} />
            {term}
          </span>
        ),
      })),
    },
  ];
}
