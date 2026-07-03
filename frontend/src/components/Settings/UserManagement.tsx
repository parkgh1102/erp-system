import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Typography,
  Alert,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BankOutlined,
  KeyOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { api, businessAPI } from '../../utils/api';
import { useMessage } from '../../hooks/useMessage';
import TrackPagination from '../Common/TrackPagination';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface Business {
  id: number;
  companyName: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  businessIds?: number[];
  businesses?: Business[];
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('sales_viewer');
  const [form] = Form.useForm();
  // 비밀번호 초기화 모달 상태
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetForm] = Form.useForm();
  const [uPage, setUPage] = useState(1);
  const [uPageSize, setUPageSize] = useState(10);
  const { currentBusiness } = useAuthStore();
  const { success: showSuccess, error: showError } = useMessage();

  const pagedUsers = useMemo(() => {
    const start = (uPage - 1) * uPageSize;
    return users.slice(start, start + uPageSize);
  }, [users, uPage, uPageSize]);
  useEffect(() => {
    const pc = Math.max(1, Math.ceil(users.length / uPageSize));
    if (uPage > pc) setUPage(pc);
  }, [users.length, uPageSize, uPage]);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (currentBusiness) {
      fetchUsers();
    }
  }, [currentBusiness]);

  const fetchBusinesses = async () => {
    try {
      const response = await businessAPI.getAll();
      setAllBusinesses(response.data.data || []);
    } catch (error) {
      console.error('Fetch businesses error:', error);
    }
  };

  const fetchUsers = async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      const response = await api.get(`/businesses/${currentBusiness.id}/users`);
      setUsers(response.data.data);
    } catch (error) {
      showError('사용자 목록을 불러오는데 실패했습니다.');
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setSelectedRole('sales_viewer');
    form.resetFields();
    // 현재 사업자를 기본으로 선택
    if (currentBusiness) {
      form.setFieldsValue({ businessIds: [currentBusiness.id] });
    }
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    form.setFieldsValue({
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      businessIds: user.businessIds || [],
    });
    setModalVisible(true);
  };

  const handleDelete = async (userId: number) => {
    if (!currentBusiness) return;

    try {
      await api.delete(`/businesses/${currentBusiness.id}/users/${userId}`);
      showSuccess('사용자가 삭제되었습니다.');
      fetchUsers();
    } catch (error) {
      showError('사용자 삭제에 실패했습니다.');
      console.error('Delete user error:', error);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    if (!currentBusiness) return;

    try {
      await api.patch(`/businesses/${currentBusiness.id}/users/${userId}/toggle-status`);
      showSuccess('사용자 상태가 변경되었습니다.');
      fetchUsers();
    } catch (error) {
      showError('사용자 상태 변경에 실패했습니다.');
      console.error('Toggle status error:', error);
    }
  };

  // 비밀번호 초기화 모달 열기
  const handleOpenReset = (user: User) => {
    setResetTargetUser(user);
    resetForm.resetFields();
    // 전화번호 뒤 4자리를 기본 추천값으로 제안
    const digits = (user.phone || '').replace(/[^0-9]/g, '');
    if (digits.length >= 4) {
      resetForm.setFieldsValue({ password: digits.slice(-4) });
    }
    setResetModalVisible(true);
  };

  // 로그인 아이디(전화번호) 복사
  const handleCopyLoginId = (phone?: string) => {
    if (!phone) return;
    navigator.clipboard?.writeText(phone).then(
      () => showSuccess('로그인 아이디가 복사되었습니다.'),
      () => showError('복사에 실패했습니다.')
    );
  };

  // 비밀번호 초기화 실행
  const handleResetSubmit = async () => {
    if (!currentBusiness || !resetTargetUser) return;

    try {
      const values = await resetForm.validateFields();
      setResetLoading(true);
      await api.put(`/businesses/${currentBusiness.id}/users/${resetTargetUser.id}`, {
        password: values.password,
      });
      showSuccess(`${resetTargetUser.name}님의 비밀번호가 초기화되었습니다.`);
      setResetModalVisible(false);
      setResetTargetUser(null);
      resetForm.resetFields();
    } catch (error: any) {
      if (error?.errorFields) return; // 폼 검증 에러는 무시
      const errorMessage = error?.response?.data?.message || error?.message || '비밀번호 초기화에 실패했습니다.';
      showError(errorMessage);
      console.error('Reset password error:', error);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentBusiness) return;

    try {
      const values = await form.validateFields();

      // 빈 문자열 필드 제거
      const cleanedValues = Object.fromEntries(
        Object.entries(values).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
      );

      if (editingUser) {
        // 수정
        await api.put(`/businesses/${currentBusiness.id}/users/${editingUser.id}`, cleanedValues);
        showSuccess('사용자 정보가 수정되었습니다.');
      } else {
        // 생성
        await api.post(`/businesses/${currentBusiness.id}/users`, cleanedValues);
        showSuccess('사용자가 생성되었습니다.');
      }

      setModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error: any) {
      // axios 에러 응답에서 메시지 추출
      const errorMessage = error?.response?.data?.message || error?.message || '작업에 실패했습니다.';
      showError(errorMessage);
      console.error('Submit user error:', error);
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '전화번호 (로그인 ID)',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) =>
        text ? (
          <Space size={4}>
            <span>{text}</span>
            <Tooltip title="로그인 아이디 복사">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopyLoginId(text)}
              />
            </Tooltip>
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '권한',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleConfig = {
          admin: { color: 'blue', text: '관리자' },
          sales_viewer: { color: 'green', text: '매출 조회' },
        };
        const config = roleConfig[role as keyof typeof roleConfig] || { color: 'default', text: role };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '접근 사업자',
      dataIndex: 'businesses',
      key: 'businesses',
      render: (businesses: Business[]) => {
        if (!businesses || businesses.length === 0) return '-';
        if (businesses.length === 1) {
          return <Tag icon={<BankOutlined />}>{businesses[0].companyName}</Tag>;
        }
        return (
          <Tooltip title={businesses.map(b => b.companyName).join(', ')}>
            <Space size={4}>
              <Tag icon={<BankOutlined />}>{businesses[0].companyName}</Tag>
              <Tag>+{businesses.length - 1}</Tag>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            수정
          </Button>
          <Button
            type="link"
            icon={<KeyOutlined />}
            onClick={() => handleOpenReset(record)}
          >
            비밀번호 초기화
          </Button>
          <Button
            type="link"
            onClick={() => handleToggleStatus(record.id)}
          >
            {record.isActive ? '비활성화' : '활성화'}
          </Button>
          <Popconfirm
            title="사용자를 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>사용자 관리</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            사용자 추가
          </Button>
        </div>

        <Alert
          message="매출 조회 권한 안내"
          description="매출 조회 권한을 가진 사용자는 매출 관리 페이지만 볼 수 있으며, 전자 서명 기능만 사용할 수 있습니다."
          type="info"
          showIcon
        />

        <Table
          columns={columns}
          dataSource={pagedUsers}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
        <TrackPagination
          current={uPage}
          pageSize={uPageSize}
          total={users.length}
          onChange={(page, size) => { setUPage(page); setUPageSize(size); }}
          extra={`총 ${users.length}명`}
        />

        <Modal
          title={editingUser ? '사용자 수정' : '사용자 추가'}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          okText={editingUser ? '수정' : '생성'}
          cancelText="취소"
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{ role: 'sales_viewer' }}
          >
            <Form.Item
              label="전화번호 (로그인 ID)"
              name="phone"
              rules={[
                { required: true, message: '전화번호를 입력해주세요.' },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="01012345678"
                disabled={!!editingUser}
              />
            </Form.Item>

            <Form.Item
              label="비밀번호"
              name="password"
              rules={[
                { required: !editingUser, message: '비밀번호를 입력해주세요.' },
                { pattern: /^\d{4}$/, message: '비밀번호는 숫자 4자리여야 합니다.' },
              ]}
              extra={editingUser ? "변경 시에만 입력 (숫자 4자리)" : "숫자 4자리"}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={editingUser ? "변경할 비밀번호 입력" : "비밀번호"}
                maxLength={4}
              />
            </Form.Item>

            <Form.Item
              label="이름"
              name="name"
              rules={[
                { required: true, message: '이름을 입력해주세요.' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="홍길동" />
            </Form.Item>

            <Form.Item
              label="권한"
              name="role"
              rules={[{ required: true, message: '권한을 선택해주세요.' }]}
            >
              <Select onChange={(value) => setSelectedRole(value)}>
                <Select.Option value="sales_viewer">매출 조회 (전자서명 전용)</Select.Option>
              </Select>
            </Form.Item>

            {allBusinesses.length > 1 && (
              <Form.Item
                label="접근 가능 사업자"
                name="businessIds"
                rules={[{ required: true, message: '최소 1개의 사업자를 선택해주세요.' }]}
                extra="여러 사업자를 선택하면 해당 사용자가 로그인 시 사업자를 선택할 수 있습니다."
              >
                <Select
                  mode="multiple"
                  placeholder="접근 가능한 사업자 선택"
                  optionFilterProp="label"
                  options={allBusinesses.map(b => ({
                    value: b.id,
                    label: b.companyName,
                  }))}
                />
              </Form.Item>
            )}

            {!editingUser && (
              <Alert
                message="초기 비밀번호는 사용자가 로그인 후 변경할 수 있습니다."
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </Form>
        </Modal>

        {/* 비밀번호 초기화 모달 */}
        <Modal
          title="비밀번호 초기화"
          open={resetModalVisible}
          onOk={handleResetSubmit}
          confirmLoading={resetLoading}
          onCancel={() => {
            setResetModalVisible(false);
            setResetTargetUser(null);
            resetForm.resetFields();
          }}
          okText="초기화"
          cancelText="취소"
          width={460}
        >
          {resetTargetUser && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message={
                  <Space direction="vertical" size={2}>
                    <Text>
                      <UserOutlined /> <strong>{resetTargetUser.name}</strong> 님의 로그인 정보
                    </Text>
                    <Text>
                      <PhoneOutlined /> 아이디(전화번호):{' '}
                      <Text copyable={{ text: resetTargetUser.phone || '' }} strong>
                        {resetTargetUser.phone || '-'}
                      </Text>
                    </Text>
                  </Space>
                }
              />

              <Form form={resetForm} layout="vertical">
                <Form.Item
                  label="새 비밀번호 (숫자 4자리)"
                  name="password"
                  rules={[
                    { required: true, message: '새 비밀번호를 입력해주세요.' },
                    { pattern: /^\d{4}$/, message: '비밀번호는 숫자 4자리여야 합니다.' },
                  ]}
                  extra="기본값으로 전화번호 뒤 4자리가 입력되어 있습니다. 필요 시 변경하세요."
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="숫자 4자리"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </Form.Item>
              </Form>

              <Alert
                type="warning"
                showIcon
                message="초기화된 비밀번호를 사용자에게 안전하게 전달해주세요. 사용자는 로그인 후 직접 변경할 수 있습니다."
              />
            </Space>
          )}
        </Modal>
      </Space>
    </Card>
  );
};

export default UserManagement;
