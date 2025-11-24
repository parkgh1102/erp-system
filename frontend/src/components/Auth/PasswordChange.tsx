import React, { useState } from 'react';
import { Form, Input, Button, message, Progress, Card, ConfigProvider, theme } from 'antd';
import { UserOutlined, ShopOutlined, ArrowLeftOutlined, PhoneOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface PasswordChangeProps {
  onBack?: () => void;
  onShowLogin?: () => void;
  onShowForgotPassword?: () => void;
}

const PasswordChange: React.FC<PasswordChangeProps> = ({ onBack, onShowLogin, onShowForgotPassword }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  });
  const navigate = useNavigate();

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    let formatted = '';

    if (numbers.length <= 3) {
      formatted = numbers;
    } else if (numbers.length <= 7) {
      formatted = numbers.slice(0, 3) + '-' + numbers.slice(3);
    } else {
      formatted = numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
    }

    return formatted;
  };

  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    let formatted = '';

    if (numbers.length <= 3) {
      formatted = numbers;
    } else if (numbers.length <= 5) {
      formatted = numbers.slice(0, 3) + '-' + numbers.slice(3);
    } else {
      formatted = numbers.slice(0, 3) + '-' + numbers.slice(3, 5) + '-' + numbers.slice(5, 10);
    }

    return formatted;
  };

  const checkPasswordStrength = (password: string) => {
    const criteria = {
      length: password.length >= 8 && password.length <= 20,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    setPasswordCriteria(criteria);

    const score = Object.values(criteria).filter(Boolean).length;
    setPasswordStrength((score / 5) * 100);

    return Object.values(criteria).every(Boolean);
  };

  // 비밀번호 찾기 (정보 검증)
  const handleFindPassword = async (values: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 실제로는 API 호출하여 아이디, 회사명, 사업자등록번호, 전화번호 검증
      const mockData = {
        username: 'testuser123',
        companyName: '테스트회사',
        businessNumber: '123-45-67890',
        phone: '010-1234-5678'
      };

      if (values.username === mockData.username &&
          values.companyName === mockData.companyName &&
          values.businessNumber.replace(/[^0-9]/g, '') === mockData.businessNumber.replace(/[^0-9]/g, '') &&
          values.phone.replace(/[^0-9]/g, '') === mockData.phone.replace(/[^0-9]/g, '')) {

        setCurrentStep(1);
        message.success('정보가 확인되었습니다. 새로운 비밀번호를 설정해주세요.');
      } else {
        message.error('비밀번호 찾기에 실패 했습니다. 입력하신 정보를 다시한번 확인 하시기 바랍니다.');
      }
    } catch (error) {
      message.error('비밀번호 찾기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async (values: any) => {
    setLoading(true);
    try {
      if (!checkPasswordStrength(values.newPassword)) {
        message.error('비밀번호 조건을 만족해야 합니다.');
        return;
      }

      if (values.newPassword !== values.confirmPassword) {
        message.error('입력하신 비밀번호를 확인 하시기 바랍니다.');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      // 실제로는 API 호출하여 비밀번호 변경
      message.success('비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.');

      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error) {
      message.error('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return '#ff4d4f';
    if (passwordStrength < 80) return '#faad14';
    return '#52c41a';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return '약함';
    if (passwordStrength < 80) return '보통';
    return '강함';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 비밀번호 찾기 정보 입력
        return (
          <Form
            form={form}
            name="findPassword"
            onFinish={handleFindPassword}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              name="username"
              label="아이디"
              rules={[{ required: true, message: '아이디를 입력해주세요!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="아이디를 입력하세요"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="companyName"
              label="회사명"
              rules={[{ required: true, message: '회사명을 입력해주세요!' }]}
            >
              <Input
                prefix={<ShopOutlined />}
                placeholder="회사명을 입력하세요"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="businessNumber"
              label="사업자등록번호"
              rules={[
                { required: true, message: '사업자등록번호를 입력해주세요!' },
                { pattern: /^\d{3}-\d{2}-\d{5}$/, message: '올바른 사업자등록번호 형식이 아닙니다!' }
              ]}
            >
              <Input
                prefix={<IdcardOutlined />}
                placeholder="123-45-67890"
                size="large"
                onChange={(e) => {
                  const formatted = formatBusinessNumber(e.target.value);
                  form.setFieldValue('businessNumber', formatted);
                }}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="전화번호"
              rules={[
                { required: true, message: '전화번호를 입력해주세요!' },
                { pattern: /^01[0-9]-\d{4}-\d{4}$/, message: '올바른 휴대폰 번호 형식이 아닙니다!' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="010-1234-5678"
                size="large"
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  form.setFieldValue('phone', formatted);
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                block
              >
                비밀번호 찾기
              </Button>
            </Form.Item>

            <div style={{
              marginTop: '24px',
              textAlign: 'center',
              borderTop: '1px solid #f0f0f0',
              paddingTop: '20px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>아이디와 비밀번호가 생각났다면? </span>
                <Button
                  type="link"
                  style={{
                    padding: '0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1890ff'
                  }}
                  onClick={() => navigate('/login')}
                >
                  로그인하러가기
                </Button>
              </div>
              <div>
                <span style={{ color: '#666', fontSize: '14px' }}>아이디가 생각이 안난다면? </span>
                <Button
                  type="link"
                  style={{
                    padding: '0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1890ff'
                  }}
                  onClick={() => navigate('/password-reset')}
                >
                  아이디 찾으러가기
                </Button>
              </div>
            </div>
          </Form>
        );

      case 1: // 비밀번호 변경
        return (
          <Form
            form={form}
            name="changePassword"
            onFinish={handleChangePassword}
            layout="vertical"
            autoComplete="off"
          >
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <h3 style={{ color: '#52c41a' }}>정보가 확인되었습니다!</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                새로운 비밀번호를 설정해주세요.
              </p>
            </div>

            <Form.Item
              name="newPassword"
              label="새 비밀번호"
              rules={[
                { required: true, message: '새 비밀번호를 입력해주세요!' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (checkPasswordStrength(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('비밀번호 조건을 만족해야 합니다.'));
                  }
                }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="8-20자, 대소문자+숫자+특수문자 포함"
                size="large"
                onChange={(e) => checkPasswordStrength(e.target.value)}
              />
            </Form.Item>

            {form.getFieldValue('newPassword') && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>비밀번호 강도</span>
                  <span style={{ fontSize: '14px', color: getPasswordStrengthColor(), fontWeight: 'bold' }}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <Progress
                  percent={passwordStrength}
                  strokeColor={getPasswordStrengthColor()}
                  showInfo={false}
                  size="default"
                />
                <div style={{ marginTop: '8px', fontSize: '14px' }}>
                  <div style={{ color: passwordCriteria.length ? '#52c41a' : '#ff4d4f', marginBottom: '2px' }}>
                    {passwordCriteria.length ? '✓' : '✗'} 8-20자 길이
                  </div>
                  <div style={{ color: passwordCriteria.lowercase ? '#52c41a' : '#ff4d4f', marginBottom: '2px' }}>
                    {passwordCriteria.lowercase ? '✓' : '✗'} 소문자 포함
                  </div>
                  <div style={{ color: passwordCriteria.uppercase ? '#52c41a' : '#ff4d4f', marginBottom: '2px' }}>
                    {passwordCriteria.uppercase ? '✓' : '✗'} 대문자 포함
                  </div>
                  <div style={{ color: passwordCriteria.number ? '#52c41a' : '#ff4d4f', marginBottom: '2px' }}>
                    {passwordCriteria.number ? '✓' : '✗'} 숫자 포함
                  </div>
                  <div style={{ color: passwordCriteria.special ? '#52c41a' : '#ff4d4f' }}>
                    {passwordCriteria.special ? '✓' : '✗'} 특수문자 포함
                  </div>
                </div>
              </div>
            )}

            <Form.Item
              name="confirmPassword"
              label="새 비밀번호 확인"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '비밀번호 확인을 입력해주세요!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('비밀번호가 일치하지 않습니다!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="비밀번호를 다시 입력해주세요"
                size="large"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                block
              >
                비밀번호 변경 완료
              </Button>
            </Form.Item>
          </Form>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return '비밀번호 찾기';
      case 1: return '비밀번호 변경';
      default: return '비밀번호 찾기';
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#F9F9F9',
        padding: '24px'
      }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/login')}
              style={{ padding: '4px 8px' }}
            />
            <span>{getStepTitle()}</span>
          </div>
        }
        style={{
          width: '100%',
          maxWidth: 600,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}
        headStyle={{
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 24px'
        }}
      >
        {renderStepContent()}
      </Card>
      </div>
    </ConfigProvider>
  );
};

export default PasswordChange;