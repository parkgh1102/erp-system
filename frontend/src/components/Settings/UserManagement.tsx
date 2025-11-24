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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../utils/api';
import { useMessage } from '../../hooks/useMessage';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const { currentBusiness } = useAuthStore();
  const { success: showSuccess, error: showError } = useMessage();

  useEffect(() => {
    if (currentBusiness) {
      fetchUsers();
    }
  }, [currentBusiness]);

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
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
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

      if (editingUser) {
        // 수정
        await api.put(`/businesses/${currentBusiness.id}/users/${editingUser.id}`, values);
        showSuccess('사용자 정보가 수정되었습니다.');
      } else {
        // 생성
        await api.post(`/businesses/${currentBusiness.id}/users`, values);
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
              label="이메일"
              name="email"
              rules={[
                { required: true, message: '이메일을 입력해주세요.' },
                { type: 'email', message: '올바른 이메일 형식이 아닙니다.' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="example@email.com"
                disabled={!!editingUser}
              />
            </Form.Item>

            {!editingUser && (
              <Form.Item
                label="비밀번호"
                name="password"
                rules={[
                  { required: true, message: '비밀번호를 입력해주세요.' },
                  { min: 8, message: '비밀번호는 최소 8자 이상이어야 합니다.' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" />
              </Form.Item>
            )}

            <Form.Item
              label="이름"
              name="name"
              rules={[
                { required: true, message: '이름을 입력해주세요.' },
                { min: 2, message: '이름은 최소 2자 이상이어야 합니다.' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="홍길동" />
            </Form.Item>

            <Form.Item
              label="전화번호"
              name="phone"
            >
              <Input prefix={<PhoneOutlined />} placeholder="010-1234-5678" />
            </Form.Item>

            <Form.Item
              label="권한"
              name="role"
              rules={[{ required: true, message: '권한을 선택해주세요.' }]}
            >
              <Select>
                <Select.Option value="admin">관리자</Select.Option>
                <Select.Option value="sales_viewer">매출 조회 (전자서명 전용)</Select.Option>
              </Select>
            </Form.Item>

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
