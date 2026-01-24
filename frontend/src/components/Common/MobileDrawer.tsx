import React from 'react';
import { Drawer, Button, Space } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  destroyOnClose?: boolean;
  extra?: React.ReactNode;
  className?: string;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  width = 600,
  destroyOnClose = false,
  extra,
  className = '',
}) => {
  const { isMobile } = useMediaQuery();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      width={isMobile ? '100%' : width}
      height={isMobile ? '100%' : undefined}
      placement={isMobile ? 'bottom' : 'right'}
      destroyOnClose={destroyOnClose}
      className={`mobile-drawer ${className}`}
      extra={extra}
      footer={footer}
      styles={{
        body: {
          padding: isMobile ? 16 : 24,
          paddingBottom: footer ? 16 : isMobile ? 80 : 24,
        },
        footer: {
          padding: isMobile ? '12px 16px' : '16px 24px',
        },
        header: {
          padding: isMobile ? '12px 16px' : '16px 24px',
        },
      }}
      closeIcon={<CloseOutlined style={{ fontSize: isMobile ? 18 : 16 }} />}
    >
      {children}
    </Drawer>
  );
};

export default MobileDrawer;
