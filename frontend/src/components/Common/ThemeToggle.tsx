import React from 'react';

interface ThemeToggleProps {
  checked: boolean;
  onChange: () => void;
  size?: 'small' | 'default';
}

/**
 * 해 ↔ 달 회전 전환 애니메이션 다크모드 토글.
 * 스타일은 styles/effects.css의 .erp-theme-toggle 계열 참조.
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ checked, onChange, size = 'default' }) => {
  const className = [
    'erp-theme-toggle',
    checked ? 'erp-theme-toggle-dark' : '',
    size === 'small' ? 'erp-theme-toggle-sm' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className={className}
      onClick={onChange}
    >
      <span className="erp-theme-knob">
        <span className="erp-theme-sun" aria-hidden="true">
          ☀️
        </span>
        <span className="erp-theme-moon" aria-hidden="true">
          🌙
        </span>
      </span>
    </button>
  );
};

export default ThemeToggle;
