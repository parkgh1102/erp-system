import React, { useState } from 'react';
import { Card, Typography, Divider, App, Button } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  SettingOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { AnimatedSearchBar } from './AnimatedSearchBar';
import { DownloadShareButtons } from './AnimatedActionButtons';
import { AnimatedFileUpload } from './AnimatedFileUpload';
import { MacDock } from './MacDock';

const { Title, Paragraph, Text } = Typography;

const Section: React.FC<{ title: string; desc?: string; children: React.ReactNode }> = ({
  title,
  desc,
  children,
}) => (
  <Card style={{ marginBottom: 24, borderRadius: 12 }}>
    <Title level={4} style={{ marginTop: 0 }}>
      {title}
    </Title>
    {desc && (
      <Paragraph type="secondary" style={{ marginTop: -4 }}>
        {desc}
      </Paragraph>
    )}
    <div style={{ marginTop: 16 }}>{children}</div>
  </Card>
);

/**
 * 영상 UI 5종 데모 미리보기 페이지. (/ui-demo)
 * 실제 페이지 연결 전 동작을 한 화면에서 확인하기 위한 임시 페이지.
 */
const UiDemo: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '32px 16px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Title level={2} style={{ margin: 0 }}>
            UI 컴포넌트 데모
          </Title>
          <Button onClick={() => navigate('/login')}>← 로그인으로</Button>
        </div>
        <Paragraph type="secondary">
          인스타그램 영상 5종을 framer-motion 으로 구현한 컴포넌트 미리보기입니다.
        </Paragraph>
        <Divider />

        {/* ② 비밀번호 강도 */}
        <Section title="② 비밀번호 강도 표시기" desc="입력하면 실시간으로 강도 바와 체크 항목이 애니메이션됩니다.">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력해보세요 (예: Abcd1234!)"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #d9d9d9',
              fontSize: 14,
              marginBottom: 12,
              outline: 'none',
            }}
          />
          <PasswordStrengthMeter password={password} />
        </Section>

        {/* ⑤ 검색바 */}
        <Section title="⑤ 애니메이션 검색바" desc="포커스 시 확대 + 회전 그라데이션 테두리.">
          <AnimatedSearchBar
            value={search}
            onChange={setSearch}
            onSearch={(v) => message.info(`검색: ${v || '(빈 값)'}`)}
            placeholder="거래처·품목 검색..."
            width="100%"
          />
        </Section>

        {/* ① 다운로드/공유 버튼 */}
        <Section title="① 다운로드 · 공유 버튼" desc="호버/클릭 시 스프링 애니메이션.">
          <DownloadShareButtons
            onDownload={() => message.success('다운로드 클릭')}
            onShare={() => message.success('공유 클릭')}
          />
        </Section>

        {/* ③ 파일 업로드 */}
        <Section title="③ 파일 업로드" desc="드래그&드롭 또는 클릭 → 진행률 애니메이션 (데모용 자동 진행).">
          <AnimatedFileUpload
            onFile={(f) => message.info(`선택된 파일: ${f.name}`)}
            hint="파일을 끌어다 놓거나 클릭하여 선택"
          />
        </Section>

        {/* ④ macOS 독 */}
        <Section title="④ macOS 독 메뉴" desc="마우스를 가까이 대면 아이콘이 확대됩니다.">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
            <MacDock
              items={[
                { icon: <HomeOutlined />, label: '홈', onClick: () => message.info('홈') },
                { icon: <AppstoreOutlined />, label: '앱', onClick: () => message.info('앱') },
                { icon: <MailOutlined />, label: '메일', onClick: () => message.info('메일') },
                { icon: <UserOutlined />, label: '사용자', onClick: () => message.info('사용자') },
                { icon: <SettingOutlined />, label: '설정', onClick: () => message.info('설정') },
              ]}
            />
          </div>
        </Section>

        <Text type="secondary" style={{ fontSize: 12 }}>
          ※ 임시 데모 페이지입니다. 실제 적용 위치가 정해지면 각 페이지에 연결합니다.
        </Text>
      </div>
    </div>
  );
};

export default UiDemo;
