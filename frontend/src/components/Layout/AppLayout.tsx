import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Switch, Typography, Badge, Button, Select, Drawer } from 'antd';
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
  BankOutlined,
  SolutionOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { brand } from '../../styles/tokens';
import { useNotificationStore } from '../../stores/notificationStore';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationPopover from '../Notification/NotificationPopover';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isMobile } = useMediaQuery();
  const [collapsed, setCollapsed] = useState(false);
  const [moreDrawerVisible, setMoreDrawerVisible] = useState(false);
  const [isTabletOrSmaller, setIsTabletOrSmaller] = useState(window.innerWidth <= 992);
  const { user, currentBusiness, setCurrentBusiness, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { unreadCount, fetchUnreadCount, initPushNotifications } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 태블릿 감지 (992px 이하)
  useEffect(() => {
    const handleResize = () => {
      setIsTabletOrSmaller(window.innerWidth <= 992);
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

  // 푸시 알림 초기화
  useEffect(() => {
    initPushNotifications();
  }, [initPushNotifications]);

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
          background-color: #1B61A8 !important;
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
      icon: <DashboardOutlined style={{ color: '#1B61A8' }} />,
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
      key: '/inventory',
      icon: <FileTextOutlined style={{ color: '#eb2f96' }} />,
      label: '재고 관리',
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
      roles: ['admin', 'sales_viewer'],
    },
    {
      key: '/quotations',
      icon: <SolutionOutlined style={{ color: '#9254de' }} />,
      label: '견적서',
      roles: ['admin'],
    },
    {
      key: '/purchase-orders',
      icon: <FileTextOutlined style={{ color: '#2f54eb' }} />,
      label: '발주서',
      roles: ['admin'],
    },
    {
      key: '/customer-balance',
      icon: <BankOutlined style={{ color: '#36cfc9' }} />,
      label: '거래처 잔액',
      roles: ['admin', 'sales_viewer'],
    },
  ];

  // 사용자 권한에 따라 메뉴 필터링
  const menuItems = allMenuItems.filter(item =>
    item.roles.includes(user?.role || 'admin')
  );

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined style={{ color: '#1B61A8' }} />,
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
    <Layout className={isDark ? 'dark-mode' : ''} style={{ minHeight: '100vh' }}>
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
          display: isTabletOrSmaller ? 'none' : 'flex',
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
          <Text
            style={{
              fontSize: collapsed ? '16px' : '18px',
              fontWeight: 'bold',
              color: isDark ? '#e5e7eb' : '#1B61A8',
            }}
          >
            {collapsed ? 'ERP' : 'ERP 통합시스템'}
          </Text>
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
                  color: isDark ? '#d1d5db' : '#1B61A8',
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
              aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              style={{
                background: isDark ? '#1B61A8' : '#1B61A8',
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
              aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
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
              aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                color: isDark ? '#ffffff' : '#000000',
                display: isMobile ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            {/* 환영 메시지 (모바일에서는 우측에 사용자명이 있으므로 숨김) */}
            {user && (
              <Text style={{
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px',
                display: isMobile ? 'none' : 'block'
              }}>
                <span style={{ color: brand.primary, fontWeight: 'bold' }}>
                  {user.name}
                </span>님! 방문을 환영합니다.
              </Text>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', minWidth: 0 }}>
            {/* 다중 사업자 선택 (2개 이상일 때만 표시) */}
            {user?.businesses && user.businesses.length > 1 && (
              <Select
                value={currentBusiness?.id}
                onChange={(businessId) => {
                  const selected = user.businesses.find(b => b.id === businessId);
                  if (selected) {
                    setCurrentBusiness(selected);
                  }
                }}
                style={{
                  // 모바일에서는 폭을 제한해 우측 사용자 이름이 세로로 줄바꿈되지 않도록 함
                  minWidth: isMobile ? 96 : 180,
                  maxWidth: isMobile ? 150 : 260,
                  flexShrink: 1,
                }}
                dropdownStyle={{ minWidth: 200 }}
                options={user.businesses.map(b => ({
                  value: b.id,
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BankOutlined style={{ color: '#1B61A8' }} />
                      {b.companyName}
                    </span>
                  ),
                }))}
                suffixIcon={<BankOutlined style={{ color: '#1B61A8' }} />}
              />
            )}

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
                  flexShrink: 0,
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
                  style={{ backgroundColor: '#1B61A8', flexShrink: 0 }}
                />
                <Text
                  style={{
                    color: isDark ? '#ffffff' : '#000000',
                    whiteSpace: 'nowrap', // 좁은 화면에서 이름이 한 글자씩 세로로 줄바꿈되는 것 방지
                  }}
                >
                  {user?.name}
                </Text>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: isMobile ? '16px 8px' : '24px',
            minHeight: 'calc(100vh - 112px)',
            marginBottom: isTabletOrSmaller ? '70px' : '0',
            background: isDark ? '#141414' : '#ffffff',
            borderRadius: '8px',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* 모바일 하단 탭바 (주요 5개: 핵심 4 + 더보기) */}
      {isTabletOrSmaller && (() => {
        const primaryItems = [
          { key: '/dashboard', icon: <DashboardOutlined />, label: '대시보드', roles: ['admin'] },
          { key: '/customers', icon: <TeamOutlined />, label: '거래처', roles: ['admin'] },
          { key: '/sales', icon: <ShoppingCartOutlined />, label: '매출', roles: ['admin', 'sales_viewer'] },
          { key: '/transaction-ledger', icon: <FileTextOutlined />, label: '거래원장', roles: ['admin', 'sales_viewer'] },
          // 매출 조회 사용자는 더보기 메뉴가 비어 있으므로 거래처 잔액·내 정보를 기본 탭으로 노출
          { key: '/customer-balance', icon: <BankOutlined />, label: '거래처잔액', roles: ['sales_viewer'] },
          { key: '/profile', icon: <UserOutlined />, label: '내 정보', roles: ['sales_viewer'] },
        ].filter(item => item.roles.includes(user?.role || 'admin'));

        // 더보기 드로어에 담을 나머지 메뉴 (주요 탭 제외)
        const moreItems = [
          { key: '/purchases', icon: <FileTextOutlined />, label: '매입 관리', roles: ['admin'] },
          { key: '/inventory', icon: <ShoppingOutlined />, label: '재고 관리', roles: ['admin'] },
          { key: '/products', icon: <ShoppingOutlined />, label: '품목 관리', roles: ['admin'] },
          { key: '/payments', icon: <WalletOutlined />, label: '수금/지급', roles: ['admin'] },
          { key: '/quotations', icon: <SolutionOutlined />, label: '견적서', roles: ['admin'] },
          { key: '/purchase-orders', icon: <FileTextOutlined />, label: '발주서', roles: ['admin'] },
          { key: '/customer-balance', icon: <BankOutlined />, label: '거래처 잔액', roles: ['admin'] },
          { key: '/settings', icon: <SettingOutlined />, label: '설정', roles: ['admin'] },
        ].filter(item => item.roles.includes(user?.role || 'admin'));

        const activeColor = brand.primary;
        const inactiveColor = isDark ? '#8c8c8c' : '#6b7280';
        const moreActive = moreItems.some(m => m.key === location.pathname);

        const tabItems: { key: string; icon: React.ReactNode; label: string; isMore?: boolean }[] = [
          ...primaryItems.map(i => ({ key: i.key, icon: i.icon, label: i.label })),
        ];
        if (moreItems.length > 0) {
          tabItems.push({ key: '__more__', icon: <AppstoreOutlined />, label: '더보기', isMore: true });
        }

        return (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: isDark ? '#1f1f1f' : '#ffffff',
              borderTop: `1px solid ${isDark ? '#303030' : '#eef0f3'}`,
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              zIndex: 1000,
              boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
            }}
          >
            {tabItems.map((item) => {
              const isActive = item.isMore ? moreActive : location.pathname === item.key;
              const color = isActive ? activeColor : inactiveColor;
              return (
                <div
                  key={item.key}
                  onClick={() => (item.isMore ? setMoreDrawerVisible(true) : navigate(item.key))}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    cursor: 'pointer',
                    color,
                    transition: 'all 0.2s',
                    minHeight: '44px',
                    minWidth: '44px',
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? '#1a1a1a' : '#f5f6f8';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ fontSize: '21px', marginBottom: '2px' }}>{item.icon}</div>
                  <Text style={{ fontSize: '10px', color, fontWeight: isActive ? 'bold' : 'normal' }}>
                    {item.label}
                  </Text>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* 더보기 드로어 (하단 시트) */}
      <Drawer
        title="전체 메뉴"
        placement="bottom"
        height="auto"
        open={moreDrawerVisible}
        onClose={() => setMoreDrawerVisible(false)}
        styles={{ body: { padding: '12px 8px 24px' } }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { key: '/purchases', icon: <FileTextOutlined />, label: '매입 관리', roles: ['admin'] },
            { key: '/inventory', icon: <ShoppingOutlined />, label: '재고 관리', roles: ['admin'] },
            { key: '/products', icon: <ShoppingOutlined />, label: '품목 관리', roles: ['admin'] },
            { key: '/payments', icon: <WalletOutlined />, label: '수금/지급', roles: ['admin'] },
            { key: '/quotations', icon: <SolutionOutlined />, label: '견적서', roles: ['admin'] },
            { key: '/purchase-orders', icon: <FileTextOutlined />, label: '발주서', roles: ['admin'] },
            { key: '/customer-balance', icon: <BankOutlined />, label: '거래처 잔액', roles: ['admin'] },
            { key: '/settings', icon: <SettingOutlined />, label: '설정', roles: ['admin'] },
            { key: '/profile', icon: <UserOutlined />, label: '내 정보', roles: ['admin', 'sales_viewer'] },
          ].filter(item => item.roles.includes(user?.role || 'admin')).map((item) => {
            const isActive = location.pathname === item.key;
            return (
              <div
                key={item.key}
                onClick={() => { setMoreDrawerVisible(false); navigate(item.key); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '14px 4px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: isActive ? (isDark ? '#15314f' : brand.primary + '14') : (isDark ? '#262626' : '#f7f8fa'),
                  color: isActive ? brand.primary : (isDark ? '#d1d5db' : '#374151'),
                }}
              >
                <div style={{ fontSize: '24px' }}>{item.icon}</div>
                <Text style={{ fontSize: '12px', color: isActive ? brand.primary : (isDark ? '#d1d5db' : '#374151') }}>
                  {item.label}
                </Text>
              </div>
            );
          })}
        </div>
      </Drawer>
    </Layout>
  );
};

export default AppLayout;