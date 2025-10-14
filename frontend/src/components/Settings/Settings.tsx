import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Switch,
  Select,
  message,
  Divider,
  Typography,
  Space,
  Alert,
  Radio,
  Slider,
  InputNumber,
  Tabs,
  Modal,
} from 'antd';
import {
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useMessage } from '../../hooks/useMessage';

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const { isDark, toggleTheme } = useThemeStore();
  const { currentBusiness } = useAuthStore();
  const message = useMessage();
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [notifications, setNotifications] = useState({
    sales: true,
    payments: true,
    inventory: false,
    system: true,
  });

  // localStorage에서 설정 불러오기
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  const handleNotificationChange = (key: string, checked: boolean) => {
    const updatedNotifications = {
      ...notifications,
      [key]: checked,
    };
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    message.success(`${getNotificationLabel(key)} 알림이 ${checked ? '활성화' : '비활성화'}되었습니다.`);
  };

  const getNotificationLabel = (key: string) => {
    const labels = {
      sales: '매출/매입 거래',
      payments: '결제 마감일',
      inventory: '재고 부족',
      system: '시스템 업데이트'
    };
    return labels[key as keyof typeof labels];
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      // 실제로는 서버에 설정 저장
      localStorage.setItem('userSettings', JSON.stringify(values));
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('설정이 성공적으로 저장되었습니다.');
    } catch (error) {
      message.error('설정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Modal.confirm({
      title: '계정 삭제',
      icon: <ExclamationCircleOutlined />,
      content: '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk() {
        message.success('계정 삭제가 예약되었습니다. 7일 후에 완전히 삭제됩니다.');
      },
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ color: isDark ? '#ffffff' : '#000000' }}>
        설정
      </Title>

      <Tabs
        defaultActiveKey="general"
        type="card"
        items={[
          {
            key: 'general',
            label: '일반 설정',
            icon: <SettingOutlined />,
            children: (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="화면 설정">
                <Form layout="vertical" initialValues={{ theme: isDark }}>
                  <Form.Item label="테마 설정" name="theme">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Text>라이트 모드</Text>
                      <Switch
                        checked={isDark}
                        onChange={toggleTheme}
                        checkedChildren="🌙"
                        unCheckedChildren="☀️"
                      />
                      <Text>다크 모드</Text>
                    </div>
                  </Form.Item>

                  <Form.Item label="언어 설정" name="language">
                    <Select defaultValue="ko" style={{ width: '100%' }}>
                      <Select.Option value="ko">한국어</Select.Option>
                      <Select.Option value="en">English</Select.Option>
                      <Select.Option value="ja">日本語</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="시간대" name="timezone">
                    <Select defaultValue="Asia/Seoul" style={{ width: '100%' }}>
                      <Select.Option value="Asia/Seoul">서울 (GMT+9)</Select.Option>
                      <Select.Option value="America/New_York">뉴욕 (GMT-5)</Select.Option>
                      <Select.Option value="Europe/London">런던 (GMT+0)</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="화폐 단위" name="currency">
                    <Select defaultValue="KRW" style={{ width: '100%' }}>
                      <Select.Option value="KRW">원 (₩)</Select.Option>
                      <Select.Option value="USD">달러 ($)</Select.Option>
                      <Select.Option value="EUR">유로 (€)</Select.Option>
                    </Select>
                  </Form.Item>
                </Form>
              </Card>

              <Card title="데이터 설정" style={{ marginTop: '16px' }}>
                <Form layout="vertical">
                  <Form.Item label="페이지당 항목 수" name="pageSize">
                    <Slider
                      min={10}
                      max={100}
                      step={10}
                      defaultValue={20}
                      marks={{
                        10: '10',
                        50: '50',
                        100: '100',
                      }}
                    />
                  </Form.Item>

                  <Form.Item label="자동 저장 간격 (분)" name="autoSaveInterval">
                    <InputNumber
                      min={1}
                      max={60}
                      defaultValue={5}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Form.Item label="데이터 백업" name="backupEnabled">
                    <Switch defaultChecked />
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      매일 자동으로 데이터를 백업합니다
                    </Text>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="알림 설정" icon={<BellOutlined />}>
                <Form layout="vertical">
                  <Form.Item label="이메일 알림" name="emailNotifications">
                    <Switch defaultChecked />
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      중요한 업데이트를 이메일로 받습니다
                    </Text>
                  </Form.Item>

                  <Form.Item label="브라우저 알림" name="browserNotifications">
                    <Switch defaultChecked />
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      브라우저 푸시 알림을 받습니다
                    </Text>
                  </Form.Item>

                  <Form.Item label="SMS 알림" name="smsNotifications">
                    <Switch />
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      중요한 알림을 SMS로 받습니다
                    </Text>
                  </Form.Item>

                  <Divider />

                  <Form.Item label="알림 유형">
                    <Space direction="vertical">
                      <div>
                        <Switch
                          checked={notifications.sales}
                          onChange={(checked) => handleNotificationChange('sales', checked)}
                        /> 매출/매입 거래 알림
                      </div>
                      <div>
                        <Switch
                          checked={notifications.payments}
                          onChange={(checked) => handleNotificationChange('payments', checked)}
                        /> 결제 마감일 알림
                      </div>
                      <div>
                        <Switch
                          checked={notifications.inventory}
                          onChange={(checked) => handleNotificationChange('inventory', checked)}
                        /> 재고 부족 알림
                      </div>
                      <div>
                        <Switch
                          checked={notifications.system}
                          onChange={(checked) => handleNotificationChange('system', checked)}
                        /> 시스템 업데이트 알림
                      </div>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>

            </Col>
          </Row>
            )
          },
          {
            key: 'security',
            label: '보안',
            icon: <SecurityScanOutlined />,
            children: (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="보안 설정">
                <Form layout="vertical">
                  <Form.Item label="2단계 인증" name="twoFactorAuth">
                    <Switch />
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      로그인 시 추가 인증을 요구합니다
                    </Text>
                  </Form.Item>

                  <Form.Item label="세션 유지 시간" name="sessionTimeout">
                    <Radio.Group defaultValue="8h">
                      <Radio value="1h">1시간</Radio>
                      <Radio value="4h">4시간</Radio>
                      <Radio value="8h">8시간</Radio>
                      <Radio value="24h">24시간</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item label="IP 제한" name="ipRestriction">
                    <Switch />
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      특정 IP에서만 접속을 허용합니다
                    </Text>
                  </Form.Item>

                  <Form.Item label="로그인 알림" name="loginNotification">
                    <Switch defaultChecked />
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      새로운 기기에서 로그인 시 알림을 받습니다
                    </Text>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="활동 로그">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>최근 로그인</Text>
                    <br />
                    <Text type="secondary">2024-01-20 14:30:25 (Chrome, Windows)</Text>
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div>
                    <Text strong>비밀번호 변경</Text>
                    <br />
                    <Text type="secondary">2024-01-15 09:22:11</Text>
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div>
                    <Text strong>계정 생성</Text>
                    <br />
                    <Text type="secondary">2024-01-10 16:45:32</Text>
                  </div>
                </Space>
                <Button type="link" style={{ padding: 0, marginTop: '16px' }}>
                  전체 활동 내역 보기
                </Button>
              </Card>
            </Col>
          </Row>
            )
          },
          {
            key: 'data',
            label: '데이터 관리',
            icon: <DatabaseOutlined />,
            children: (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="데이터 내보내기">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button type="primary" block>
                    거래처 데이터 내보내기
                  </Button>
                  <Button type="primary" block>
                    품목 데이터 내보내기
                  </Button>
                  <Button type="primary" block>
                    매출/매입 데이터 내보내기
                  </Button>
                  <Button type="primary" block>
                    전체 데이터 내보내기
                  </Button>
                </Space>
                <Alert
                  message="데이터 내보내기"
                  description="내보낸 데이터는 Excel 또는 CSV 형식으로 다운로드됩니다."
                  type="info"
                  showIcon
                  style={{ marginTop: '16px' }}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="위험한 작업">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button danger block>
                    모든 데이터 초기화
                  </Button>
                  <Button danger block onClick={handleDeleteAccount}>
                    계정 삭제
                  </Button>
                </Space>
                <Alert
                  message="주의사항"
                  description="위 작업들은 되돌릴 수 없습니다. 신중하게 결정해주세요."
                  type="warning"
                  showIcon
                  style={{ marginTop: '16px' }}
                />
              </Card>
            </Col>
          </Row>
            )
          }
        ]}
      />

      <Form form={form} onFinish={handleFinish}>
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Button type="primary" size="large" htmlType="submit" loading={loading}>
            설정 저장
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Settings;