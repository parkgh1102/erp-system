import React, { useMemo } from 'react';
import { Select } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface TrackPaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  /** 트랙 위에 숫자를 직접 표시할 최대 페이지 수. 초과 시 컴팩트(양끝 + 현재/총) 모드로 전환 */
  maxNumbers?: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  /** 좌측에 표시할 부가 정보 (예: 합계 금액, 검색 결과 건수) */
  extra?: React.ReactNode;
}

const GRADIENT = 'linear-gradient(90deg, #378ADD 0%, #1B61A8 100%)';

/**
 * Instagram "Track" 스타일 페이지네이션.
 * 그라데이션 손잡이가 트랙 위를 미끄러지며 현재 페이지를 표시한다.
 * antd 기본 페이지네이션의 시각만 교체하고, 페이지 크기 변경/부가 정보(extra)는 유지한다.
 */
const TrackPagination: React.FC<TrackPaginationProps> = ({
  current,
  pageSize,
  total,
  onChange,
  maxNumbers = 7,
  showSizeChanger = true,
  pageSizeOptions = [5, 10, 20, 50],
  extra,
}) => {
  const { isDark } = useThemeStore();
  const { isMobile } = useMediaQuery();

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, current), pageCount);

  const colors = {
    trackBg: isDark ? '#3a3a3a' : '#eaeaea',
    trackBorder: isDark ? '#4a4a4a' : '#e0e0e0',
    numActive: isDark ? '#ffffff' : '#1f1f1f',
    numIdle: isDark ? '#8a8a8a' : '#bfbfbf',
    arrowBorder: isDark ? '#424242' : '#d9d9d9',
    arrowColor: isDark ? '#d0d0d0' : '#595959',
    text: isDark ? '#bbbbbb' : '#8c8c8c',
  };

  const pct = (p: number) => (pageCount <= 1 ? 50 : ((p - 1) / (pageCount - 1)) * 100);

  const useNumbers = pageCount <= maxNumbers;
  const pages = useMemo(
    () => Array.from({ length: pageCount }, (_, i) => i + 1),
    [pageCount]
  );

  const go = (p: number) => {
    const next = Math.min(Math.max(1, p), pageCount);
    if (next !== page) onChange(next, pageSize);
  };

  const arrowBtn = (dir: 'prev' | 'next') => {
    const disabled = dir === 'prev' ? page <= 1 : page >= pageCount;
    return (
      <button
        type="button"
        aria-label={dir === 'prev' ? '이전 페이지' : '다음 페이지'}
        disabled={disabled}
        onClick={() => go(dir === 'prev' ? page - 1 : page + 1)}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `1px solid ${colors.arrowBorder}`,
          background: 'transparent',
          color: colors.arrowColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          flex: '0 0 auto',
          padding: 0,
          transition: 'opacity .2s',
        }}
      >
        {dir === 'prev' ? <LeftOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
      </button>
    );
  };

  // 컴팩트 모드: 트랙 클릭으로 해당 위치 페이지로 이동
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (useNumbers || pageCount <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    go(Math.round(ratio * (pageCount - 1)) + 1);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        // 우하단 고정 AI 챗봇 버튼(모바일 상단 ~130px, 데스크톱 ~90px)이
        // 페이지네이션을 가리지 않도록 하단 여백 확보
        padding: `14px 4px ${isMobile ? 136 : 96}px`,
      }}
    >
      <div style={{ fontSize: 13, color: colors.text, minHeight: 20 }}>{extra}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showSizeChanger && (
          <Select
            size="small"
            value={pageSize}
            onChange={(size) => onChange(1, size)}
            style={{ width: 96 }}
            options={pageSizeOptions.map((n) => ({ value: n, label: `${n}개씩` }))}
          />
        )}

        {arrowBtn('prev')}

        <div style={{ flex: '0 0 auto', width: 260, maxWidth: '52vw' }}>
          <div style={{ position: 'relative', paddingTop: useNumbers ? 26 : 0 }}>
            {useNumbers && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 22 }}>
                {pages.map((p) => {
                  const active = p === page;
                  return (
                    <span
                      key={p}
                      onClick={() => go(p)}
                      style={{
                        position: 'absolute',
                        left: `${pct(p)}%`,
                        transform: 'translateX(-50%)',
                        fontSize: active ? 16 : 14,
                        fontWeight: active ? 600 : 400,
                        color: active ? colors.numActive : colors.numIdle,
                        cursor: 'pointer',
                        lineHeight: '20px',
                        transition: 'all .2s',
                        userSelect: 'none',
                      }}
                    >
                      {p}
                    </span>
                  );
                })}
              </div>
            )}

            <div
              onClick={handleTrackClick}
              style={{
                position: 'relative',
                height: 6,
                background: colors.trackBg,
                border: `1px solid ${colors.trackBorder}`,
                borderRadius: 99,
                cursor: useNumbers ? 'default' : 'pointer',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${pct(page)}%`,
                  width: 34,
                  height: 14,
                  borderRadius: 99,
                  background: GRADIENT,
                  transform: 'translate(-50%, -50%)',
                  transition: 'left .28s cubic-bezier(.4,0,.2,1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </div>

          {!useNumbers && (
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: colors.text }}>
              <span style={{ fontWeight: 600, color: colors.numActive }}>{page}</span>
              {` / ${pageCount}`}
            </div>
          )}
        </div>

        {arrowBtn('next')}
      </div>
    </div>
  );
};

export default TrackPagination;
