import React from 'react';

/**
 * 카카오톡 알림톡 전송 버튼용 아이콘.
 * 카카오 브랜드 옐로(#FEE500) 말풍선 + 짙은 말풍선 심볼.
 * antd Button의 icon prop에 넣어 쓸 수 있도록 currentColor가 아닌 고정 브랜드색을 사용한다.
 */
interface KakaoIconProps {
  size?: number;
  style?: React.CSSProperties;
}

const KakaoIcon: React.FC<KakaoIconProps> = ({ size = 18, style }) => (
  <span
    role="img"
    aria-label="kakaotalk"
    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 브랜드 옐로 말풍선 (좌하단 꼬리) */}
      <path
        d="M12 3C6.477 3 2 6.463 2 10.74c0 2.744 1.84 5.153 4.61 6.53-.203.73-.734 2.646-.84 3.057-.132.51.187.503.394.366.162-.107 2.575-1.75 3.62-2.464.717.106 1.457.161 2.216.161 5.523 0 10-3.463 10-7.74C22 6.463 17.523 3 12 3Z"
        fill="#FEE500"
      />
      {/* 안쪽 말풍선 심볼 */}
      <path
        d="M8.2 9.1h7.6M8.2 12h5.4"
        stroke="#3C1E1E"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  </span>
);

export default KakaoIcon;
