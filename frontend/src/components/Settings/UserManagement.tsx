import React, { useState, useEffect } from 'react';
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
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { api, businessAPI } from '../../utils/api';
import { useMessage } from '../../hooks/useMessage';
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
  const { currentBusiness } = useAuthStore();
  const { success: showSuccess, error: showError } = useMessage();

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
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '전화번호',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => text || '-',
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
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
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

            {!editingUser && (
              <Form.Item
                label="비밀번호"
                name="password"
                rules={[
                  { required: true, message: '비밀번호를 입력해주세요.' },
                  { min: 4, message: '비밀번호는 최소 4자리 이상이어야 합니다.' },
                ]}
                extra="숫자 4자리 이상"
              >
                <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" />
              </Form.Item>
            )}

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
                <Select.Option value="admin">관리자</Select.Option>
                <Select.Option value="sales_viewer">매출 조회 (전자서명 전용)</Select.Option>
              </Select>
            </Form.Item>

            {selectedRole === 'sales_viewer' && allBusinesses.length > 1 && (
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
      </Space>
    </Card>
  );
};

export default UserManagement;
