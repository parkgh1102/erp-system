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
  Spin,
  Upload,
} from 'antd';
import {
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useMessage } from '../../hooks/useMessage';
import { settingsAPI, activityLogAPI } from '../../utils/api';
import UserManagement from './UserManagement';

const { Title, Text } = Typography;

interface ActivityLog {
  id: number;
  actionType: string;
  entity: string;
  entityId?: number;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  createdAt: string;
}

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const { isDark, toggleTheme } = useThemeStore();
  const { currentBusiness, user } = useAuthStore();
  const { success: showSuccess, error: showError } = useMessage();
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [notifications, setNotifications] = useState({
    sales: true,
    payments: true,
    inventory: false,
    system: true,
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsModalVisible, setLogsModalVisible] = useState(false);

  // 보안 설정 상태 (기본값: 2단계 인증 ON)
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    sessionTimeout: '8h',
    ipRestriction: false,
    loginNotification: false,
  });

  // 일반 설정 상태
  const [generalSettings, setGeneralSettings] = useState({
    language: 'ko',
    timezone: 'Asia/Seoul',
    currency: 'KRW',
  });

  // 알림 채널 설정 상태
  const [notificationChannels, setNotificationChannels] = useState({
    emailNotifications: true,
    browserNotifications: true,
    smsNotifications: false,
  });

  // 서버에서 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentBusiness) return;

      try {
        const response = await settingsAPI.getSettings(currentBusiness.id);
        if (response.data.success) {
          const data = response.data.data;
          // 보안 설정 (설정이 없으면 기본값 2단계 인증 ON)
          setSecuritySettings({
            twoFactorAuth: data.twoFactorAuth === undefined ? true : data.twoFactorAuth === 'true',
            sessionTimeout: data.sessionTimeout || '8h',
            ipRestriction: data.ipRestriction === 'true',
            loginNotification: data.loginNotification === 'true',
          });
          // 일반 설정
          setGeneralSettings({
            language: data.language || 'ko',
            timezone: data.timezone || 'Asia/Seoul',
            currency: data.currency || 'KRW',
          });
          // 알림 채널 설정
          setNotificationChannels({
            emailNotifications: data.emailNotifications !== 'false',
            browserNotifications: data.browserNotifications !== 'false',
            smsNotifications: data.smsNotifications === 'true',
          });
        }
      } catch (error) {
        console.error('설정 조회 실패:', error);
      }
    };

    fetchSettings();
  }, [currentBusiness]);

  // localStorage에서 알림 설정 불러오기
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  // 활동 로그 불러오기
  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await activityLogAPI.getRecentLogs();
      if (response.data.success) {
        setActivityLogs(response.data.data.logs || []);
      }
    } catch (error) {
      console.error('활동 로그 조회 실패:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleNotificationChange = (key: string, checked: boolean) => {
    const updatedNotifications = {
      ...notifications,
      [key]: checked,
    };
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    showSuccess(`${getNotificationLabel(key)} 알림이 ${checked ? '활성화' : '비활성화'}되었습니다.`);
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

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'login': '로그인',
      'logout': '로그아웃',
      'create': '생성',
      'update': '수정',
      'delete': '삭제',
      'password_change': '비밀번호 변경',
      'export': '데이터 내보내기',
      'import': '데이터 가져오기',
      'print': '인쇄',
      'signup': '회원가입',
      'view': '조회'
    };
    return labels[actionType] || actionType;
  };

  const handleFinish = async (values: any) => {
    if (!currentBusiness) {
      showError('사업체 정보를 찾을 수 없습니다.');
      return;
    }

    setLoading(true);
    try {
      // 모든 설정을 서버에 저장
      const settingsToSave = {
        // 보안 설정
        twoFactorAuth: String(securitySettings.twoFactorAuth),
        sessionTimeout: securitySettings.sessionTimeout,
        ipRestriction: String(securitySettings.ipRestriction),
        loginNotification: String(securitySettings.loginNotification),
        // 일반 설정
        language: generalSettings.language,
        timezone: generalSettings.timezone,
        currency: generalSettings.currency,
        // 알림 채널 설정
        emailNotifications: String(notificationChannels.emailNotifications),
        browserNotifications: String(notificationChannels.browserNotifications),
        smsNotifications: String(notificationChannels.smsNotifications),
      };

      await settingsAPI.updateSettings(currentBusiness.id, settingsToSave);

      // 로컬 스토리지에도 세션 타임아웃 저장 (현재 세션에 적용)
      localStorage.setItem('sessionTimeout', securitySettings.sessionTimeout);
      // 일반 설정도 로컬 스토리지에 저장 (즉시 적용)
      localStorage.setItem('language', generalSettings.language);
      localStorage.setItem('timezone', generalSettings.timezone);
      localStorage.setItem('currency', generalSettings.currency);

      showSuccess('설정이 성공적으로 저장되었습니다.');
    } catch (error) {
      showError('설정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'customers' | 'products' | 'transactions' | 'all') => {
    if (!currentBusiness) {
      showError('사업체 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      let response;
      let filename;

      switch (type) {
        case 'customers':
          response = await settingsAPI.exportCustomers(currentBusiness.id);
          filename = '거래처.xlsx';
          break;
        case 'products':
          response = await settingsAPI.exportProducts(currentBusiness.id);
          filename = '품목.xlsx';
          break;
        case 'transactions':
          response = await settingsAPI.exportTransactions(currentBusiness.id);
          filename = '매출매입.xlsx';
          break;
        case 'all':
          response = await settingsAPI.exportAll(currentBusiness.id);
          filename = '전체데이터.xlsx';
          break;
      }

      // Blob 다운로드
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccess('데이터가 성공적으로 내보내졌습니다.');
    } catch (error) {
      showError('데이터 내보내기에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = () => {
    if (!currentBusiness) {
      showError('사업체 정보를 찾을 수 없습니다.');
      return;
    }

    Modal.confirm({
      title: '모든 데이터 초기화',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
            경고: 이 작업은 되돌릴 수 없습니다!
          </p>
          <p>모든 거래처, 품목, 매출, 매입, 수금 데이터가 삭제됩니다.</p>
          <p>계속하시려면 아래에 "데이터 초기화"를 입력하세요.</p>
          <Input
            id="reset-confirm-input"
            placeholder="데이터 초기화"
            style={{ marginTop: 8 }}
          />
        </div>
      ),
      okText: '초기화',
      okType: 'danger',
      cancelText: '취소',
      async onOk() {
        const inputValue = (document.getElementById('reset-confirm-input') as HTMLInputElement)?.value;
        if (inputValue !== '데이터 초기화') {
          showError('확인 텍스트가 일치하지 않습니다.');
          return Promise.reject();
        }
        try {
          setLoading(true);
          await settingsAPI.resetAllData(currentBusiness.id, inputValue);
          showSuccess('모든 데이터가 초기화되었습니다.');
        } catch (error) {
          showError('데이터 초기화에 실패했습니다.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleDeleteAccountConfirm = () => {
    if (!currentBusiness) {
      showError('사업체 정보를 찾을 수 없습니다.');
      return;
    }

    Modal.confirm({
      title: '계정 삭제',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
            경고: 이 작업은 되돌릴 수 없습니다!
          </p>
          <p>계정과 모든 데이터(거래처, 품목, 매출, 매입 등)가 영구적으로 삭제됩니다.</p>
          <p>계속하시려면 아래에 "계정 삭제"를 입력하세요.</p>
          <Input
            id="delete-confirm-input"
            placeholder="계정 삭제"
            style={{ marginTop: 8 }}
          />
        </div>
      ),
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      async onOk() {
        const inputValue = (document.getElementById('delete-confirm-input') as HTMLInputElement)?.value;
        if (inputValue !== '계정 삭제') {
          showError('확인 텍스트가 일치하지 않습니다.');
          return Promise.reject();
        }
        try {
          setLoading(true);
          await settingsAPI.deleteAccount(currentBusiness.id, inputValue);
          showSuccess('계정이 삭제되었습니다. 잠시 후 로그인 페이지로 이동합니다.');
          // 로그아웃 처리
          setTimeout(() => {
            localStorage.clear();
            window.location.href = '/login';
          }, 2000);
        } catch (error) {
          showError('계정 삭제에 실패했습니다.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 데이터 백업
  const handleBackup = async () => {
    if (!currentBusiness) {
      showError('사업체 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      const response = await settingsAPI.backupData(currentBusiness.id);

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `backup_${date}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccess('백업 파일이 다운로드되었습니다.');
    } catch (error) {
      showError('백업에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 데이터 복원
  const handleRestore = async (file: File) => {
    if (!currentBusiness) {
      showError('사업체 정보를 찾을 수 없습니다.');
      return false;
    }

    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '데이터 복원',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
              경고: 기존 데이터가 모두 삭제되고 백업 데이터로 대체됩니다!
            </p>
            <p>선택한 파일: {file.name}</p>
            <p>계속하시겠습니까?</p>
          </div>
        ),
        okText: '복원',
        okType: 'danger',
        cancelText: '취소',
        async onOk() {
          try {
            setLoading(true);

            const text = await file.text();
            const backupData = JSON.parse(text);

            const response = await settingsAPI.restoreData(currentBusiness.id, backupData);

            if (response.data.success) {
              const summary = response.data.summary;
              showSuccess(
                `복원 완료! 거래처 ${summary.customers}건, 품목 ${summary.products}건, 매출 ${summary.sales}건, 매입 ${summary.purchases}건, 수금 ${summary.payments}건`
              );
              resolve(true);
            } else {
              showError(response.data.message || '복원에 실패했습니다.');
              resolve(false);
            }
          } catch (error) {
            showError('백업 파일을 읽는 중 오류가 발생했습니다.');
            resolve(false);
          } finally {
            setLoading(false);
          }
        },
        onCancel() {
          resolve(false);
        }
      });
    });
  };

  // role에 따른 탭 필터링
  const getTabItems = () => {
    const allTabs = [
      {
        key: 'general',
        label: '일반 설정',
        icon: <SettingOutlined />,
        roles: ['admin', 'sales_viewer'], // 모든 권한 접근 가능
            children: (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="화면 설정">
                <Form layout="vertical">
                  <Form.Item label="테마 설정">
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

                  <Form.Item label="언어 설정">
                    <Select
                      style={{ width: '100%' }}
                      value={generalSettings.language}
                      onChange={(value) => setGeneralSettings(prev => ({ ...prev, language: value }))}
                    >
                      <Select.Option value="ko">한국어</Select.Option>
                      <Select.Option value="en">English</Select.Option>
                      <Select.Option value="ja">日本語</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="시간대">
                    <Select
                      style={{ width: '100%' }}
                      value={generalSettings.timezone}
                      onChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}
                    >
                      <Select.Option value="Asia/Seoul">서울 (GMT+9)</Select.Option>
                      <Select.Option value="America/New_York">뉴욕 (GMT-5)</Select.Option>
                      <Select.Option value="Europe/London">런던 (GMT+0)</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="화폐 단위">
                    <Select
                      style={{ width: '100%' }}
                      value={generalSettings.currency}
                      onChange={(value) => setGeneralSettings(prev => ({ ...prev, currency: value }))}
                    >
                      <Select.Option value="KRW">원 (₩)</Select.Option>
                      <Select.Option value="USD">달러 ($)</Select.Option>
                      <Select.Option value="EUR">유로 (€)</Select.Option>
                    </Select>
                  </Form.Item>
                </Form>
              </Card>

              <Card title="데이터 백업 및 복원" style={{ marginTop: '16px' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong>데이터 백업</Text>
                    <div style={{ marginTop: 8 }}>
                      <Button
                        type="primary"
                        icon={<CloudDownloadOutlined />}
                        onClick={handleBackup}
                        loading={loading}
                      >
                        백업 파일 다운로드
                      </Button>
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        모든 데이터를 JSON 파일로 저장합니다
                      </Text>
                    </div>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <div>
                    <Text strong>데이터 복원</Text>
                    <div style={{ marginTop: 8 }}>
                      <Upload
                        accept=".json"
                        showUploadList={false}
                        beforeUpload={(file) => {
                          handleRestore(file);
                          return false;
                        }}
                      >
                        <Button
                          danger
                          icon={<CloudUploadOutlined />}
                          loading={loading}
                        >
                          백업 파일에서 복원
                        </Button>
                      </Upload>
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        기존 데이터가 백업 데이터로 대체됩니다
                      </Text>
                    </div>
                  </div>

                  <Alert
                    message="백업 안내"
                    description="중요한 데이터 변경 전에 백업을 권장합니다. 복원 시 기존 데이터는 삭제됩니다."
                    type="info"
                    showIcon
                  />
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="알림 설정" icon={<BellOutlined />}>
                <Form layout="vertical">
                  <Form.Item label="이메일 알림">
                    <Space>
                      <Switch
                        checked={notificationChannels.emailNotifications}
                        onChange={(checked) => setNotificationChannels(prev => ({ ...prev, emailNotifications: checked }))}
                      />
                      <Text type="secondary">
                        중요한 업데이트를 이메일로 받습니다
                      </Text>
                    </Space>
                  </Form.Item>

                  <Form.Item label="브라우저 알림">
                    <Space>
                      <Switch
                        checked={notificationChannels.browserNotifications}
                        onChange={(checked) => setNotificationChannels(prev => ({ ...prev, browserNotifications: checked }))}
                      />
                      <Text type="secondary">
                        브라우저 푸시 알림을 받습니다
                      </Text>
                    </Space>
                  </Form.Item>

                  <Form.Item label="SMS 알림">
                    <Space>
                      <Switch
                        checked={notificationChannels.smsNotifications}
                        onChange={(checked) => setNotificationChannels(prev => ({ ...prev, smsNotifications: checked }))}
                      />
                      <Text type="secondary">
                        중요한 알림을 SMS로 받습니다
                      </Text>
                    </Space>
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
        roles: ['admin', 'sales_viewer'], // 모든 권한 접근 가능
            children: (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="보안 설정">
                <Form layout="vertical">
                  <Form.Item label="2단계 인증">
                    <Space>
                      <Switch
                        checked={securitySettings.twoFactorAuth}
                        onChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                      />
                      <Text type="secondary">
                        로그인 시 추가 인증을 요구합니다
                      </Text>
                    </Space>
                  </Form.Item>

                  <Form.Item label="세션 유지 시간">
                    <Radio.Group
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                    >
                      <Radio value="1h">1시간</Radio>
                      <Radio value="4h">4시간</Radio>
                      <Radio value="8h">8시간</Radio>
                      <Radio value="24h">24시간</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item label="IP 제한">
                    <Space>
                      <Switch
                        checked={securitySettings.ipRestriction}
                        onChange={(checked) => setSecuritySettings(prev => ({ ...prev, ipRestriction: checked }))}
                      />
                      <Text type="secondary">
                        특정 IP에서만 접속을 허용합니다
                      </Text>
                    </Space>
                  </Form.Item>

                  <Form.Item label="로그인 알림">
                    <Space>
                      <Switch
                        checked={securitySettings.loginNotification}
                        onChange={(checked) => setSecuritySettings(prev => ({ ...prev, loginNotification: checked }))}
                      />
                      <Text type="secondary">
                        새로운 기기에서 로그인 시 알림을 받습니다
                      </Text>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title="활동 로그"
                extra={
                  <Button
                    type="link"
                    onClick={fetchActivityLogs}
                    loading={logsLoading}
                  >
                    새로고침
                  </Button>
                }
              >
                {logsLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin />
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">활동 로그가 없습니다.</Text>
                  </div>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {activityLogs.slice(0, 5).map((log, index) => (
                      <React.Fragment key={log.id}>
                        {index > 0 && <Divider style={{ margin: '12px 0' }} />}
                        <div>
                          <Text strong>{getActionTypeLabel(log.actionType)}</Text>
                          {log.description && (
                            <>
                              <br />
                              <Text>{log.description}</Text>
                            </>
                          )}
                          <br />
                          <Text type="secondary">
                            {new Date(log.createdAt).toLocaleString('ko-KR', {
                              timeZone: 'Asia/Seoul',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                            {log.browser && log.os && ` (${log.browser}, ${log.os})`}
                          </Text>
                        </div>
                      </React.Fragment>
                    ))}
                  </Space>
                )}
                {!logsLoading && activityLogs.length > 5 && (
                  <Button
                    type="link"
                    style={{ padding: 0, marginTop: '16px' }}
                    onClick={() => setLogsModalVisible(true)}
                  >
                    전체 활동 내역 보기 ({activityLogs.length}건)
                  </Button>
                )}
              </Card>
            </Col>
          </Row>
        )
      },
      {
        key: 'data',
        label: '데이터 관리',
        icon: <DatabaseOutlined />,
        roles: ['admin'], // admin만 접근 가능
            children: (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="데이터 내보내기">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    block
                    onClick={() => handleExport('customers')}
                    loading={loading}
                  >
                    거래처 데이터 내보내기
                  </Button>
                  <Button
                    type="primary"
                    block
                    onClick={() => handleExport('products')}
                    loading={loading}
                  >
                    품목 데이터 내보내기
                  </Button>
                  <Button
                    type="primary"
                    block
                    onClick={() => handleExport('transactions')}
                    loading={loading}
                  >
                    매출/매입 데이터 내보내기
                  </Button>
                  <Button
                    type="primary"
                    block
                    onClick={() => handleExport('all')}
                    loading={loading}
                  >
                    전체 데이터 내보내기
                  </Button>
                </Space>
                <Alert
                  message="데이터 내보내기"
                  description="내보낸 데이터는 Excel 형식으로 다운로드됩니다."
                  type="info"
                  showIcon
                  style={{ marginTop: '16px' }}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="위험한 작업">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button danger block onClick={handleResetData} loading={loading}>
                    모든 데이터 초기화
                  </Button>
                  <Button danger block onClick={handleDeleteAccountConfirm} loading={loading}>
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
      },
      {
        key: 'users',
        label: '사용자관리',
        icon: <UserOutlined />,
        roles: ['admin'], // admin만 접근 가능
        children: <UserManagement />
      }
    ];

    // 현재 사용자의 role에 따라 탭 필터링
    const userRole = user?.role || 'admin';
    return allTabs.filter(tab => tab.roles.includes(userRole));
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ color: isDark ? '#ffffff' : '#000000' }}>
        설정
      </Title>

      <Tabs
        defaultActiveKey="general"
        type="card"
        items={getTabItems()}
      />

      <Form form={form} onFinish={handleFinish}>
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Button type="primary" size="large" htmlType="submit" loading={loading}>
            설정 저장
          </Button>
        </div>
      </Form>

      {/* 전체 활동 로그 Modal */}
      <Modal
        title="전체 활동 내역"
        open={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setLogsModalVisible(false)}>
            닫기
          </Button>
        ]}
        width={800}
        style={{
          top: 20,
        }}
        styles={{
          body: {
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto'
          }
        }}
      >
        {logsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : activityLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">활동 로그가 없습니다.</Text>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {activityLogs.map((log, index) => (
              <React.Fragment key={log.id}>
                {index > 0 && <Divider style={{ margin: '12px 0' }} />}
                <div>
                  <Text strong style={{ fontSize: '15px' }}>
                    {getActionTypeLabel(log.actionType)}
                  </Text>
                  {log.entity && (
                    <>
                      <Text type="secondary"> - {log.entity}</Text>
                      {log.entityId && <Text type="secondary"> #{log.entityId}</Text>}
                    </>
                  )}
                  {log.description && (
                    <>
                      <br />
                      <Text style={{ fontSize: '14px' }}>{log.description}</Text>
                    </>
                  )}
                  <br />
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    {new Date(log.createdAt).toLocaleString('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                    {log.browser && log.os && ` · ${log.browser} · ${log.os}`}
                    {log.ipAddress && ` · IP: ${log.ipAddress}`}
                  </Text>
                </div>
              </React.Fragment>
            ))}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default Settings;