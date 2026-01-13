import React from 'react';
import { Tooltip, Typography } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ShortcutGuideProps {
  style?: React.CSSProperties;
}

const SHORTCUTS = [
  { key: 'F8', description: '저장' },
  { key: 'F9', description: '저장 후 계속 입력' },
];

const ShortcutGuide: React.FC<ShortcutGuideProps> = ({ style }) => {
  const content = (
    <div style={{ padding: '4px 0' }}>
      <div style={{ marginBottom: 8, fontWeight: 'bold' }}>단축키 안내</div>
      {SHORTCUTS.map((shortcut) => (
        <div key={shortcut.key} style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
          <Text keyboard style={{ minWidth: 40 }}>{shortcut.key}</Text>
          <span>{shortcut.description}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Tooltip title={content} placement="top">
      <QuestionCircleOutlined
        style={{
          fontSize: 16,
          color: '#8c8c8c',
          cursor: 'pointer',
          ...style,
        }}
      />
    </Tooltip>
  );
};

export default ShortcutGuide;
