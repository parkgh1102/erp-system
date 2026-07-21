import React, { useState } from 'react';
import { Form, Input, Button, Card, Steps, Result, Progress, ConfigProvider, theme, App, Segmented } from 'antd';
import { UserOutlined, ShopOutlined, ArrowLeftOutlined, CheckCircleOutlined, PhoneOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { passwordResetAPI } from '../../utils/api';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface PasswordResetProps {
  onBack?: () => void;
  onLoginSuccess?: () => void;
  onShowRegister?: () => void;
}

const { Step } = Steps;

const PasswordReset: React.FC<PasswordResetProps> = ({ onBack, onLoginSuccess, onShowRegister }) => {
  const { message } = App.useApp();
  const { isMobile } = useMediaQuery();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // 'admin' = 관리자(이메일) 찾기 흐름, 'user' = 매출조회 사용자(전화번호) 찾기 흐름
  const [userType, setUserType] = useState<'admin' | 'user'>('admin');
  const [svPhone, setSvPhone] = useState<string>('');
  const [form] = Form.useForm();
  const [foundUserId, setFoundUserId] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  // OTP(본인인증) 단계 상태
  const [otpStage, setOtpStage] = useState(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [phoneMasked, setPhoneMasked] = useState<string>('');
  const [devCode, setDevCode] = useState<string>('');
  const [verifyPayload, setVerifyPayload] = useState<{ email: string; companyName: string; businessNumber: string; phone: string } | null>(null);
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

  // 아이디 찾기
  const handleFindUsername = async (values: any) => {
    setLoading(true);
    try {
      const response = await passwordResetAPI.findUsername({
        companyName: values.companyName,
        businessNumber: values.businessNumber,
        phone: values.phone
      });

      if (response.success) {
        // 백엔드는 마스킹된 email을 내려준다 (fullEmail이라는 필드는 없음)
        setFoundUserId(response.data.email);
        setCurrentStep(1);
        message.success('아이디를 찾았습니다!');
      } else {
        message.error(response.message || '아이디를 찾을 수 없습니다.');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '아이디 찾기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 찾기 (정보 검증) → OTP 발송
  const handleFindPassword = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        email: values.username,
        companyName: values.companyName,
        businessNumber: values.businessNumber,
        phone: values.phone
      };
      const response = await passwordResetAPI.verifyPasswordReset(payload);

      if (response.success) {
        setResetEmail(values.username);
        setPhoneMasked(response.data?.phoneMasked || '');
        setDevCode(response.data?.devCode || '');
        setVerifyPayload(payload);
        setOtpStage(true); // step 2 내에서 OTP 입력 화면으로 전환
        message.success('등록된 연락처로 인증코드를 발송했습니다.');
      } else {
        message.error(response.message || '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '비밀번호 찾기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // OTP 인증코드 확인 → 재설정 토큰 발급
  const handleConfirmOtp = async (values: any) => {
    setLoading(true);
    try {
      const response = await passwordResetAPI.confirmPasswordResetOtp({
        email: resetEmail,
        code: String(values.otp).trim()
      });

      if (response.success) {
        setResetToken(response.data.resetToken);
        setOtpStage(false);
        // 사용자(매출조회) 모드는 3단계 흐름(전화→인증→변경)이라 step 2가 비밀번호 변경
        setCurrentStep(userType === 'user' ? 2 : 3);
        message.success('본인인증이 완료되었습니다. 새로운 비밀번호를 설정해주세요.');
      } else {
        message.error(response.message || '인증코드가 일치하지 않습니다.');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '인증 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 인증코드 재발송
  const handleResendOtp = async () => {
    if (!verifyPayload) return;
    setLoading(true);
    try {
      const response = await passwordResetAPI.verifyPasswordReset(verifyPayload);
      if (response.success) {
        setPhoneMasked(response.data?.phoneMasked || '');
        setDevCode(response.data?.devCode || '');
        message.success('인증코드를 다시 발송했습니다.');
      } else {
        message.error(response.message || '재발송에 실패했습니다.');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '재발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // [사용자 모드] 전화번호로 OTP 발송 요청
  const handleUserPhoneFind = async (values: any) => {
    setLoading(true);
    try {
      const response = await passwordResetAPI.requestPhoneReset({ phone: values.phone });
      if (response.success) {
        setResetEmail(response.data?.email || '');
        setPhoneMasked(response.data?.phoneMasked || '');
        setDevCode(response.data?.devCode || '');
        setSvPhone(values.phone);
        setOtpStage(true);
        setCurrentStep(1);
        message.success('등록된 전화번호로 인증코드를 발송했습니다.');
      } else {
        message.error(response.message || '일치하는 사용자를 찾을 수 없습니다.');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '비밀번호 찾기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // [사용자 모드] 인증코드 재발송
  const handleUserResend = async () => {
    if (!svPhone) return;
    setLoading(true);
    try {
      const response = await passwordResetAPI.requestPhoneReset({ phone: svPhone });
      if (response.success) {
        setPhoneMasked(response.data?.phoneMasked || '');
        setDevCode(response.data?.devCode || '');
        message.success('인증코드를 다시 발송했습니다.');
      } else {
        message.error(response.message || '재발송에 실패했습니다.');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '재발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // [사용자 모드] 새 비밀번호(숫자 4자리) 설정
  const handleUserNewPassword = async (values: any) => {
    setLoading(true);
    try {
      if (!/^\d{4}$/.test(values.newPassword || '')) {
        message.error('비밀번호는 숫자 4자리여야 합니다.');
        setLoading(false);
        return;
      }
      if (values.newPassword !== values.confirmPassword) {
        message.error('입력하신 비밀번호를 확인 하시기 바랍니다.');
        setLoading(false);
        return;
      }
      if (!resetToken) {
        message.error('유효하지 않은 요청입니다.');
        setLoading(false);
        return;
      }
      const response = await passwordResetAPI.resetPassword({
        resetToken,
        newPassword: values.newPassword
      });
      if (response.success) {
        message.success('비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        message.error(response.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 관리자/사용자 모드 전환 시 상태 초기화
  const handleUserTypeChange = (value: string | number) => {
    const next = value as 'admin' | 'user';
    setUserType(next);
    setCurrentStep(0);
    setOtpStage(false);
    setFoundUserId('');
    setResetToken('');
    setResetEmail('');
    setPhoneMasked('');
    setDevCode('');
    setSvPhone('');
    setVerifyPayload(null);
    form.resetFields();
  };

  // 비밀번호 변경
  const handleChangePassword = async (values: any) => {
    setLoading(true);
    try {
      if (!checkPasswordStrength(values.newPassword)) {
        message.error('비밀번호 조건을 만족해야 합니다.');
        setLoading(false);
        return;
      }

      if (values.newPassword !== values.confirmPassword) {
        message.error('입력하신 비밀번호를 확인 하시기 바랍니다.');
        setLoading(false);
        return;
      }

      if (!resetToken) {
        message.error('유효하지 않은 요청입니다.');
        setLoading(false);
        return;
      }

      const response = await passwordResetAPI.resetPassword({
        resetToken,
        newPassword: values.newPassword
      });

      if (response.success) {
        message.success('비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        message.error(response.message || '비밀번호 변경에 실패했습니다.');
      }

    } catch (error: any) {
      message.error(error.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.');
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
      case 0: // 아이디 찾기
        return (
          <Form
            form={form}
            name="findUsername"
            onFinish={handleFindUsername}
            layout="vertical"
            autoComplete="off"
          >
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
                  form.setFieldsValue({ businessNumber: formatted });
                }}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="전화번호 (선택사항)"
              rules={[
                { pattern: /^01[0-9]-\d{4}-\d{4}$/, message: '올바른 휴대폰 번호 형식이 아닙니다!' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="010-1234-5678 (선택)"
                size="large"
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  form.setFieldsValue({ phone: formatted });
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
                아이디 찾기
              </Button>
            </Form.Item>

            <div style={{
              marginTop: '24px',
              textAlign: 'center',
              borderTop: '1px solid #f0f0f0',
              paddingTop: '20px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>회원이 아니시라면? </span>
                <Button
                  type="link"
                  style={{
                    padding: '0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1B61A8'
                  }}
                  onClick={() => navigate('/signup')}
                >
                  회원가입하러가기
                </Button>
              </div>
              <div>
                <span style={{ color: '#666', fontSize: '14px' }}>아이디가 생각 났다면? </span>
                <Button
                  type="link"
                  style={{
                    padding: '0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1B61A8'
                  }}
                  onClick={() => {
                    setCurrentStep(2);
                    form.resetFields();
                  }}
                >
                  비밀번호찾기
                </Button>
              </div>
            </div>
          </Form>
        );

      case 1: // 아이디 찾기 결과
        return (
          <div style={{ textAlign: 'center' }}>
            <Result
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              title="아이디를 찾았습니다!"
              subTitle={
                <div>
                  <p style={{ fontSize: '16px', margin: '16px 0' }}>
                    찾은 아이디: <strong style={{ fontSize: '18px', color: '#1B61A8' }}>{foundUserId}</strong>
                  </p>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    비밀번호를 찾으시려면 아래 버튼을 클릭해주세요.
                  </p>
                </div>
              }
              extra={[
                <Button
                  key="findPassword"
                  type="primary"
                  size="large"
                  onClick={() => {
                    setCurrentStep(2);
                    form.resetFields();
                    form.setFieldValue('username', foundUserId);
                  }}
                >
                  비밀번호 찾기로 이동
                </Button>
              ]}
            />
          </div>
        );

      case 2: // 비밀번호 찾기 (정보 검증 → OTP 인증)
        if (otpStage) {
          return (
            <Form
              key="otpForm"
              name="otpConfirm"
              onFinish={handleConfirmOtp}
              layout="vertical"
              autoComplete="off"
            >
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h3 style={{ color: '#1B61A8', marginBottom: '4px' }}>본인인증</h3>
                <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                  {phoneMasked ? <><strong>{phoneMasked}</strong> 로 </> : ''}
                  발송된 6자리 인증코드를 입력해주세요. (5분 이내)
                </p>
                {devCode && (
                  <p style={{ color: '#fa8c16', fontSize: '13px', marginTop: '8px' }}>
                    [개발 모드] 인증코드: <strong>{devCode}</strong>
                  </p>
                )}
              </div>

              <Form.Item
                name="otp"
                label="인증코드"
                rules={[
                  { required: true, message: '인증코드를 입력해주세요!' },
                  { pattern: /^\d{6}$/, message: '6자리 숫자를 입력해주세요!' }
                ]}
              >
                <Input
                  prefix={<LockOutlined />}
                  placeholder="6자리 숫자"
                  size="large"
                  maxLength={6}
                  inputMode="numeric"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '8px', marginTop: '24px' }}>
                <Button type="primary" htmlType="submit" loading={loading} size="large" block>
                  인증 확인
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Button type="link" onClick={handleResendOtp} disabled={loading} style={{ padding: 0 }}>
                  인증코드 재발송
                </Button>
                <span style={{ color: '#ccc', margin: '0 8px' }}>|</span>
                <Button type="link" onClick={() => setOtpStage(false)} disabled={loading} style={{ padding: 0 }}>
                  정보 다시 입력
                </Button>
              </div>
            </Form>
          );
        }
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
                disabled={!!foundUserId}
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
                  form.setFieldsValue({ businessNumber: formatted });
                }}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="전화번호 (선택사항)"
              rules={[
                { pattern: /^01[0-9]-\d{4}-\d{4}$/, message: '올바른 휴대폰 번호 형식이 아닙니다!' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="010-1234-5678 (선택)"
                size="large"
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  form.setFieldsValue({ phone: formatted });
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
          </Form>
        );

      case 3: // 비밀번호 변경
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

  // [사용자 모드] 전화번호 → OTP → 새 비밀번호(4자리) 흐름
  const renderUserModeContent = () => {
    switch (currentStep) {
      case 0: // 전화번호 입력
        return (
          <Form
            form={form}
            name="userPhoneFind"
            onFinish={handleUserPhoneFind}
            layout="vertical"
            autoComplete="off"
          >
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                가입 시 등록한 <strong>전화번호(로그인 아이디)</strong>를 입력하시면<br />
                해당 번호로 인증코드를 보내드립니다.
              </p>
            </div>
            <Form.Item
              name="phone"
              label="전화번호 (로그인 아이디)"
              rules={[
                { required: true, message: '전화번호를 입력해주세요!' },
                { pattern: /^01[0-9]-\d{3,4}-\d{4}$/, message: '올바른 휴대폰 번호 형식이 아닙니다!' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="010-1234-5678"
                size="large"
                inputMode="numeric"
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  form.setFieldsValue({ phone: formatted });
                }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
              <Button type="primary" htmlType="submit" loading={loading} size="large" block>
                인증코드 받기
              </Button>
            </Form.Item>
          </Form>
        );

      case 1: // OTP 인증
        return (
          <Form
            key="userOtpForm"
            name="userOtpConfirm"
            onFinish={handleConfirmOtp}
            layout="vertical"
            autoComplete="off"
          >
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h3 style={{ color: '#1B61A8', marginBottom: '4px' }}>본인인증</h3>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                {phoneMasked ? <><strong>{phoneMasked}</strong> 로 </> : ''}
                발송된 6자리 인증코드를 입력해주세요. (5분 이내)
              </p>
              {devCode && (
                <p style={{ color: '#fa8c16', fontSize: '13px', marginTop: '8px' }}>
                  [개발 모드] 인증코드: <strong>{devCode}</strong>
                </p>
              )}
            </div>
            <Form.Item
              name="otp"
              label="인증코드"
              rules={[
                { required: true, message: '인증코드를 입력해주세요!' },
                { pattern: /^\d{6}$/, message: '6자리 숫자를 입력해주세요!' }
              ]}
            >
              <Input
                prefix={<LockOutlined />}
                placeholder="6자리 숫자"
                size="large"
                maxLength={6}
                inputMode="numeric"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: '8px', marginTop: '24px' }}>
              <Button type="primary" htmlType="submit" loading={loading} size="large" block>
                인증 확인
              </Button>
            </Form.Item>
            <div style={{ textAlign: 'center' }}>
              <Button type="link" onClick={handleUserResend} disabled={loading} style={{ padding: 0 }}>
                인증코드 재발송
              </Button>
              <span style={{ color: '#ccc', margin: '0 8px' }}>|</span>
              <Button type="link" onClick={() => setCurrentStep(0)} disabled={loading} style={{ padding: 0 }}>
                전화번호 다시 입력
              </Button>
            </div>
          </Form>
        );

      case 2: // 새 비밀번호 (숫자 4자리)
        return (
          <Form
            form={form}
            name="userNewPassword"
            onFinish={handleUserNewPassword}
            layout="vertical"
            autoComplete="off"
          >
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <h3 style={{ color: '#52c41a' }}>본인인증이 완료되었습니다!</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                새로운 비밀번호(숫자 4자리)를 설정해주세요.
              </p>
            </div>
            <Form.Item
              name="newPassword"
              label="새 비밀번호 (숫자 4자리)"
              rules={[
                { required: true, message: '새 비밀번호를 입력해주세요!' },
                { pattern: /^\d{4}$/, message: '비밀번호는 숫자 4자리여야 합니다.' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="숫자 4자리"
                size="large"
                maxLength={4}
                inputMode="numeric"
              />
            </Form.Item>
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
                placeholder="숫자 4자리 다시 입력"
                size="large"
                maxLength={4}
                inputMode="numeric"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
              <Button type="primary" htmlType="submit" loading={loading} size="large" block>
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
    if (userType === 'user') {
      switch (currentStep) {
        case 0: return '사용자 비밀번호 찾기';
        case 1: return '본인인증';
        case 2: return '비밀번호 변경';
        default: return '사용자 비밀번호 찾기';
      }
    }
    switch (currentStep) {
      case 0: return '아이디 찾기';
      case 1: return '아이디 찾기 결과';
      case 2: return '비밀번호 찾기';
      case 3: return '비밀번호 변경';
      default: return '아이디 / 비밀번호 찾기';
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1B61A8',
        },
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: isMobile ? '12px' : '24px'
      }}
      className="erp-login-bg">
      <div
        className="erp-login-orb"
        style={{ width: 220, height: 220, top: -60, left: -50 }}
      />
      <div
        className="erp-login-orb"
        style={{ width: 130, height: 130, bottom: -35, right: '12%', animationDelay: '2.5s' }}
      />
      <div
        className="erp-login-orb"
        style={{ width: 70, height: 70, top: '18%', right: '22%', animationDelay: '4s' }}
      />
      <Card
        className="erp-login-glass"
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
          borderRadius: '14px',
        }}
        styles={{
          header: {
            textAlign: 'center',
            fontSize: isMobile ? '17px' : '20px',
            fontWeight: 'bold',
            background: 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.55)',
            borderRadius: '14px 14px 0 0',
            padding: isMobile ? '16px' : '20px 24px'
          },
          body: {
            padding: isMobile ? '20px 16px' : '24px'
          }
        }}
      >
        {/* 관리자(이메일) / 사용자(전화번호) 찾기 모드 전환 */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <Segmented
            block
            value={userType}
            onChange={handleUserTypeChange}
            options={[
              { label: '관리자(이메일)', value: 'admin' },
              { label: '사용자(전화번호)', value: 'user' },
            ]}
          />
        </div>

        <Steps
          current={currentStep}
          style={{
            marginBottom: isMobile ? '24px' : '32px',
            padding: isMobile ? 0 : '0 10px'
          }}
          labelPlacement="vertical"
          size="small"
          progressDot={isMobile}
          responsive={false}
        >
          {userType === 'user'
            ? [
                <Step key="u0" title="전화번호 입력" />,
                <Step key="u1" title="본인인증" />,
                <Step key="u2" title="비밀번호 변경" />,
              ]
            : [
                <Step key="a0" title="아이디 찾기" />,
                <Step key="a1" title="결과 확인" />,
                <Step key="a2" title="비밀번호 찾기" />,
                <Step key="a3" title="비밀번호 변경" />,
              ]}
        </Steps>

        {userType === 'user' ? renderUserModeContent() : renderStepContent()}
      </Card>
      </div>
    </ConfigProvider>
  );
};

export default PasswordReset;