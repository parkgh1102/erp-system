import React from 'react';
import { motion } from 'framer-motion';
import { DownloadOutlined, ShareAltOutlined } from '@ant-design/icons';

interface AnimatedActionButtonProps {
  icon?: React.ReactNode;
  label: string;
  color?: string;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * 호버/클릭 애니메이션이 있는 단일 액션 버튼.
 */
export const AnimatedActionButton: React.FC<AnimatedActionButtonProps> = ({
  icon,
  label,
  color = '#1890ff',
  loading = false,
  onClick,
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    disabled={loading}
    whileHover={{ scale: 1.05, boxShadow: `0 6px 18px ${color}55` }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      borderRadius: 10,
      border: 'none',
      cursor: loading ? 'default' : 'pointer',
      color: '#fff',
      fontSize: 14,
      fontWeight: 600,
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      opacity: loading ? 0.7 : 1,
    }}
  >
    <motion.span
      animate={loading ? { rotate: 360 } : { rotate: 0 }}
      transition={loading ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
      style={{ display: 'inline-flex' }}
    >
      {icon}
    </motion.span>
    {label}
  </motion.button>
);

interface DownloadShareButtonsProps {
  onDownload?: () => void;
  onShare?: () => void;
  downloadLabel?: string;
  shareLabel?: string;
  downloadLoading?: boolean;
}

/**
 * 다운로드/공유 액션 버튼 묶음 (영상 ① 데모 기반).
 */
export const DownloadShareButtons: React.FC<DownloadShareButtonsProps> = ({
  onDownload,
  onShare,
  downloadLabel = '다운로드',
  shareLabel = '공유',
  downloadLoading = false,
}) => (
  <div style={{ display: 'inline-flex', gap: 12 }}>
    <AnimatedActionButton
      icon={<DownloadOutlined />}
      label={downloadLabel}
      color="#1890ff"
      loading={downloadLoading}
      onClick={onDownload}
    />
    <AnimatedActionButton
      icon={<ShareAltOutlined />}
      label={shareLabel}
      color="#52c41a"
      onClick={onShare}
    />
  </div>
);

export default DownloadShareButtons;
