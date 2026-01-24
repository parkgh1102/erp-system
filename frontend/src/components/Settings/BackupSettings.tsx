import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Switch,
  Select,
  TimePicker,
  InputNumber,
  Button,
  Table,
  Space,
  Typography,
  Alert,
  Modal,
  Popconfirm,
  Tag,
  Row,
  Col,
  Spin,
  Progress,
} from 'antd';
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useMessage } from '../../hooks/useMessage';
import { backupAPI } from '../../utils/api';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface BackupConfig {
  id: number;
  businessId: number;
  enabled: boolean;
  scheduleType: 'daily' | 'weekly' | 'monthly' | 'manual';
  scheduleTime: string;
  scheduleDay?: number;
  retentionCount: number;
  lastBackupAt?: string;
  nextBackupAt?: string;
}

interface BackupHistory {
  id: number;
  businessId: number;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  backupType: 'scheduled' | 'manual';
  errorMessage?: string;
  customersCount: number;
  productsCount: number;
  salesCount: number;
  purchasesCount: number;
  paymentsCount: number;
  completedAt?: string;
  createdAt: string;
}

const BackupSettings: React.FC = () => {
  const { currentBusiness } = useAuthStore();
  const { success: showSuccess, error: showError } = useMessage();
  const [form] = Form.useForm();

  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [histories, setHistories] = useState<BackupHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState<number | null>(null);

  useEffect(() => {
    if (currentBusiness) {
      fetchConfig();
      fetchHistory();
    }
  }, [currentBusiness]);

  const fetchConfig = async () => {
    if (!currentBusiness) return;
    setConfigLoading(true);
    try {
      const response = await backupAPI.getConfig(currentBusiness.id);
      if (response.data.success) {
        setConfig(response.data.data);
        form.setFieldsValue({
          enabled: response.data.data.enabled,
          scheduleType: response.data.data.scheduleType,
          scheduleTime: dayjs(response.data.data.scheduleTime, 'HH:mm'),
          scheduleDay: response.data.data.scheduleDay,
          retentionCount: response.data.data.retentionCount,
        });
      }
    } catch (error) {
      console.error('Failed to fetch backup config:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const response = await backupAPI.getHistory(currentBusiness.id);
      if (response.data.success) {
        setHistories(response.data.data.histories);
      }
    } catch (error) {
      console.error('Failed to fetch backup history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (values: any) => {
    if (!currentBusiness) return;
    setConfigLoading(true);
    try {
      const response = await backupAPI.updateConfig(currentBusiness.id, {
        enabled: values.enabled,
        scheduleType: values.scheduleType,
        scheduleTime: values.scheduleTime?.format('HH:mm') || '03:00',
        scheduleDay: values.scheduleDay,
        retentionCount: values.retentionCount,
      });
      if (response.data.success) {
        setConfig(response.data.data);
        showSuccess('백업 설정이 저장되었습니다.');
      }
    } catch (error) {
      showError('백업 설정 저장에 실패했습니다.');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!currentBusiness) return;
    setBackupLoading(true);
    try {
      const response = await backupAPI.createBackup(currentBusiness.id);
      if (response.data.success) {
        showSuccess('백업이 완료되었습니다.');
        fetchHistory();
        fetchConfig();
      }
    } catch (error) {
      showError('백업 생성에 실패했습니다.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (historyId: number) => {
    if (!currentBusiness) return;

    Modal.confirm({
      title: '데이터 복원',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
            경고: 기존 데이터가 모두 삭제되고 백업 데이터로 대체됩니다!
          </p>
          <p>이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?</p>
        </div>
      ),
      okText: '복원',
      okType: 'danger',
      cancelText: '취소',
      async onOk() {
        setRestoreLoading(historyId);
        try {
          const response = await backupAPI.restoreBackup(currentBusiness.id, historyId);
          if (response.data.success) {
            const { customers, products, sales, purchases, payments } = response.data.data;
            showSuccess(
              `복원 완료! 거래처 ${customers}건, 품목 ${products}건, 매출 ${sales}건, 매입 ${purchases}건, 수금 ${payments}건`
            );
          }
        } catch (error) {
          showError('복원에 실패했습니다.');
        } finally {
          setRestoreLoading(null);
        }
      },
    });
  };

  const handleDownload = async (historyId: number, fileName: string) => {
    if (!currentBusiness) return;
    try {
      const response = await backupAPI.downloadBackup(currentBusiness.id, historyId);
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showError('다운로드에 실패했습니다.');
    }
  };

  const handleDelete = async (historyId: number) => {
    if (!currentBusiness) return;
    try {
      await backupAPI.deleteBackup(currentBusiness.id, historyId);
      showSuccess('백업이 삭제되었습니다.');
      fetchHistory();
    } catch (error) {
      showError('삭제에 실패했습니다.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">완료</Tag>;
      case 'in_progress':
        return <Tag icon={<SyncOutlined spin />} color="processing">진행중</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">실패</Tag>;
      default:
        return <Tag color="default">대기중</Tag>;
    }
  };

  const columns = [
    {
      title: '생성일시',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '유형',
      dataIndex: 'backupType',
      key: 'backupType',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'scheduled' ? 'blue' : 'green'}>
          {type === 'scheduled' ? '자동' : '수동'}
        </Tag>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '데이터 요약',
      key: 'summary',
      render: (_: any, record: BackupHistory) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          거래처 {record.customersCount} | 품목 {record.productsCount} |
          매출 {record.salesCount} | 매입 {record.purchasesCount} |
          수금 {record.paymentsCount}
        </Text>
      ),
    },
    {
      title: '파일 크기',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: formatFileSize,
    },
    {
      title: '작업',
      key: 'actions',
      width: 180,
      render: (_: any, record: BackupHistory) => (
        <Space size="small">
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.id, record.fileName)}
            disabled={record.status !== 'completed'}
          >
            다운로드
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleRestore(record.id)}
            loading={restoreLoading === record.id}
            disabled={record.status !== 'completed'}
          >
            복원
          </Button>
          <Popconfirm
            title="이 백업을 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const scheduleType = Form.useWatch('scheduleType', form);

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CloudUploadOutlined />
                <span>자동 백업 설정</span>
              </Space>
            }
          >
            <Spin spinning={configLoading}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSaveConfig}
                initialValues={{
                  enabled: false,
                  scheduleType: 'daily',
                  scheduleTime: dayjs('03:00', 'HH:mm'),
                  retentionCount: 7,
                }}
              >
                <Form.Item
                  name="enabled"
                  label="자동 백업 활성화"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item name="scheduleType" label="백업 주기">
                  <Select>
                    <Select.Option value="daily">매일</Select.Option>
                    <Select.Option value="weekly">매주</Select.Option>
                    <Select.Option value="monthly">매월</Select.Option>
                    <Select.Option value="manual">수동만</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="scheduleTime" label="백업 시간">
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>

                {scheduleType === 'weekly' && (
                  <Form.Item name="scheduleDay" label="요일">
                    <Select>
                      <Select.Option value={1}>월요일</Select.Option>
                      <Select.Option value={2}>화요일</Select.Option>
                      <Select.Option value={3}>수요일</Select.Option>
                      <Select.Option value={4}>목요일</Select.Option>
                      <Select.Option value={5}>금요일</Select.Option>
                      <Select.Option value={6}>토요일</Select.Option>
                      <Select.Option value={0}>일요일</Select.Option>
                    </Select>
                  </Form.Item>
                )}

                {scheduleType === 'monthly' && (
                  <Form.Item name="scheduleDay" label="날짜">
                    <InputNumber min={1} max={31} style={{ width: '100%' }} />
                  </Form.Item>
                )}

                <Form.Item name="retentionCount" label="백업 보관 개수">
                  <InputNumber min={1} max={30} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={configLoading}>
                    설정 저장
                  </Button>
                </Form.Item>
              </Form>

              {config?.lastBackupAt && (
                <Alert
                  message={`마지막 백업: ${dayjs(config.lastBackupAt).format('YYYY-MM-DD HH:mm:ss')}`}
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CloudDownloadOutlined />
                <span>수동 백업</span>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="수동 백업"
                description="지금 바로 백업을 생성합니다. 모든 데이터(거래처, 품목, 매출, 매입, 수금)가 포함됩니다."
                type="info"
                showIcon
              />
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={handleCreateBackup}
                loading={backupLoading}
                block
              >
                지금 백업하기
              </Button>
            </Space>
          </Card>

          <Card
            title={
              <Space>
                <HistoryOutlined />
                <span>백업 통계</span>
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0 }}>
                    {histories.filter(h => h.status === 'completed').length}
                  </Title>
                  <Text type="secondary">완료된 백업</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0 }}>
                    {histories.filter(h => h.backupType === 'scheduled').length}
                  </Title>
                  <Text type="secondary">자동 백업</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0 }}>
                    {histories.filter(h => h.backupType === 'manual').length}
                  </Title>
                  <Text type="secondary">수동 백업</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <HistoryOutlined />
            <span>백업 이력</span>
          </Space>
        }
        style={{ marginTop: 24 }}
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchHistory} loading={loading}>
            새로고침
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={histories}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};

export default BackupSettings;
