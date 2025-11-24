import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Typography, Alert, Progress, Space } from 'antd';
import { SafetyOutlined, ClockCircleOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import { api, authAPI } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;

export const OTPPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const loginCredentials = location.state?.credentials;
  const email = loginCredentials?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60); // 1분
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState('');
  const [sendCount, setSendCount] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 로그인 정보가 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!loginCredentials || !email) {
      navigate('/login');
    }
  }, [loginCredentials, email, navigate]);

  // 타이머
  useEffect(() => {
    if (timeLeft > 0 && !isExpired) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsExpired(true);
    }
  }, [timeLeft, isExpired]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // 숫자만 허용

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // 마지막 한 자리만
    setOtp(newOtp);

    // 다음 입력으로 자동 이동
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // 6자리 모두 입력되면 자동 검증
    if (newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pasteData.split('').concat(Array(6 - pasteData.length).fill(''));
    setOtp(newOtp);

    if (newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleResend = async () => {
    try {
      setIsSending(true);
      setError('');

      const response = await api.post('/otp/send', { email });

      setOtp(['', '', '', '', '', '']);
      setTimeLeft(60);
      setIsExpired(false);
      setSendCount(response.data.sendCount);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP 재전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (code: string) => {
    try {
      setIsVerifying(true);
      setError('');

      const response = await api.post('/otp/verify', { email, code });

      if (response.data.verified) {
        // OTP 검증 성공 후 실제 로그인
        const loginResponse = await authAPI.login(loginCredentials);
        const { user, token } = loginResponse.data.data;

        setAuth(user, token);

        // 역할에 따라 다른 페이지로 이동
        if (user.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/sales');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP 검증에 실패했습니다.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!email) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          borderRadius: '12px',
        }}
        styles={{ body: { padding: '40px' } }}
      >
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #1890ff, #096dd9)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <SafetyOutlined style={{ fontSize: '32px', color: '#ffffff' }} />
          </div>
          <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
            OTP 인증
          </Title>
          <Text type="secondary">
            등록하신 휴대폰번호로 전송된<br />
            6자리 인증번호를 입력해주세요
          </Text>
        </div>

        {/* OTP 입력 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '24px',
          }}
          onPaste={handlePaste}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              disabled={isExpired || isVerifying}
              style={{
                width: '56px',
                height: '64px',
                textAlign: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                border: '2px solid #d9d9d9',
                borderRadius: '8px',
                outline: 'none',
                transition: 'all 0.3s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1890ff';
                e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d9d9d9';
                e.target.style.boxShadow = 'none';
              }}
            />
          ))}
        </div>

        {/* 타이머 및 상태 */}
        <div style={{ marginBottom: '24px' }}>
          {isExpired ? (
            <Alert
              message="인증번호가 만료되었습니다"
              description="재전송 버튼을 눌러 새로운 인증번호를 받아주세요"
              type="error"
              showIcon
              icon={<ClockCircleOutlined />}
              style={{ marginBottom: '16px' }}
            />
          ) : (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <Text strong>
                  <ClockCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  남은 시간
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: '20px',
                    color: timeLeft <= 10 ? '#ff4d4f' : '#1890ff',
                  }}
                >
                  {formatTime(timeLeft)}
                </Text>
              </div>
              <Progress
                percent={(timeLeft / 60) * 100}
                showInfo={false}
                strokeColor={timeLeft <= 10 ? '#ff4d4f' : '#1890ff'}
                style={{ marginBottom: '8px' }}
              />
            </div>
          )}
          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            전송 횟수: <Text strong>{sendCount}회</Text>
          </Text>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* 검증 중 표시 */}
        {isVerifying && (
          <Alert
            message="인증 확인 중..."
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* 버튼 */}
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleResend}
            disabled={!isExpired || isSending}
            loading={isSending}
            size="large"
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {isSending ? '전송 중...' : '재전송'}
          </Button>
          <Button
            icon={<CloseOutlined />}
            onClick={() => navigate('/login')}
            size="large"
            danger
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            취소
          </Button>
        </Space>
      </Card>
    </div>
  );
};
