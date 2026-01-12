import { useState, useEffect, useCallback } from 'react';

interface MediaQueryResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useMediaQuery(): MediaQueryResult {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : TABLET_BREAKPOINT
  );

  const handleResize = useCallback(() => {
    setWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 초기값 설정
    setWidth(window.innerWidth);

    // debounce된 resize 핸들러
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  return {
    isMobile: width <= MOBILE_BREAKPOINT,
    isTablet: width > MOBILE_BREAKPOINT && width <= TABLET_BREAKPOINT,
    isDesktop: width > TABLET_BREAKPOINT,
    width
  };
}

export default useMediaQuery;
