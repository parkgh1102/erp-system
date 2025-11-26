import React, { useEffect, useRef, useCallback } from 'react';
import { Modal, App } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const TOKEN_EXPIRATION_MS = 2 * 60 * 60 * 1000; // 2시간 (밀리초)
const WARNING_TIME_MS = 5 * 60 * 1000; // 5분 전 (밀리초)
const CHECK_INTERVAL_MS = 30 * 1000; // 30초마다 체크

export const TokenExpirationNotifier: React.FC = () => {
  const { message } = App.useApp();
  const { isAuthenticated, loginTime, refreshToken, logout, user } = useAuthStore();
  const warningShownRef = useRef(false);
  const navigate = useNavigate();

  // 로그아웃 처리
  const handleLogout = useCallback(() => {
    message.warning('세션이 만료되어 로그아웃되었습니다.');
    logout();
    navigate('/login');
  }, [logout, navigate, message]);

  // 토큰 갱신
  const handleRefreshToken = useCallback(async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      if (response.data.success) {
        refreshToken();
        warningShownRef.current = false;
        message.success('세션이 2시간 연장되었습니다.');
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      message.error('세션 연장에 실패했습니다. 다시 로그인해주세요.');
      handleLogout();
    }
  }, [refreshToken, message, handleLogout]);

  // 경고 모달 표시
  const showExpirationWarning = useCallback(() => {
    if (warningShownRef.current) return;
    warningShownRef.current = true;

    Modal.confirm({
      title: '세션 만료 알림',
      content: '5분 후 세션이 만료됩니다. 계속 사용하시겠습니까?',
      okText: '연장하기',
      cancelText: '로그아웃',
      onOk: handleRefreshToken,
      onCancel: handleLogout,
    });
  }, [handleRefreshToken, handleLogout]);

  useEffect(() => {
    if (!isAuthenticated || !loginTime) {
      return;
    }

    // sales_viewer(서브 아이디)는 토큰 만료 체크 안 함
    if (user?.role === 'sales_viewer') {
      return;
    }

    // 즉시 한 번 체크
    const checkExpiration = () => {
      const now = Date.now();
      const expirationTime = loginTime + TOKEN_EXPIRATION_MS;
      const warningTime = expirationTime - WARNING_TIME_MS;

      // 이미 만료된 경우
      if (now >= expirationTime) {
        console.log('토큰이 만료되었습니다. 로그아웃 처리합니다.');
        handleLogout();
        return;
      }

      // 경고 시간이 지났지만 아직 알림을 보여주지 않은 경우
      if (now >= warningTime && !warningShownRef.current) {
        showExpirationWarning();
      }
    };

    // 초기 체크
    checkExpiration();

    // 주기적으로 체크
    const intervalId = setInterval(checkExpiration, CHECK_INTERVAL_MS);

    // 만료 시간에 맞춰 정확한 타이머 설정
    const expirationTime = loginTime + TOKEN_EXPIRATION_MS;
    const timeUntilExpiration = expirationTime - Date.now();

    let expirationTimer: NodeJS.Timeout | null = null;
    if (timeUntilExpiration > 0) {
      expirationTimer = setTimeout(() => {
        console.log('토큰이 만료되었습니다. 자동 로그아웃합니다.');
        handleLogout();
      }, timeUntilExpiration);
    }

    // 경고 시간에 맞춰 타이머 설정
    const warningTime = expirationTime - WARNING_TIME_MS;
    const timeUntilWarning = warningTime - Date.now();

    let warningTimer: NodeJS.Timeout | null = null;
    if (timeUntilWarning > 0 && !warningShownRef.current) {
      warningTimer = setTimeout(() => {
        showExpirationWarning();
      }, timeUntilWarning);
    }

    return () => {
      clearInterval(intervalId);
      if (expirationTimer) clearTimeout(expirationTimer);
      if (warningTimer) clearTimeout(warningTimer);
    };
  }, [isAuthenticated, loginTime, user?.role, handleLogout, showExpirationWarning]);

  // 로그인 시간이 변경되면 경고 상태 초기화
  useEffect(() => {
    warningShownRef.current = false;
  }, [loginTime]);

  return null;
};

export default TokenExpirationNotifier;
