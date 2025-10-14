import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import AppLayout from './components/Layout/AppLayout';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import PasswordReset from './components/Auth/PasswordReset';
import PasswordChange from './components/Auth/PasswordChange';
import Dashboard from './components/Dashboard/Dashboard';
import CustomerManagement from './components/Customer/CustomerManagement';
import ProductManagement from './components/Product/ProductManagement';
import SalesManagement from './components/Sales/SalesManagement';
import PurchaseManagement from './components/Purchase/PurchaseManagement';
import PaymentManagement from './components/Payment/PaymentManagement';
import TransactionLedgerManagement from './components/TransactionLedger/TransactionLedgerManagement';
import Profile from './components/Profile/Profile';
import Settings from './components/Settings/Settings';
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

// 공개 라우트 컴포넌트 (이미 로그인된 경우 대시보드로 리다이렉트)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { getThemeConfig } = useThemeStore();

  return (
    <ConfigProvider theme={getThemeConfig()} locale={koKR}>
      <AntApp
        message={{ top: 24, duration: 3, maxCount: 1 }}
        notification={{ placement: 'top' }}
      >
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

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
        </Router>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;