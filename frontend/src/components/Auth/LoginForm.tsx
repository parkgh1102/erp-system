import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { api, authAPI, settingsAPI } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import { AxiosErrorResponse } from '../../types';

const { Title, Text } = Typography;

const LoginFormContent: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      // 로그인 API 호출 (보안 설정 정보 포함) - 속도 개선!
      const loginResponse = await authAPI.login(values);
      const { user, token, security } = loginResponse.data.data;

      // 보안 설정에서 2FA 및 세션 타임아웃 정보 가져오기
      const twoFactorEnabled = security?.twoFactorAuth || false;
      const sessionTimeout = security?.sessionTimeout || '24h';

      if (twoFactorEnabled) {
        // 2단계 인증 ON: OTP 전송 후 OTP 페이지로 이동
        const response = await api.post('/otp/send', { email: values.email });
        console.log('OTP 전송 성공:', response.data);
        navigate('/otp', { state: { credentials: values, sessionTimeout } });
      } else {
        // 2단계 인증 OFF: 바로 로그인 처리
        // 세션 타임아웃 저장
        localStorage.setItem('sessionTimeout', sessionTimeout);

        setAuth(user, token);

        // 역할에 따라 다른 페이지로 이동
        if (user.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/sales');
        }
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      console.error('로그인 실패:', axiosError.response?.data, axiosError.message);
      const errorMessage = axiosError.response?.data?.message || '로그인에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: '400px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          borderRadius: '12px',
        }}
        styles={{ body: { padding: '40px' } }}
      >
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
            <UserOutlined style={{ fontSize: '32px', color: '#ffffff' }} />
          </div>
          <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
            로그인
          </Title>
          <Text type="secondary">ERP 시스템에 로그인하세요</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '이메일을 입력해주세요' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="이메일"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="비밀번호"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                border: 'none',
              }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </Form.Item>

          <Divider style={{ margin: '24px 0' }}>
            <Text type="secondary">또는</Text>
          </Divider>

          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px' }}>
              <Text type="secondary">
                계정이 없으신가요?{' '}
                <Link
                  to="/signup"
                  style={{ color: '#1890ff', fontWeight: 'bold' }}
                >
                  회원가입
                </Link>
              </Text>
            </div>
            <div>
              <Text type="secondary">
                아이디 또는 비밀번호를 모르시나요?{' '}
                <Link
                  to="/password-reset"
                  style={{ color: '#1890ff', fontWeight: 'bold' }}
                >
                  찾으러가기
                </Link>
              </Text>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

const LoginForm: React.FC = () => {
  return (
    <LoginFormContent />
  );
};

export default LoginForm;