import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';

const TOKEN_EXPIRATION_MS = 2 * 60 * 60 * 1000; // 2시간 (밀리초)
const WARNING_TIME_MS = 5 * 60 * 1000; // 5분 전 (밀리초)

export const TokenExpirationNotifier: React.FC = () => {
  const { isAuthenticated, loginTime, refreshToken, logout, user } = useAuthStore();
  const [notificationShown, setNotificationShown] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !loginTime) {
      return;
    }

    // sales_viewer(서브 아이디)는 토큰 만료 체크 안 함
    if (user?.role === 'sales_viewer') {
      return;
    }

    // 토큰 만료 시간 계산
    const expirationTime = loginTime + TOKEN_EXPIRATION_MS;
    const warningTime = expirationTime - WARNING_TIME_MS;
    const now = Date.now();

    // 이미 만료된 경우
    if (now >= expirationTime) {
      console.log('토큰이 이미 만료되었습니다. 로그아웃 처리합니다.');
      logout();
      return;
    }

    // 경고 시간이 지났지만 아직 알림을 보여주지 않은 경우
    if (now >= warningTime && !notificationShown) {
      showExpirationWarning();
      setNotificationShown(true);
      return;
    }

    // 경고 시간까지 타이머 설정
    const timeUntilWarning = warningTime - now;
    if (timeUntilWarning > 0 && !notificationShown) {
      const warningTimer = setTimeout(() => {
        showExpirationWarning();
        setNotificationShown(true);
      }, timeUntilWarning);

      return () => clearTimeout(warningTimer);
    }

    // 만료 시간에 자동 로그아웃 타이머 설정
    const timeUntilExpiration = expirationTime - now;
    if (timeUntilExpiration > 0) {
      const expirationTimer = setTimeout(() => {
        console.log('토큰이 만료되었습니다. 로그아웃 처리합니다.');
        logout();
      }, timeUntilExpiration);

      return () => clearTimeout(expirationTimer);
    }
  }, [isAuthenticated, loginTime, notificationShown, logout, user]);

  const showExpirationWarning = () => {
    Modal.confirm({
      title: '세션 만료 알림',
      content: '5분 후 세션이 만료됩니다. 계속 사용하시겠습니까?',
      okText: '연장하기',
      cancelText: '로그아웃',
      onOk: async () => {
        try {
          // 토큰 갱신 API 호출
          const response = await api.post('/auth/refresh-token');
          if (response.data.success) {
            // 로그인 시간 업데이트
            refreshToken();
            setNotificationShown(false); // 다음 경고를 위해 초기화
            console.log('토큰이 갱신되었습니다.');
            Modal.success({
              title: '세션 연장 완료',
              content: '세션이 2시간 연장되었습니다.',
            });
          }
        } catch (error) {
          console.error('토큰 갱신 실패:', error);
          Modal.error({
            title: '세션 연장 실패',
            content: '세션 연장에 실패했습니다. 다시 로그인해주세요.',
            onOk: logout,
          });
        }
      },
      onCancel: () => {
        logout();
      },
    });
  };

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다
};

export default TokenExpirationNotifier;
