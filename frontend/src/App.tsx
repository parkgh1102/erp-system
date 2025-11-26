import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import AppLayout from './components/Layout/AppLayout';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import PasswordReset from './components/Auth/PasswordReset';
import PasswordChange from './components/Auth/PasswordChange';
import { OTPPage } from './components/Auth/OTPPage';
import Dashboard from './components/Dashboard/Dashboard';
import CustomerManagement from './components/Customer/CustomerManagement';
import ProductManagement from './components/Product/ProductManagement';
import SalesManagement from './components/Sales/SalesManagement';
import PurchaseManagement from './components/Purchase/PurchaseManagement';
import PaymentManagement from './components/Payment/PaymentManagement';
import TransactionLedgerManagement from './components/TransactionLedger/TransactionLedgerManagement';
import Profile from './components/Profile/Profile';
import Settings from './components/Settings/Settings';
import TokenExpirationNotifier from './components/Common/TokenExpirationNotifier';
import ChatbotWidget from './components/Chatbot/ChatbotWidget';
import koKR from 'antd/locale/ko_KR';
import 'dayjs/locale/ko';

// 보호된 라우트 컴포넌트
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

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
  const { getThemeConfig } = useThemeStore();

  // 공개 페이지 경로 목록 (다크모드 비활성화)
  const publicPaths = ['/login', '/signup', '/otp', '/password-reset', '/password-change'];
  const isPublicPage = publicPaths.includes(location.pathname);

  // 공개 페이지는 항상 라이트 테마 사용
  const themeConfig = isPublicPage
    ? {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
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
    <>
      <TokenExpirationNotifier />
      {/* 로그인된 사용자에게만 챗봇 표시 */}
      {isAuthenticated && <ChatbotWidget />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeWrapper>
        <AppContent />
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
          <Route path="/otp" element={<OTPPage />} />
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
      </ThemeWrapper>
    </Router>
  );
};

export default App;