import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SearchOutlined } from '@ant-design/icons';

interface AnimatedSearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  width?: number | string;
  /** 기존 입력(예: antd AutoComplete/Input.Search)을 감싸 동일한 애니메이션 프레임만 입히고 싶을 때 사용 */
  children?: React.ReactNode;
}

/**
 * 회전 그라데이션 테두리 + 포커스 확대 효과가 있는 애니메이션 검색바.
 * antd 폼/테이블 검색 입력 대체용으로 쓸 수 있다.
 */
export const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = '검색어를 입력하세요',
  width = 320,
  children,
}) => {
  const [focused, setFocused] = useState(false);
  const [inner, setInner] = useState('');
  const val = value !== undefined ? value : inner;

  const setVal = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  // 프레임 모드: 기존 입력 컴포넌트를 감싸 애니메이션 테두리만 적용 (자동완성 등 기능 보존)
  if (children) {
    return (
      <motion.div
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => setFocused(false)}
        animate={{ scale: focused ? 1.02 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ position: 'relative', width, padding: 2, borderRadius: 12 }}
      >
        <div style={{ position: 'relative', zIndex: 1, borderRadius: 10, overflow: 'hidden' }}>
          {children}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ scale: focused ? 1.02 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ position: 'relative', width, padding: 2, borderRadius: 12 }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
          borderRadius: 10,
          minHeight: 44,
          padding: '0 14px',
          border: `1px solid ${focused ? '#1B61A8' : '#e8e8e8'}`,
          transition: 'border-color 0.2s',
        }}
      >
        <SearchOutlined style={{ color: focused ? '#1B61A8' : '#999', fontSize: 16, flexShrink: 0 }} />
        <input
          value={val}
          placeholder={placeholder}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch?.(val);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            fontSize: 16,
            lineHeight: '24px',
            height: 24,
            padding: 0,
            margin: 0,
            background: 'transparent',
          }}
        />
      </div>
    </motion.div>
  );
};

export default AnimatedSearchBar;
