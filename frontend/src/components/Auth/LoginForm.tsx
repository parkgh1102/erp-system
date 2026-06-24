import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Divider, Segmented } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import { AxiosErrorResponse } from '../../types';

const { Title, Text } = Typography;

const LoginFormContent: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (values: { email?: string; phone?: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      // 로그인 API 호출
      const loginData = loginType === 'email'
        ? { email: values.email, password: values.password }
        : { phone: values.phone, password: values.password };
      const loginResponse = await authAPI.login(loginData);
      const { user, token, security } = loginResponse.data.data;

      // 세션 타임아웃 저장
      const sessionTimeout = security?.sessionTimeout || '24h';
      localStorage.setItem('sessionTimeout', sessionTimeout);

      setAuth(user, token);

      // 역할에 따라 다른 페이지로 이동
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/sales');
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
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
        background: '#ffffff',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#f0f2f5',
          border: '1px solid #e4e6ef',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
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
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <Segmented
              options={[
                { label: '관리자', value: 'email' },
                { label: '사용자', value: 'phone' },
              ]}
              value={loginType}
              onChange={(value) => {
                setLoginType(value as 'email' | 'phone');
                form.resetFields(['email', 'phone']);
              }}
              style={{
                width: '100%',
                padding: '4px',
                backgroundColor: '#f0f5ff',
                border: '2px solid #1890ff',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
              className="login-segmented"
            />
          </div>

          {loginType === 'email' ? (
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
          ) : (
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '전화번호를 입력해주세요' },
                { pattern: /^[0-9-]+$/, message: '올바른 전화번호 형식이 아닙니다' },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="전화번호 (예: 010-1234-5678)"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>
          )}

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