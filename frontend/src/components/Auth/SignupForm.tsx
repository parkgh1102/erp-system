import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Divider,
  Steps,
  ConfigProvider,
  theme,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import { formatPhoneNumber, formatBusinessNumber, formatFaxNumber } from '../../utils/formatters';
import { validatePassword } from '../../utils/passwordValidator';
import PasswordStrengthIndicator from '../Common/PasswordStrengthIndicator';

const { Title, Text } = Typography;
const { Step } = Steps;

const SignupForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [personalInfo, setPersonalInfo] = useState<any>({});
  const [emailCheckStatus, setEmailCheckStatus] = useState<'checking' | 'success' | 'error' | null>(null);
  const [emailCheckMessage, setEmailCheckMessage] = useState<string>('');
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState(validatePassword(''));
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // 이메일 중복 체크 함수
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailCheckStatus(null);
      setEmailCheckMessage('');
      return;
    }

    setEmailCheckStatus('checking');
    setEmailCheckMessage('이메일 확인 중...');

    try {
      const response = await authAPI.checkEmailAvailability(email);
      if (response.data.success) {
        if (response.data.available) {
          setEmailCheckStatus('success');
          setEmailCheckMessage('사용 가능한 이메일입니다.');
        } else {
          setEmailCheckStatus('error');
          setEmailCheckMessage('이미 사용 중인 이메일입니다.');
        }
      }
    } catch (error: any) {
      setEmailCheckStatus('error');
      setEmailCheckMessage(error.response?.data?.message || '이메일 확인에 실패했습니다.');
    }
  };

  // 이메일 실시간 체크를 위한 useEffect
  const [emailValue, setEmailValue] = useState('');

  useEffect(() => {
    if (!emailValue) {
      setEmailCheckStatus(null);
      setEmailCheckMessage('');
      return;
    }

    const timer = setTimeout(() => {
      checkEmailAvailability(emailValue);
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timer);
  }, [emailValue]);

  // 두 번째 단계로 왔을 때 개인정보가 없으면 첫 번째 단계로 돌아가기
  useEffect(() => {
    if (currentStep === 1 && (!personalInfo.email || !personalInfo.password || !personalInfo.name)) {
      setCurrentStep(0);
    }
  }, [currentStep, personalInfo]);

  const onFinish = async (_values: any) => {
    setLoading(true);
    setError(null);

    try {
      // 모든 필드 검증
      await form.validateFields();

      // 두 번째 단계 데이터를 상태에 저장
      const currentValues = form.getFieldsValue();
      const currentBusinessInfo = {
        businessNumber: currentValues.businessNumber,
        companyName: currentValues.companyName,
        representative: currentValues.representative,
        businessType: currentValues.businessType || '',
        businessItem: currentValues.businessItem || '',
        address: currentValues.address || '',
        phone: currentValues.businessPhone || '',
        fax: currentValues.fax || '',
      };

      // personalInfo가 비어있는지 확인
      if (!personalInfo.email || !personalInfo.password || !personalInfo.name) {
        setError('개인정보가 누락되었습니다. 이전 단계로 돌아가서 다시 입력해주세요.');
        return;
      }


      const signupData = {
        email: personalInfo.email,
        password: personalInfo.password,
        name: personalInfo.name,
        phone: personalInfo.phone,
        businessInfo: currentBusinessInfo,
      };

      const response = await authAPI.signup(signupData);
      const { user, token } = response.data.data;

      setAuth(user, token);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.response) {
        setError(error.response.data?.message || '회원가입 중 오류가 발생했습니다.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['email', 'password', 'confirmPassword', 'name', 'phone']);
        // 첫 번째 단계 데이터를 상태에 저장
        const values = form.getFieldsValue(['email', 'password', 'name', 'phone']);

        // 필수 데이터 확인
        if (!values.email || !values.password || !values.name || !values.phone) {
          return;
        }

        setPersonalInfo(values);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // 폼 검증 실패 처리
    }
  };

  const prevStep = () => {
    if (currentStep === 1) {
      // 사업자정보에서 개인정보로 돌아갈 때 개인정보 복원
      if (personalInfo.email || personalInfo.password || personalInfo.name || personalInfo.phone) {
        form.setFieldsValue({
          email: personalInfo.email,
          password: personalInfo.password,
          name: personalInfo.name,
          phone: personalInfo.phone,
        });
      }
    }
    setCurrentStep(currentStep - 1);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateBusinessNumber = (businessNumber: string) => {
    const cleanNumber = businessNumber.replace(/-/g, '');
    if (cleanNumber.length !== 10) return false;

    const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanNumber[i]) * weights[i];
    }

    const remainder = sum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;

    return parseInt(cleanNumber[9]) === checkDigit;
  };

  const renderStep0 = () => (
    <>
      <Form.Item
        name="email"
        hasFeedback
        validateStatus={emailCheckStatus === 'checking' ? 'validating' : emailCheckStatus === 'success' ? 'success' : emailCheckStatus === 'error' ? 'error' : ''}
        help={emailCheckMessage}
        rules={[
          { required: true, message: '이메일을 입력해주세요' },
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();

              if (!validateEmail(value)) {
                return Promise.reject(new Error('올바른 이메일 형식이 아닙니다'));
              }

              if (emailCheckStatus === 'error') {
                return Promise.reject(new Error(emailCheckMessage));
              }

              return Promise.resolve();
            },
          },
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="사업자 이메일"
          style={{ borderRadius: '8px' }}
          onChange={(e) => {
            const email = e.target.value;
            form.setFieldsValue({ email });
            setEmailValue(email);
            // 이메일 값이 변경되면 상태를 초기화
            setEmailCheckStatus(null);
            setEmailCheckMessage('');
          }}
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '비밀번호를 입력해주세요' },
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();

              const strength = validatePassword(value);
              if (!strength.isValid) {
                return Promise.reject(new Error('비밀번호가 보안 요구사항을 충족하지 않습니다'));
              }

              return Promise.resolve();
            },
          },
        ]}
      >
        <div>
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="비밀번호 (8자 이상, 대소문자, 숫자, 특수문자 포함)"
            style={{ borderRadius: '8px' }}
            onChange={(e) => {
              const password = e.target.value;
              setPasswordValue(password);
              setPasswordStrength(validatePassword(password));
              form.setFieldsValue({ password });
            }}
          />
          <PasswordStrengthIndicator
            password={passwordValue}
            strength={passwordStrength}
            showRequirements={true}
          />
        </div>
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: '비밀번호를 다시 입력해주세요' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('비밀번호가 일치하지 않습니다'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="비밀번호 확인"
          style={{ borderRadius: '8px' }}
        />
      </Form.Item>

      <Form.Item
        name="name"
        rules={[
          { required: true, message: '이름을 입력해주세요' },
          { min: 2, message: '이름은 2자 이상이어야 합니다' },
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="이름"
          style={{ borderRadius: '8px' }}
        />
      </Form.Item>

      <Form.Item
        name="phone"
        rules={[
          { required: true, message: '전화번호를 입력해주세요' },
          { pattern: /^[0-9-+\s()]+$/, message: '올바른 전화번호 형식이 아닙니다' },
        ]}
      >
        <Input
          prefix={<PhoneOutlined />}
          placeholder="전화번호"
          style={{ borderRadius: '8px' }}
          onChange={(e) => {
            const formatted = formatPhoneNumber(e.target.value);
            form.setFieldsValue({ phone: formatted });
          }}
        />
      </Form.Item>
    </>
  );

  const renderStep1 = () => (
    <>
      <Form.Item
        name="businessNumber"
        rules={[
          { required: true, message: '사업자번호를 입력해주세요' },
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();

              const formatted = value.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
              form.setFieldsValue({ businessNumber: formatted });

              if (!validateBusinessNumber(value)) {
                return Promise.reject(new Error('올바른 사업자번호가 아닙니다'));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input
          prefix={<ShopOutlined />}
          placeholder="사업자번호 (000-00-00000)"
          style={{ borderRadius: '8px' }}
          maxLength={12}
          onChange={(e) => {
            const formatted = formatBusinessNumber(e.target.value);
            form.setFieldsValue({ businessNumber: formatted });
          }}
        />
      </Form.Item>

      <Form.Item
        name="companyName"
        rules={[
          { required: true, message: '상호명을 입력해주세요' },
          { max: 200, message: '상호명은 200자 이하여야 합니다' },
        ]}
      >
        <Input
          prefix={<ShopOutlined />}
          placeholder="상호명"
          style={{ borderRadius: '8px' }}
        />
      </Form.Item>

      <Form.Item
        name="representative"
        rules={[
          { required: true, message: '대표자명을 입력해주세요' },
          { max: 100, message: '대표자명은 100자 이하여야 합니다' },
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="대표자명"
          style={{ borderRadius: '8px' }}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="businessType"
            rules={[{ max: 100, message: '업태는 100자 이하여야 합니다' }]}
          >
            <Input
              placeholder="업태"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="businessItem"
            rules={[{ max: 100, message: '종목은 100자 이하여야 합니다' }]}
          >
            <Input
              placeholder="종목"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="address"
        rules={[{ max: 500, message: '주소는 500자 이하여야 합니다' }]}
      >
        <Input
          prefix={<HomeOutlined />}
          placeholder="주소"
          style={{ borderRadius: '8px' }}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="businessPhone"
            rules={[{ max: 20, message: '전화번호는 20자 이하여야 합니다' }]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="회사 전화번호"
              style={{ borderRadius: '8px' }}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                form.setFieldsValue({ businessPhone: formatted });
              }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="fax"
            rules={[{ max: 20, message: '팩스번호는 20자 이하여야 합니다' }]}
          >
            <Input
              placeholder="팩스번호"
              style={{ borderRadius: '8px' }}
              onChange={(e) => {
                const formatted = formatFaxNumber(e.target.value);
                form.setFieldsValue({ fax: formatted });
              }}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
        components: {
          Form: {
            fontSize: 14,
            itemMarginBottom: 20,
          },
        },
      }}
    >
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
      <style>
        {`
          .ant-form-item-explain,
          .ant-form-item-extra {
            font-size: 14px !important;
            line-height: 1.4 !important;
          }
          .ant-form-item-explain-error {
            font-size: 14px !important;
            color: #ff4d4f !important;
            font-weight: 500 !important;
          }
          .ant-form-item-explain-success {
            font-size: 14px !important;
            color: #52c41a !important;
            font-weight: 500 !important;
          }
        `}
      </style>
      <Card
        style={{
          width: '100%',
          maxWidth: '600px',
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
            회원가입
          </Title>
          <Text type="secondary">ERP 시스템 계정을 생성하세요</Text>
        </div>

        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          <Step title="개인정보" description="계정 정보 입력" />
          <Step title="사업자정보" description="회사 정보 입력" />
        </Steps>

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
          name="signup"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          {currentStep === 0 ? renderStep0() : renderStep1()}

          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {currentStep > 0 && (
                <Button
                  onClick={prevStep}
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  이전
                </Button>
              )}

              {currentStep < 1 ? (
                <Button
                  type="primary"
                  onClick={nextStep}
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                    border: 'none',
                  }}
                >
                  다음
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #52c41a, #389e0d)',
                    border: 'none',
                  }}
                >
                  {loading ? '가입 중...' : '회원가입 완료'}
                </Button>
              )}
            </div>
          </Form.Item>

          <Divider style={{ margin: '24px 0' }}>
            <Text type="secondary">또는</Text>
          </Divider>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/login"
                style={{ color: '#1890ff', fontWeight: 'bold' }}
              >
                로그인
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
    </ConfigProvider>
  );
};

export default SignupForm;