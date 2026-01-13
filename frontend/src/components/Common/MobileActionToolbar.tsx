import React, { useState, useMemo, useCallback } from 'react';
import { Button, Dropdown, Space, Drawer } from 'antd';
import { MoreOutlined, DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

export interface ActionItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  primary?: boolean;  // 주요 액션 (항상 표시)
}

interface MobileActionToolbarProps {
  actions: ActionItem[];
  maxVisibleActions?: number;  // 모바일에서 보여줄 최대 액션 수
  isMobile: boolean;
}

const MobileActionToolbar: React.FC<MobileActionToolbarProps> = ({
  actions,
  maxVisibleActions = 2,
  isMobile
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  // primary 액션과 secondary 액션 분리
  const { primaryActions, secondaryActions } = useMemo(() => {
    const primary = actions.filter(a => a.primary);
    const secondary = actions.filter(a => !a.primary);
    return { primaryActions: primary, secondaryActions: secondary };
  }, [actions]);

  // 드로어 열기/닫기
  const openDrawer = useCallback(() => setDrawerVisible(true), []);
  const closeDrawer = useCallback(() => setDrawerVisible(false), []);

  // 액션 클릭 핸들러 (드로어 닫기 포함)
  const handleActionClick = useCallback((action: ActionItem) => {
    action.onClick();
    closeDrawer();
  }, [closeDrawer]);

  // 데스크톱: 모든 버튼 표시
  if (!isMobile) {
    return (
      <Space size="small" wrap>
        {actions.map(action => (
          <Button
            key={action.key}
            icon={action.icon}
            onClick={action.onClick}
            danger={action.danger}
            disabled={action.disabled}
            type={action.primary ? 'primary' : 'default'}
            style={action.style}
          >
            {action.label}
          </Button>
        ))}
      </Space>
    );
  }

  // 모바일: primary 액션 + 더보기 버튼
  const visibleActions = primaryActions.slice(0, maxVisibleActions);
  const hasMoreActions = secondaryActions.length > 0 || primaryActions.length > maxVisibleActions;
  const hiddenPrimaryActions = primaryActions.slice(maxVisibleActions);
  const allHiddenActions = [...hiddenPrimaryActions, ...secondaryActions];

  return (
    <>
      <Space size="small" wrap style={{ width: '100%', justifyContent: 'flex-start' }}>
        {visibleActions.map(action => (
          <Button
            key={action.key}
            icon={action.icon}
            onClick={action.onClick}
            danger={action.danger}
            disabled={action.disabled}
            type="primary"
            size="middle"
            style={{
              ...action.style,
              minWidth: 'auto',
              padding: '0 12px'
            }}
          >
            {action.label}
          </Button>
        ))}

        {hasMoreActions && (
          <Button
            icon={<MoreOutlined />}
            onClick={openDrawer}
            size="middle"
            style={{ minWidth: 'auto' }}
          >
            더보기
          </Button>
        )}
      </Space>

      {/* 모바일 액션 드로어 */}
      <Drawer
        title="작업 선택"
        placement="bottom"
        onClose={closeDrawer}
        open={drawerVisible}
        height="auto"
        styles={{
          body: { padding: '12px 16px' }
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {allHiddenActions.map(action => (
            <Button
              key={action.key}
              icon={action.icon}
              onClick={() => handleActionClick(action)}
              danger={action.danger}
              disabled={action.disabled}
              block
              size="large"
              style={{
                ...action.style,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '8px'
              }}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      </Drawer>
    </>
  );
};

export default MobileActionToolbar;
