import React, { useEffect, useRef, useState } from 'react';

interface MobileStickyBarProps {
  children: React.ReactNode;
}

/** sticky 고정 위치 = 앱 헤더 높이(64px). effects.css의 top 값과 일치해야 함 */
const STICKY_TOP = 64;

/**
 * 모바일 목록 화면의 검색/액션 영역을 상단(앱 헤더 아래)에 고정.
 * 고정되는 순간 그림자가 나타남. 스타일은 styles/effects.css의 .erp-sticky-search 참조.
 * 데스크톱(≥768px)에서는 CSS 미디어쿼리에 의해 일반 흐름으로 렌더링됨.
 */
const MobileStickyBar: React.FC<MobileStickyBarProps> = ({ children }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    // sticky로 고정되면 뷰포트 기준 top이 STICKY_TOP에 도달함
    const onScroll = () => {
      const pinned = bar.getBoundingClientRect().top <= STICKY_TOP + 1;
      setStuck(prev => (prev === pinned ? prev : pinned));
    };
    onScroll();
    // capture: 내부 스크롤 컨테이너에서 발생하는 scroll도 감지
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', onScroll, true);
  }, []);

  return (
    <div ref={barRef} className={`erp-sticky-search${stuck ? ' erp-stuck' : ''}`}>
      {children}
    </div>
  );
};

export default MobileStickyBar;
