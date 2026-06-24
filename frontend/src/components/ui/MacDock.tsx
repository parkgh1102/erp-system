import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';

export interface DockItem {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
}

interface MacDockProps {
  items: DockItem[];
  /** 기본 아이콘 크기(px) */
  baseSize?: number;
  /** 마우스가 가까울 때 최대 크기(px) */
  maxSize?: number;
}

const DockIcon: React.FC<{
  item: DockItem;
  mouseX: MotionValue<number>;
  baseSize: number;
  maxSize: number;
}> = ({ item, mouseX, baseSize, maxSize }) => {
  const ref = useRef<HTMLDivElement>(null);

  // 아이콘 중심과 마우스 X 거리 → 크기 보간 (macOS 독 확대 효과)
  const distance = useTransform(mouseX, (x) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseSize };
    return x - bounds.x - bounds.width / 2;
  });
  const sizeRaw = useTransform(distance, [-120, 0, 120], [baseSize, maxSize, baseSize]);
  const size = useSpring(sizeRaw, { stiffness: 250, damping: 18 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <motion.div
        ref={ref}
        onClick={item.onClick}
        style={{
          width: size,
          height: size,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 22,
          color: '#333',
        }}
        whileTap={{ scale: 0.85 }}
      >
        {item.icon}
      </motion.div>
    </div>
  );
};

/**
 * macOS 스타일 독 메뉴 (영상 ④ 데모 기반). 마우스 위치에 따라 아이콘이 확대된다.
 */
export const MacDock: React.FC<MacDockProps> = ({ items, baseSize = 44, maxSize = 72 }) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: 14,
        padding: '12px 18px',
        borderRadius: 20,
        background: 'rgba(0,0,0,0.08)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {items.map((item, i) => (
        <DockIcon key={i} item={item} mouseX={mouseX} baseSize={baseSize} maxSize={maxSize} />
      ))}
    </motion.div>
  );
};

export default MacDock;
