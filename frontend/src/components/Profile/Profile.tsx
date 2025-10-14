import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Avatar,
  Upload,
  message,
  Divider,
  Typography,
  Space,
  Tag,
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  EditOutlined,
  SaveOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { authAPI, businessAPI } from '../../utils/api';
import { formatBusinessNumber, formatPhoneNumber } from '../../utils/formatters';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user, updateUser, currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [businessForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [businessEditing, setBusinessEditing] = useState(false);
  const [businessLoading, setBusinessLoading] = useState(false);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(values);
      if (response.data.success) {
        message.success('프로필이 업데이트되었습니다.');
        if (updateUser) {
          updateUser({ ...user, ...values });
        }
        setEditing(false);
      } else {
        throw new Error(response.data.message || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error: any) {
      // 401/403 에러는 API 인터셉터에서 처리되므로 다른 에러만 처리
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        message.error(error.response?.data?.message || '프로필 업데이트에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    setPasswordLoading(true);
    try {
      const response = await authAPI.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      if (response.data.success) {
        message.success('비밀번호가 성공적으로 변경되었습니다.');
        passwordForm.resetFields();
      } else {
        throw new Error(response.data.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleBusinessUpdate = async (values: any) => {
    if (!currentBusiness) return;

    setBusinessLoading(true);
    try {
      const response = await businessAPI.update(currentBusiness.id, values);
      if (response.data.success) {
        message.success('사업체 정보가 성공적으로 업데이트되었습니다.');
        setBusinessEditing(false);
        // TODO: authStore에서 currentBusiness 업데이트하는 함수 필요
      } else {
        throw new Error(response.data.message || '사업체 정보 업데이트에 실패했습니다.');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '사업체 정보 업데이트에 실패했습니다.');
    } finally {
      setBusinessLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('JPG/PNG 파일만 업로드 가능합니다.');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('이미지는 5MB보다 작아야 합니다.');
      return false;
    }

    try {
      const response = await authAPI.uploadAvatar(file);
      if (response.data.success) {
        message.success('프로필 사진이 업데이트되었습니다.');
        // 사용자 정보 새로고침을 위해 프로필 재조회
        const profileResponse = await authAPI.getProfile();
        if (profileResponse.data.success) {
          // 페이지 새로고침 없이 즉시 아바타 업데이트
          window.location.reload();
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '프로필 사진 업로드에 실패했습니다.');
    }
    return false; // Antd Upload가 자체적으로 업로드하지 않도록 방지
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    listType: 'picture-card',
    className: 'avatar-uploader',
    showUploadList: false,
    beforeUpload: handleAvatarUpload,
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ color: isDark ? '#ffffff' : '#000000' }}>
        내 정보
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card
            title="프로필 사진"
            style={{ textAlign: 'center' }}
          >
            <Space direction="vertical" size="large">
              <Avatar
                size={120}
                src={user?.avatar ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${user.avatar}` : undefined}
                icon={!user?.avatar ? <UserOutlined /> : undefined}
                style={{
                  backgroundColor: '#1890ff',
                  border: '4px solid #f0f0f0',
                }}
              />
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>사진 변경</Button>
              </Upload>
              <div>
                <Text strong style={{ fontSize: '18px' }}>
                  {user?.name}
                </Text>
                <br />
                <Text type="secondary">{user?.email}</Text>
              </div>
            </Space>
          </Card>

          <Card title="계정 정보" style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>가입일</Text>
                <br />
                <Text type="secondary">2024-01-15</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text strong>마지막 로그인</Text>
                <br />
                <Text type="secondary">2024-01-20 14:30</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text strong>계정 상태</Text>
                <br />
                <Tag color="green">활성화</Tag>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title="개인정보"
            extra={
              <Button
                type={editing ? "default" : "primary"}
                icon={editing ? <SaveOutlined /> : <EditOutlined />}
                onClick={() => {
                  if (editing) {
                    form.submit();
                  } else {
                    setEditing(true);
                  }
                }}
                loading={loading}
              >
                {editing ? '저장' : '수정'}
              </Button>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFinish}
              initialValues={{
                name: user?.name,
                email: user?.email,
                phone: user?.phone || '',
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="이름"
                    name="name"
                    rules={[
                      { required: true, message: '이름을 입력해주세요.' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      disabled={!editing}
                      placeholder="이름을 입력하세요"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="이메일"
                    name="email"
                    rules={[
                      { required: true, message: '이메일을 입력해주세요.' },
                      { type: 'email', message: '올바른 이메일 형식이 아닙니다.' }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      disabled={!editing}
                      placeholder="이메일을 입력하세요"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="전화번호"
                name="phone"
              >
                <Input
                  prefix={<PhoneOutlined />}
                  disabled={!editing}
                  placeholder="전화번호를 입력하세요"
                />
              </Form.Item>

              {editing && (
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      저장
                    </Button>
                    <Button
                      onClick={() => {
                        setEditing(false);
                        form.resetFields();
                      }}
                    >
                      취소
                    </Button>
                  </Space>
                </Form.Item>
              )}
            </Form>
          </Card>

          <Card title="비밀번호 변경" style={{ marginTop: '24px' }}>
            <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
              <Form.Item
                label="현재 비밀번호"
                name="currentPassword"
                rules={[
                  { required: true, message: '현재 비밀번호를 입력해주세요.' }
                ]}
              >
                <Input.Password placeholder="현재 비밀번호" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="새 비밀번호"
                    name="newPassword"
                    rules={[
                      { required: true, message: '새 비밀번호를 입력해주세요.' },
                      { min: 8, message: '비밀번호는 최소 8자 이상이어야 합니다.' }
                    ]}
                  >
                    <Input.Password placeholder="새 비밀번호" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="비밀번호 확인"
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: '비밀번호를 다시 입력해주세요.' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('비밀번호가 일치하지 않습니다.'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="새 비밀번호 확인" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" danger htmlType="submit" loading={passwordLoading}>
                  비밀번호 변경
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card
            title="사업체 정보"
            style={{ marginTop: '24px' }}
            extra={
              !businessEditing && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setBusinessEditing(true)}
                  type="link"
                >
                  수정
                </Button>
              )
            }
          >
            {currentBusiness && (
              <Form
                form={businessForm}
                layout="vertical"
                initialValues={currentBusiness}
                onFinish={handleBusinessUpdate}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    {businessEditing ? (
                      <Form.Item label="회사명" name="companyName">
                        <Input />
                      </Form.Item>
                    ) : (
                      <div>
                        <Text strong>회사명</Text>
                        <br />
                        <Text>{currentBusiness.companyName}</Text>
                      </div>
                    )}
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    {businessEditing ? (
                      <Form.Item label="사업자번호" name="businessNumber">
                        <Input disabled />
                      </Form.Item>
                    ) : (
                      <div>
                        <Text strong>사업자번호</Text>
                        <br />
                        <Text>{formatBusinessNumber(currentBusiness.businessNumber)}</Text>
                      </div>
                    )}
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    {businessEditing ? (
                      <Form.Item label="대표자" name="representative">
                        <Input />
                      </Form.Item>
                    ) : (
                      <div>
                        <Text strong>대표자</Text>
                        <br />
                        <Text>{currentBusiness.representative}</Text>
                      </div>
                    )}
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    {businessEditing ? (
                      <Form.Item label="업태" name="businessType">
                        <Input />
                      </Form.Item>
                    ) : (
                      <div>
                        <Text strong>업태</Text>
                        <br />
                        <Text>{currentBusiness.businessType || '미등록'}</Text>
                      </div>
                    )}
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    {businessEditing ? (
                      <Form.Item label="종목" name="businessItem">
                        <Input />
                      </Form.Item>
                    ) : (
                      <div>
                        <Text strong>종목</Text>
                        <br />
                        <Text>{currentBusiness.businessItem || '미등록'}</Text>
                      </div>
                    )}
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    {businessEditing ? (
                      <Form.Item label="전화번호" name="phone">
                        <Input />
                      </Form.Item>
                    ) : (
                      <div>
                        <Text strong>전화번호</Text>
                        <br />
                        <Text>{currentBusiness.phone || '미등록'}</Text>
                      </div>
                    )}
                  </Col>
                  <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                    {businessEditing ? (
                      <Form.Item label="주소" name="address">
                        <Input.TextArea rows={2} />
                      </Form.Item>
                    ) : (
                      <div>
                        <Text strong>주소</Text>
                        <br />
                        <Text>{currentBusiness.address || '미등록'}</Text>
                      </div>
                    )}
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    {businessEditing ? (
                      <Form.Item label="팩스" name="fax">
                        <Input
                          placeholder="02-1234-5678"
                          maxLength={13}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            businessForm.setFieldsValue({ fax: formatted });
                          }}
                        />
                      </Form.Item>
                    ) : (
                      <div>
                        <Text strong>팩스</Text>
                        <br />
                        <Text>{currentBusiness.fax || '미등록'}</Text>
                      </div>
                    )}
                  </Col>
                </Row>

                {businessEditing && (
                  <div style={{ marginTop: '16px', textAlign: 'right' }}>
                    <Button
                      style={{ marginRight: '8px' }}
                      onClick={() => setBusinessEditing(false)}
                    >
                      취소
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={businessLoading}
                      icon={<SaveOutlined />}
                    >
                      저장
                    </Button>
                  </div>
                )}
              </Form>
            )}
          </Card>

        </Col>
      </Row>
    </div>
  );
};

export default Profile;