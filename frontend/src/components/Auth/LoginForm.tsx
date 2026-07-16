import React, { useState } from 'react';
import { Form, Input, Button, Typography, Alert, Divider, Segmented } from 'antd';
import { LockOutlined, MailOutlined, PhoneOutlined, QuestionCircleOutlined, ArrowRightOutlined, CheckOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import { AxiosErrorResponse } from '../../types';

const { Text } = Typography;

const BRAND_FEATURES = [
  '매출·매입·견적·발주를 한 흐름으로',
  '거래명세표·거래원장 인쇄 및 PDF 출력',
  '국세청 계산서 엑셀 연동',
  '실시간 대시보드로 보는 매출 현황',
];

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
    <div className="erp-auth-split">
      <aside className="erp-auth-brand">
        <div className="erp-auth-logo">
          <ShopOutlined />
        </div>
        <h1 className="erp-auth-headline">
          매출부터 세금계산서까지,
          <br />한 곳에서.
        </h1>
        <p className="erp-auth-sub">
          ERP 통합시스템은 중소사업체의 거래 관리에 필요한 모든 것을 하나의 화면에 모았습니다.
        </p>
        <ul className="erp-auth-features">
          {BRAND_FEATURES.map((feature) => (
            <li key={feature} className="erp-auth-feature">
              <span className="erp-auth-feature-icon">
                <CheckOutlined />
              </span>
              {feature}
            </li>
          ))}
        </ul>
        <div className="erp-auth-foot">© 2026 ERP 통합시스템</div>
      </aside>

      <main className="erp-auth-pane">
        <div className="erp-auth-form">
          <div className="erp-auth-mark">
            <ShopOutlined />
          </div>
          <h2 className="erp-auth-title">로그인</h2>
          <p className="erp-auth-desc">ERP 시스템에 로그인하세요</p>

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
            <div style={{ marginBottom: '16px' }}>
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
                block
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
                <Input prefix={<MailOutlined />} placeholder="이메일" />
              </Form.Item>
            ) : (
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: '전화번호를 입력해주세요' },
                  { pattern: /^[0-9-]+$/, message: '올바른 전화번호 형식이 아닙니다' },
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="전화번호 (예: 010-1234-5678)" />
              </Form.Item>
            )}

            <Form.Item
              name="password"
              rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="erp-cta"
                style={{
                  width: '100%',
                  height: '50px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #1B61A8, #0f2c4c)',
                  border: 'none',
                  boxShadow: '0 8px 20px rgba(27, 97, 168, 0.24)',
                }}
              >
                {loading ? (
                  '로그인 중...'
                ) : (
                  <>
                    로그인
                    <span className="erp-cta-arrow">
                      <ArrowRightOutlined />
                    </span>
                  </>
                )}
              </Button>
            </Form.Item>

            <Divider style={{ margin: '24px 0', borderColor: '#e2e8f0' }}>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>또는</Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
              <Button
                block
                icon={<QuestionCircleOutlined />}
                onClick={() => navigate('/password-reset')}
                style={{
                  height: '46px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#475569',
                  borderColor: '#e2e8f0',
                  marginBottom: '20px',
                }}
              >
                아이디 / 비밀번호 찾기
              </Button>
              <Text style={{ color: '#64748b', fontSize: 14 }}>
                계정이 없으신가요?{' '}
                <Link to="/signup" style={{ color: '#1B61A8', fontWeight: 700 }}>
                  회원가입
                </Link>
              </Text>
            </div>
          </Form>
        </div>
      </main>
    </div>
  );
};

const LoginForm: React.FC = () => {
  return (
    <LoginFormContent />
  );
};

export default LoginForm;