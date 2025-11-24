import React, { useState, useEffect } from 'react';
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
import { useNotificationStore } from '../../stores/notificationStore';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationPopover from '../Notification/NotificationPopover';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const { user, currentBusiness, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 모바일 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 미읽은 알림 개수 주기적으로 업데이트
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

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

  // 권한에 따른 메뉴 필터링
  const allMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ color: '#1890ff' }} />,
      label: '대시보드',
      roles: ['admin'], // admin만 접근 가능
    },
    {
      key: '/customers',
      icon: <TeamOutlined style={{ color: '#52c41a' }} />,
      label: '거래처 관리',
      roles: ['admin'],
    },
    {
      key: '/products',
      icon: <ShoppingOutlined style={{ color: '#faad14' }} />,
      label: '품목 관리',
      roles: ['admin'],
    },
    {
      key: '/sales',
      icon: <ShoppingCartOutlined style={{ color: '#f5222d' }} />,
      label: '매출 관리',
      roles: ['admin', 'sales_viewer'], // 모든 권한 접근 가능
    },
    {
      key: '/purchases',
      icon: <FileTextOutlined style={{ color: '#722ed1' }} />,
      label: '매입 관리',
      roles: ['admin'],
    },
    {
      key: '/payments',
      icon: <WalletOutlined style={{ color: '#fa8c16' }} />,
      label: '수금/지급',
      roles: ['admin'],
    },
    {
      key: '/transaction-ledger',
      icon: <FileTextOutlined style={{ color: '#13c2c2' }} />,
      label: '거래원장',
      roles: ['admin'],
    },
  ];

  // 사용자 권한에 따라 메뉴 필터링
  const menuItems = allMenuItems.filter(item =>
    item.roles.includes(user?.role || 'admin')
  );

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
          display: isMobile ? 'none' : 'flex',
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
            {user && (
              <Text style={{
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px',
                display: window.innerWidth <= 480 ? 'none' : 'block'
              }}>
                <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                  {user.name}
                </span>님! 방문을 환영합니다.
              </Text>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            <NotificationPopover>
              <Badge count={unreadCount} overflowCount={99}>
                <BellOutlined
                  style={{
                    fontSize: '18px',
                    color: '#faad14',
                    cursor: 'pointer',
                  }}
                />
              </Badge>
            </NotificationPopover>

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
            marginBottom: isMobile ? '70px' : '0',
            background: isDark ? '#141414' : '#ffffff',
            borderRadius: '8px',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* 모바일 하단 탭바 */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: isDark ? '#001529' : '#ffffff',
            borderTop: `2px solid ${isDark ? '#303030' : '#f0f0f0'}`,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 1000,
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {[
            { key: '/dashboard', icon: <DashboardOutlined />, label: '대시보드', roles: ['admin'] },
            { key: '/customers', icon: <TeamOutlined />, label: '거래처', roles: ['admin'] },
            { key: '/sales', icon: <ShoppingCartOutlined />, label: '매출', roles: ['admin', 'sales_viewer'] },
            { key: '/purchases', icon: <FileTextOutlined />, label: '매입', roles: ['admin'] },
            { key: '/payments', icon: <WalletOutlined />, label: '수금/지급', roles: ['admin'] },
          ].filter(item => item.roles.includes(user?.role || 'admin')).map((item) => {
            const isActive = location.pathname === item.key;
            return (
              <div
                key={item.key}
                onClick={() => navigate(item.key)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  cursor: 'pointer',
                  color: isActive ? '#1890ff' : (isDark ? '#8c8c8c' : '#595959'),
                  fontSize: '20px',
                  transition: 'all 0.3s',
                  minHeight: '44px',
                  minWidth: '44px',
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#1a1a1a' : '#f5f5f5';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ fontSize: '22px', marginBottom: '2px' }}>
                  {item.icon}
                </div>
                <Text
                  style={{
                    fontSize: '10px',
                    color: isActive ? '#1890ff' : (isDark ? '#8c8c8c' : '#595959'),
                    fontWeight: isActive ? 'bold' : 'normal',
                  }}
                >
                  {item.label}
                </Text>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default AppLayout;