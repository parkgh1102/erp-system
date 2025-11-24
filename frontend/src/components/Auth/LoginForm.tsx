import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { AxiosErrorResponse } from '../../types';

const { Title, Text } = Typography;

const LoginFormContent: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      // OTP 전송
      await api.post('/otp/send', { email: values.email });

      // OTP 입력 페이지로 이동 (로그인 정보를 state로 전달)
      navigate('/otp', { state: { credentials: values } });
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      const errorMessage = axiosError.response?.data?.message || 'OTP 전송에 실패했습니다.';
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