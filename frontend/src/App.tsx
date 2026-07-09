import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme, Spin } from 'antd';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { antdSeedToken } from './styles/tokens';
import { getSessionTimeoutMs } from './utils/session';
import AppLayout from './components/Layout/AppLayout';
import koKR from 'antd/locale/ko_KR';
import 'dayjs/locale/ko';

// Lazy loaded components for code splitting
const LoginForm = lazy(() => import('./components/Auth/LoginForm'));
const SignupForm = lazy(() => import('./components/Auth/SignupForm'));
const PasswordReset = lazy(() => import('./components/Auth/PasswordReset'));
const PasswordChange = lazy(() => import('./components/Auth/PasswordChange'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const CustomerManagement = lazy(() => import('./components/Customer/CustomerManagement'));
const ProductManagement = lazy(() => import('./components/Product/ProductManagement'));
const SalesManagement = lazy(() => import('./components/Sales/SalesManagement'));
const PurchaseManagement = lazy(() => import('./components/Purchase/PurchaseManagement'));
const InventoryManagement = lazy(() => import('./components/Inventory/InventoryManagement'));
const PaymentManagement = lazy(() => import('./components/Payment/PaymentManagement'));
const TransactionLedgerManagement = lazy(() => import('./components/TransactionLedger/TransactionLedgerManagement'));
const Profile = lazy(() => import('./components/Profile/Profile'));
const Settings = lazy(() => import('./components/Settings/Settings'));
const QuotationManagement = lazy(() => import('./components/Quotation/QuotationManagement'));
const PurchaseOrderManagement = lazy(() => import('./components/PurchaseOrder/PurchaseOrderManagement'));
const CustomerBalanceManagement = lazy(() => import('./components/CustomerBalance/CustomerBalanceManagement'));
const TokenExpirationNotifier = lazy(() => import('./components/Common/TokenExpirationNotifier'));
const ChatbotWidget = lazy(() => import('./components/Chatbot/ChatbotWidget'));

// Loading fallback component
const PageLoader: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
    <Spin size="large" />
  </div>
);

// 세션 타임아웃 계산은 utils/session.ts로 단일화 (getSessionTimeoutMs)

// 보호된 라우트 컴포넌트
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loginTime, logout } = useAuthStore();

  // 세션 타임아웃 체크
  React.useEffect(() => {
    if (isAuthenticated && loginTime) {
      const sessionTimeoutMs = getSessionTimeoutMs();
      const elapsed = Date.now() - loginTime;

      if (elapsed >= sessionTimeoutMs) {
        // 세션 만료
        logout();
        localStorage.removeItem('sessionTimeout');
        return;
      }

      // 남은 시간 후 자동 로그아웃 타이머 설정
      const remainingTime = sessionTimeoutMs - elapsed;
      const timer = setTimeout(() => {
        logout();
        localStorage.removeItem('sessionTimeout');
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loginTime, logout]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 공개 라우트 컴포넌트 (이미 로그인된 경우 역할에 따라 리다이렉트)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    // 역할에 따라 다른 페이지로 리다이렉트
    if (user?.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/sales" replace />;
    }
  }

  return <>{children}</>;
};

// 테마 래퍼 컴포넌트 (라우터 내부에서 사용)
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { getThemeConfig, isDark } = useThemeStore();

  // 공개 페이지 경로 목록 (다크모드 비활성화)
  const publicPaths = ['/login', '/signup', '/password-reset', '/password-change'];
  const isPublicPage = publicPaths.includes(location.pathname);

  // static message/notification은 body 포털이라 AppLayout의 .dark-mode 조상에 못 닿음.
  // 토스트 전용 다크 신호를 <html>에 부여(기존 .dark-mode 포털 죽은규칙을 깨우지 않도록 전용 클래스 사용).
  useEffect(() => {
    const on = isDark && !isPublicPage;
    document.documentElement.classList.toggle('erp-dark', on);
    return () => {
      // 언마운트 시 정리(공개 페이지 전환 등)
    };
  }, [isDark, isPublicPage]);

  // 공개 페이지는 항상 라이트 테마 사용
  const themeConfig = isPublicPage
    ? {
        algorithm: theme.defaultAlgorithm,
        token: {
          ...antdSeedToken,
        },
      }
    : getThemeConfig();

  return (
    <ConfigProvider theme={themeConfig} locale={koKR}>
      <AntApp
        message={{ top: 24, duration: 3, maxCount: 1 }}
        notification={{ placement: 'top' }}
      >
        {children}
      </AntApp>
    </ConfigProvider>
  );
};

// 라우터 내부에서 사용하는 컴포넌트 (useNavigate 사용 가능)
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Suspense fallback={null}>
      <TokenExpirationNotifier />
      {/* 로그인된 사용자에게만 챗봇 표시 */}
      {isAuthenticated && <ChatbotWidget />}
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeWrapper>
        <AppContent />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* 공개 라우트 */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginForm />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupForm />
              </PublicRoute>
            }
          />
          <Route
            path="/password-reset"
            element={
              <PublicRoute>
                <PasswordReset />
              </PublicRoute>
            }
          />
          <Route
            path="/password-change"
            element={
              <PublicRoute>
                <PasswordChange />
              </PublicRoute>
            }
          />

          {/* 보호된 라우트 */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CustomerManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProductManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SalesManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PurchaseManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <InventoryManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PaymentManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transaction-ledger"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TransactionLedgerManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <QuotationManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase-orders"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PurchaseOrderManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-balance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CustomerBalanceManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          {/* 기본 리다이렉트 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {(() => {
                  const { user } = useAuthStore.getState();
                  if (user?.role === 'admin') {
                    return <Navigate to="/dashboard" replace />;
                  } else {
                    return <Navigate to="/sales" replace />;
                  }
                })()}
              </ProtectedRoute>
            }
          />

          {/* 404 페이지 */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>페이지를 찾을 수 없습니다</h2>
                    <p>요청하신 페이지가 존재하지 않습니다.</p>
                  </div>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        </Suspense>
      </ThemeWrapper>
    </Router>
  );
};

export default App;