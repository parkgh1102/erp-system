import React from 'react';
import { Button, Dropdown, Checkbox, Divider, Space } from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import type { ColumnMetaItem } from '../../hooks/useResizableColumns';

interface TableColumnSettingsProps {
  columns: ColumnMetaItem[];
  onToggle: (key: string) => void;
  onReset: () => void;
  /** 버튼 크기 */
  size?: 'small' | 'middle' | 'large';
}

/**
 * 테이블 컬럼 표시/숨김 + 초기화 설정 드롭다운(⚙).
 * useResizableColumns 가 돌려주는 columnMeta/toggleColumn/reset 과 함께 사용.
 * 데스크톱 테이블 툴바에 배치 (모바일 카드뷰에는 불필요).
 * 드롭다운 패널은 body portal 로 렌더되어 .dark-mode 조상에 못 닿으므로 색을 직접 지정.
 */
const TableColumnSettings: React.FC<TableColumnSettingsProps> = ({
  columns,
  onToggle,
  onReset,
  size = 'middle',
}) => {
  const { isDark } = useThemeStore();

  const panel = (
    <div
      style={{
        background: isDark ? '#1f1f1f' : '#ffffff',
        border: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
        borderRadius: 8,
        boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.5)' : '0 6px 20px rgba(0,0,0,0.15)',
        padding: '8px 4px',
        minWidth: 180,
        maxHeight: 360,
        overflowY: 'auto',
        color: isDark ? 'rgba(255,255,255,0.85)' : 'inherit',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ padding: '4px 12px', fontSize: 12, color: isDark ? 'rgba(255,255,255,0.45)' : '#8c8c8c' }}>
        표시할 컬럼
      </div>
      <Space direction="vertical" size={2} style={{ width: '100%', padding: '0 12px' }}>
        {columns.map((c) => (
          <Checkbox key={c.key} checked={!c.hidden} onChange={() => onToggle(c.key)}>
            <span style={{ color: isDark ? 'rgba(255,255,255,0.85)' : 'inherit' }}>{c.label}</span>
          </Checkbox>
        ))}
      </Space>
      <Divider style={{ margin: '8px 0', borderColor: isDark ? '#303030' : undefined }} />
      <div style={{ padding: '0 8px 4px' }}>
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={onReset}
          block
          style={{ textAlign: 'left', justifyContent: 'flex-start', color: isDark ? '#7db4e8' : '#1B61A8' }}
        >
          기본값으로 초기화
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown trigger={['click']} placement="bottomRight" dropdownRender={() => panel}>
      <Button icon={<SettingOutlined />} size={size}>
        컬럼
      </Button>
    </Dropdown>
  );
};

export default TableColumnSettings;
