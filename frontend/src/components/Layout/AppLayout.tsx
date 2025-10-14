import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Switch, Typography, Badge, Button } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  WalletOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, currentBusiness, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 다크모드에서 선택된 메뉴 스타일
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ${isDark ? `
        .ant-menu-dark .ant-menu-item-selected {
          background-color: transparent !important;
          color: #ffffff !important;
        }
        .ant-menu-dark .ant-menu-item-selected::after {
          border-radius: 0 !important;
          background-color: #1677ff !important;
        }
        .ant-menu-dark .ant-menu-item-selected .ant-menu-item-icon {
          color: #ffffff !important;
        }
      ` : `
        .ant-menu-light .ant-menu-item-selected::after {
          border-radius: 0 !important;
        }
      `}
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [isDark]);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ color: '#1890ff' }} />,
      label: '대시보드',
    },
    {
      key: '/customers',
      icon: <TeamOutlined style={{ color: '#52c41a' }} />,
      label: '거래처 관리',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined style={{ color: '#faad14' }} />,
      label: '품목 관리',
    },
    {
      key: '/sales',
      icon: <ShoppingCartOutlined style={{ color: '#f5222d' }} />,
      label: '매출 관리',
    },
    {
      key: '/purchases',
      icon: <FileTextOutlined style={{ color: '#722ed1' }} />,
      label: '매입 관리',
    },
    {
      key: '/payments',
      icon: <WalletOutlined style={{ color: '#fa8c16' }} />,
      label: '수금/지급',
    },
    {
      key: '/transaction-ledger',
      icon: <FileTextOutlined style={{ color: '#13c2c2' }} />,
      label: '거래원장',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined style={{ color: '#1890ff' }} />,
      label: '내 정보',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined style={{ color: '#52c41a' }} />,
      label: '설정',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#ff4d4f' }} />,
      label: '로그아웃',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="80"
        onBreakpoint={(broken) => {
          setCollapsed(broken);
        }}
        theme={isDark ? 'dark' : 'light'}
        style={{
          background: isDark ? '#001529' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: '64px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
          }}
        >
          <img
            src="/logo.png"
            alt="ERP 통합시스템"
            style={{
              height: '32px',
              marginRight: collapsed ? 0 : '12px',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {!collapsed && (
            <Text
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: isDark ? '#e5e7eb' : '#1890ff',
              }}
            >
              ERP 통합시스템
            </Text>
          )}
        </div>

        <Menu
          theme={isDark ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, flex: 1 }}
        />

        {/* 사이드바 하단 컨트롤들 */}
        <div
          style={{
            padding: '16px',
            borderTop: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
            marginTop: 'auto',
          }}
        >
          {/* 테마 토글 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              marginBottom: '12px',
              padding: collapsed ? '8px' : '10px 12px',
              borderRadius: '8px',
              background: isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(24, 144, 255, 0.04)',
              border: `1px solid ${isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(24, 144, 255, 0.12)'}`,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(24, 144, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(24, 144, 255, 0.04)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            {!collapsed && (
              <Text
                style={{
                  color: isDark ? '#d1d5db' : '#1890ff',
                  fontSize: '12px',
                  fontWeight: '500',
                  opacity: isDark ? 1 : 0.9,
                }}
              >
                {isDark ? '어두운 모드' : '밝은 모드'}
              </Text>
            )}
            <Switch
              checked={isDark}
              onChange={toggleTheme}
              size="small"
              checkedChildren="🌙"
              unCheckedChildren="☀️"
              style={{
                background: isDark ? '#1677ff' : '#1890ff',
              }}
            />
          </div>

          {/* 메뉴 접기/펼치기 버튼 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              marginBottom: '12px',
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                color: isDark ? '#d1d5db' : '#000000',
                width: collapsed ? '100%' : 'auto',
              }}
            >
              {!collapsed && '메뉴 닫기'}
            </Button>
          </div>

          {/* 로그아웃 버튼 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{
                color: '#ff4d4f',
                width: collapsed ? '100%' : 'auto',
              }}
            >
              {!collapsed && '로그아웃'}
            </Button>
          </div>
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: isDark ? '#001529' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* 모바일 메뉴 토글 */}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                color: isDark ? '#ffffff' : '#000000',
                display: window.innerWidth <= 768 ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            {/* 환영 메시지 */}
            {currentBusiness && (
              <Text style={{
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px',
                display: window.innerWidth <= 480 ? 'none' : 'block'
              }}>
                <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                  {currentBusiness.companyName}
                </span>님! 방문을 환영합니다.
              </Text>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            <Badge count={0}>
              <BellOutlined
                style={{
                  fontSize: '18px',
                  color: '#faad14',
                }}
              />
            </Badge>

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background-color 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#262626' : '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>
                  {user?.name}
                </Text>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: window.innerWidth <= 768 ? '16px 8px' : '24px',
            minHeight: 'calc(100vh - 112px)',
            background: isDark ? '#141414' : '#ffffff',
            borderRadius: '8px',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;