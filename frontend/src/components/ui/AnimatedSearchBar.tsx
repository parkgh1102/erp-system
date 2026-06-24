import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SearchOutlined } from '@ant-design/icons';

interface AnimatedSearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  width?: number | string;
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
}) => {
  const [focused, setFocused] = useState(false);
  const [inner, setInner] = useState('');
  const val = value !== undefined ? value : inner;

  const setVal = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  return (
    <motion.div
      animate={{ scale: focused ? 1.02 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ position: 'relative', width, padding: 2, borderRadius: 12 }}
    >
      {/* 회전 그라데이션 테두리 */}
      <motion.div
        aria-hidden
        animate={{ rotate: 360, opacity: focused ? 1 : 0.45 }}
        transition={{
          rotate: { repeat: Infinity, duration: 4, ease: 'linear' },
          opacity: { duration: 0.3 },
        }}
        style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 12,
          background:
            'conic-gradient(from 0deg, #1890ff, #52c41a, #faad14, #eb2f96, #1890ff)',
          filter: 'blur(6px)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
          borderRadius: 10,
          padding: '8px 14px',
          border: '1px solid #e8e8e8',
        }}
      >
        <SearchOutlined style={{ color: focused ? '#1890ff' : '#999', fontSize: 16 }} />
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
            border: 'none',
            outline: 'none',
            fontSize: 14,
            background: 'transparent',
          }}
        />
      </div>
    </motion.div>
  );
};

export default AnimatedSearchBar;
