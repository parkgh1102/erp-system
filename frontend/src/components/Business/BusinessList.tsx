import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Card,
  Modal,
  message,
  Popconfirm,
  Tag,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { BusinessForm } from './BusinessForm';
import { businessAPI } from '../../utils/api';
import type { Business } from '../../types/business';

const { Search } = Input;
const { Title } = Typography;

export const BusinessList: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    {
      title: '사업자번호',
      dataIndex: 'businessNumber',
      key: 'businessNumber',
      width: 130,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace' }}>{text}</span>
      )
    },
    {
      title: '상호명',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: '대표자',
      dataIndex: 'representative',
      key: 'representative',
      width: 120
    },
    {
      title: '업태',
      dataIndex: 'businessType',
      key: 'businessType',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: '종목',
      dataIndex: 'businessItem',
      key: 'businessItem',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: '연락처',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (text: string) => text || '-'
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '활성' : '비활성'}
        </Tag>
      )
    },
    {
      title: '관리',
      key: 'action',
      width: 120,
      render: (_: any, record: Business) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const fetchBusinesses = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await businessAPI.getAll({
        page,
        limit: pagination.pageSize,
        search
      });

      if (response.data?.success) {
        setBusinesses(response.data.data);
        setPagination(prev => ({
          ...prev,
          current: response.data.pagination?.page || 1,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('사업자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchBusinesses(1, value);
  };

  const handleTableChange = (newPagination: any) => {
    fetchBusinesses(newPagination.current, searchTerm);
  };

  const handleAdd = () => {
    setEditingBusiness(null);
    setIsModalVisible(true);
  };

  const handleEdit = (business: Business) => {
    setEditingBusiness(business);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await businessAPI.delete(id);
      if (response.data?.success) {
        message.success('사업자가 삭제되었습니다.');
        fetchBusinesses(pagination.current, searchTerm);
      }
    } catch (error) {
      message.error('삭제에 실패했습니다.');
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      let response;
      if (editingBusiness) {
        response = await businessAPI.update(editingBusiness.id, values);
      } else {
        response = await businessAPI.create(values);
      }

      if (response.success) {
        message.success(
          editingBusiness
            ? '사업자 정보가 수정되었습니다.'
            : '새 사업자가 등록되었습니다.'
        );
        setIsModalVisible(false);
        fetchBusinesses(pagination.current, searchTerm);
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        message.error('이미 등록된 사업자번호입니다.');
      } else {
        message.error('저장에 실패했습니다.');
      }
    }
  };

  const handleRefresh = () => {
    fetchBusinesses(pagination.current, searchTerm);
  };

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>사업자 관리</Title>
        <Space>
          <Search
            placeholder="상호명, 사업자번호, 대표자명으로 검색"
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            새로고침
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            사업자 등록
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={businesses}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} / 총 ${total}건`
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
        size="middle"
      />

      <Modal
        title={editingBusiness ? '사업자 수정' : '사업자 등록'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
        destroyOnHidden
      >
        <BusinessForm
          initialValues={editingBusiness}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalVisible(false)}
        />
      </Modal>
    </Card>
  );
};