import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Row,
  Col,
  Popconfirm,
  message,
  Tooltip,
} from 'antd';
import ExcelUploadModal from '../Common/ExcelUploadModal';
import ExcelBulkUploadModal from '../Common/ExcelBulkUploadModal';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { customerAPI } from '../../utils/api';
import { formatPhoneNumber, formatBusinessNumber } from '../../utils/formatters';
import CustomerPrintModal from '../Print/CustomerPrintModal';
import logger from '../../utils/logger';

const { Option } = Select;

interface Customer {
  id: number;
  customerCode: string;
  name: string;
  businessNumber?: string;
  representative?: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  managerContact?: string;
  businessType?: string;
  businessItem?: string;
  customerType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterType] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const { currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [excelUploadModalVisible, setExcelUploadModalVisible] = useState(false);
  const [printModalVisible, setPrintModalVisible] = useState(false);

  useEffect(() => {
    if (currentBusiness) {
      loadCustomers();
    }
  }, [currentBusiness, pagination.current, pagination.pageSize, searchText, filterType, sortField, sortOrder]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === '1') {
        event.preventDefault();
        handleAddCustomer();
      } else if (event.altKey && event.key === '3') {
        event.preventDefault();
        if (selectedRowKeys.length > 0) {
          handleBatchDelete();
        }
      } else if (event.altKey && event.key === '2') {
        event.preventDefault();
        handleSelectAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedRowKeys, customers]);

  useEffect(() => {
    if (!isModalVisible) return;

    const handleModalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F4') {
        event.preventDefault();
        if (!editingCustomer) {
          form.validateFields().then(_values => {
            handleModalOk(true);
          }).catch(info => {
            logger.debug('Validate Failed:', info);
          });
        }
      }
    };

    document.addEventListener('keydown', handleModalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleModalKeyDown);
    };
  }, [isModalVisible, editingCustomer, form]);

  const loadCustomers = async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      const response = await customerAPI.getAll(currentBusiness.id, {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        type: filterType,
        sortField: sortField,
        sortOrder: sortOrder,
      });

      setCustomers(response.data.data.customers);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination.total,
      }));
    } catch (error) {
      logger.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    // 새 거래처 등록시 자동으로 거래처코드 설정
    form.setFieldsValue({
      customerCode: generateNextCustomerCode()
    });
    setIsModalVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      ...customer,
      businessNumber: customer.businessNumber ? formatBusinessNumber(customer.businessNumber) : '',
      phone: customer.phone ? formatPhoneNumber(customer.phone) : '',
    });
    setIsModalVisible(true);
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!currentBusiness) return;

    try {
      await customerAPI.delete(currentBusiness.id, id);
      message.success('거래처가 삭제되었습니다.', 2);
      loadCustomers();
    } catch (error) {
      logger.error('Failed to delete customer:', error);
    }
  };

  // 다음 거래처코드 생성 함수
  const generateNextCustomerCode = () => {
    const maxCustomerCode = customers
      .filter(customer => customer.customerCode?.startsWith('C'))
      .map(customer => {
        const match = customer.customerCode?.match(/^C(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .reduce((max, num) => Math.max(max, num), 0);

    const nextNumber = maxCustomerCode + 1;
    return `C${nextNumber.toString().padStart(4, '0')}`;
  };

  const handleBatchDelete = async () => {
    if (!currentBusiness || selectedRowKeys.length === 0) return;

    try {
      await Promise.all(
        selectedRowKeys.map(id => customerAPI.delete(currentBusiness.id, id as number))
      );
      message.success(`${selectedRowKeys.length}개 거래처가 삭제되었습니다.`, 2);
      setSelectedRowKeys([]);
      loadCustomers();
    } catch (error) {
      logger.error('Failed to batch delete customers:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!currentBusiness) return;

    try {
      const response = await customerAPI.deleteAll(currentBusiness.id);
      message.success(response.data.message || '모든 거래처가 삭제되었습니다.', 2);
      setSelectedRowKeys([]);
      loadCustomers();
    } catch (error) {
      logger.error('Failed to delete all customers:', error);
      message.error('거래처 전체 삭제에 실패했습니다.');
    }
  };

  const handleSelectAll = () => {
    if (selectedRowKeys.length === customers.length && customers.length > 0) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(customers.map(customer => customer.id));
    }
  };

  const handleModalOk = async (resetAfterSave = false) => {
    if (!currentBusiness) return;

    try {
      const values = await form.validateFields();

      // 사업자번호에서 하이픈 제거
      if (values.businessNumber) {
        values.businessNumber = values.businessNumber.replace(/-/g, '');
      }

      // type을 customerType으로 변경
      if (values.customerType) {
        values.type = values.customerType;
      }

      if (editingCustomer) {
        await customerAPI.update(currentBusiness.id, editingCustomer.id, values);
        message.success('거래처가 수정되었습니다.', 2);
      } else {
        await customerAPI.create(currentBusiness.id, values);
        message.success('거래처가 저장되었습니다.', 2);
      }

      if (resetAfterSave && !editingCustomer) {
        // 저장 후 초기화 - 새로 등록할 때만
        form.resetFields();
        await loadCustomers(); // 거래처 목록을 새로 불러와서 코드 생성에 반영
        form.setFieldsValue({
          customerCode: generateNextCustomerCode()
        });
      } else {
        // 일반 저장
        setIsModalVisible(false);
        form.resetFields();
        setEditingCustomer(null);
        loadCustomers();
      }
    } catch (error) {
      logger.error('Failed to save customer:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    logger.debug('CustomerManagement handleExport called with type:', type);
    const dataToExport = selectedRowKeys.length > 0
      ? customers.filter(customer => selectedRowKeys.includes(customer.id))
      : customers;

    const { exportToExcel, exportToPDF, getCommonColumns } = await import('../../utils/exportUtils');

    const options = {
      filename: `거래처목록_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      title: '거래처 관리',
      columns: getCommonColumns().customer,
      data: dataToExport,
      selectedRowKeys
    };

    switch (type) {
      case 'excel':
        await exportToExcel(options);
        break;
      case 'pdf':
        await exportToPDF(options);
        break;
    }
  };

  // 카카오 주소 찾기
  const openDaumPostcode = () => {
    if (!(window as any).daum) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new (window as any).daum.Postcode({
      oncomplete: function(data: any) {
        let addr = '';
        let extraAddr = '';

        if (data.userSelectedType === 'R') {
          addr = data.roadAddress;
        } else {
          addr = data.jibunAddress;
        }

        if (data.userSelectedType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddr += data.bname;
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          if (extraAddr !== '') {
            extraAddr = ' (' + extraAddr + ')';
          }
        }

        const fullAddress = addr + extraAddr;
        form.setFieldsValue({ address: fullAddress });
      }
    }).open();
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };


  // 엑셀 업로드 처리
  const handleExcelUpload = async (data: any[]) => {
    if (!currentBusiness || data.length === 0) return;

    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const row of data) {
        try {
          await customerAPI.create(currentBusiness.id, {
            customerCode: row['거래처코드'] || '',
            name: row['거래처명'] || '',
            businessNumber: row['사업자번호']?.toString().replace(/-/g, '') || '',
            representative: row['대표자'] || '',
            customerType: '기타',
            address: row['주소'] || '',
            phone: row['전화번호'] || '',
            fax: row['팩스번호'] || '',
            email: row['이메일'] || '',
            managerContact: row['담당자 연락처'] || '',
            businessType: row['업태'] || '',
            businessItem: row['종목'] || '',
            memo: row['비고'] || ''
          });
          successCount++;
        } catch (error) {
          failCount++;
          logger.error('Customer upload error:', error);
        }
      }

      message.success(`${successCount}건 업로드 완료, ${failCount}건 실패`);
      loadCustomers();
    } catch (error) {
      message.error('엑셀 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (paginationConfig: any, filters: any, sorter: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));

    // 정렬 처리
    if (sorter && sorter.field && sorter.order) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    } else {
      setSortField('');
      setSortOrder('desc');
    }
  };

  const handleRowDoubleClick = (record: Customer) => {
    handleEditCustomer(record);
  };


  const columns = [
    {
      title: '거래처코드',
      dataIndex: 'customerCode',
      key: 'customerCode',
      width: 110,
      align: 'center' as const,
      sorter: true,
      sortOrder: sortField === 'customerCode' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      ellipsis: true,
    },
    {
      title: '거래처명',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      align: 'center' as const,
      sorter: true,
      sortOrder: sortField === 'name' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string, record: Customer) => (
        <Tooltip placement="topLeft" title={text}>
          <Button
            type="link"
            onClick={() => handleEditCustomer(record)}
            style={{ padding: 0, height: 'auto', textAlign: 'left', width: '100%' }}
          >
            {text}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '사업자번호',
      dataIndex: 'businessNumber',
      key: 'businessNumber',
      width: 130,
      align: 'center' as const,
      sorter: true,
      sortOrder: sortField === 'businessNumber' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text: string) => text ? formatBusinessNumber(text) : '-',
    },
    {
      title: '주소',
      dataIndex: 'address',
      key: 'address',
      width: 180,
      align: 'center' as const,
      sorter: true,
      sortOrder: sortField === 'address' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text || '미등록'}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '업태',
      dataIndex: 'businessType',
      key: 'businessType',
      width: 100,
      align: 'center' as const,
      sorter: true,
      sortOrder: sortField === 'businessType' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text || '미등록'}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '종목',
      dataIndex: 'businessItem',
      key: 'businessItem',
      width: 100,
      align: 'center' as const,
      sorter: true,
      sortOrder: sortField === 'businessItem' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text || '미등록'}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '대표자',
      dataIndex: 'representative',
      key: 'representative',
      width: 90,
      align: 'center' as const,
      sorter: true,
      sortOrder: sortField === 'representative' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text || '미등록'}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '전화번호',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      align: 'center' as const,
      sorter: true,
      sortOrder: sortField === 'phone' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text: string) => text ? formatPhoneNumber(text) : '-',
    },
    {
      title: '팩스번호',
      dataIndex: 'fax',
      key: 'fax',
      width: 120,
      align: 'center' as const,
      sorter: true,
      sortOrder: sortField === 'fax' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text: string) => text ? formatPhoneNumber(text) : '-',
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      width: 150,
      align: 'center' as const,
      sorter: true,
      sortOrder: sortField === 'email' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text || '미등록'}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '담당자 연락처',
      dataIndex: 'managerContact',
      key: 'managerContact',
      width: 130,
      align: 'center' as const,
      sorter: true,
      sortOrder: sortField === 'managerContact' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text: string) => text ? formatPhoneNumber(text) : '-',
    },
    {
      title: '작업',
      key: 'actions',
      width: 90,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, record: Customer) => (
        <Space size="small">
          <Tooltip title="수정">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditCustomer(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Popconfirm
            title="정말로 삭제하시겠습니까?"
            onConfirm={() => handleDeleteCustomer(record.id)}
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="삭제">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];



  return (
    <div style={{
      padding: window.innerWidth <= 768 ? '16px 8px' : '24px',
      minHeight: 'calc(100vh - 140px)'
    }}>
      <Row align="middle" gutter={[16, 16]} style={{ marginBottom: window.innerWidth <= 768 ? 16 : 24 }}>
        <Col xs={24} md={8}>
          <h2 style={{
            margin: 0,
            color: isDark ? '#ffffff' : '#000000',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            거래처 관리
          </h2>
        </Col>
        <Col xs={24} md={16}>
          <Space
            direction={window.innerWidth <= 768 ? "vertical" : "horizontal"}
            size={window.innerWidth <= 768 ? 8 : 16}
            wrap
            style={{ width: '100%' }}
          >
            <Input.Search
              placeholder={window.innerWidth <= 768 ? "거래처명/사업자번호" : "거래처명 또는 사업자번호 검색"}
              allowClear
              enterButton={<SearchOutlined />}
              size={window.innerWidth <= 768 ? "small" : "middle"}
              onSearch={handleSearch}
              style={{ width: window.innerWidth <= 768 ? '100%' : 300 }}
            />
            <Space wrap size={window.innerWidth <= 768 ? 4 : 8}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddCustomer}
                size={window.innerWidth <= 768 ? "small" : "middle"}
              >
                추가
              </Button>
              <Button
                icon={<ImportOutlined />}
                size={window.innerWidth <= 768 ? "small" : "middle"}
                onClick={() => setExcelUploadModalVisible(true)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
              >
                {window.innerWidth <= 768 ? '엑셀' : '엑셀업로드'}
              </Button>
              <Button
                size={window.innerWidth <= 768 ? "small" : "middle"}
                type="default"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                onClick={() => {
                  if (selectedRowKeys.length === customers.length && customers.length > 0) {
                    setSelectedRowKeys([]);
                  } else {
                    setSelectedRowKeys(customers.map(customer => customer.id));
                  }
                }}
              >
                {window.innerWidth <= 768 ? '전체' : (selectedRowKeys.length === customers.length && customers.length > 0 ? '전체 해제' : '전체 선택')}
              </Button>
              <Popconfirm
                title={`선택한 ${selectedRowKeys.length}개 항목을 삭제하시겠습니까?`}
                onConfirm={handleBatchDelete}
                okText="예"
                cancelText="아니오"
                disabled={selectedRowKeys.length === 0}
                okButtonProps={{
                  autoFocus: true,
                  size: 'large',
                  style: { minWidth: '80px', height: '40px', fontSize: '16px' }
                }}
                cancelButtonProps={{
                  size: 'large',
                  style: { minWidth: '80px', height: '40px', fontSize: '16px' }
                }}
                placement="top"
                overlayStyle={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 9999,
                  pointerEvents: 'auto'
                }}
                styles={{
                  body: {
                    padding: '20px',
                    fontSize: '18px',
                    fontWeight: '500',
                    minWidth: '350px',
                    textAlign: 'center',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                  }
                }}
                transitionName=""
                mouseEnterDelay={0}
                mouseLeaveDelay={0}
              >
                <Button
                  size={window.innerWidth <= 768 ? "small" : "middle"}
                  danger
                  disabled={selectedRowKeys.length === 0}
                >
                  {window.innerWidth <= 768 ? `삭제(${selectedRowKeys.length})` : `선택 삭제 (${selectedRowKeys.length})`}
                </Button>
              </Popconfirm>
              <Popconfirm
                title="모든 거래처를 삭제하시겠습니까?"
                description="이 작업은 되돌릴 수 없습니다."
                onConfirm={handleDeleteAll}
                okText="예"
                cancelText="아니오"
                okButtonProps={{
                  autoFocus: true,
                  size: 'large',
                  style: { minWidth: '80px', height: '40px', fontSize: '16px' },
                  danger: true
                }}
                cancelButtonProps={{
                  size: 'large',
                  style: { minWidth: '80px', height: '40px', fontSize: '16px' }
                }}
                placement="top"
                overlayStyle={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 9999,
                  pointerEvents: 'auto'
                }}
                styles={{
                  body: {
                    padding: '20px',
                    fontSize: '18px',
                    fontWeight: '500',
                    minWidth: '350px',
                    textAlign: 'center',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                  }
                }}
                transitionName=""
                mouseEnterDelay={0}
                mouseLeaveDelay={0}
              >
                <Button
                  size={window.innerWidth <= 768 ? "small" : "middle"}
                  danger
                  type="primary"
                >
                  전체 삭제
                </Button>
              </Popconfirm>
              <Button
                onClick={() => handleExport('excel')}
                icon={<FileExcelOutlined />}
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}
                size={window.innerWidth <= 768 ? "small" : "middle"}
              >
                엑셀
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                icon={<FilePdfOutlined />}
                style={{ backgroundColor: '#fa541c', borderColor: '#fa541c', color: 'white' }}
                size={window.innerWidth <= 768 ? "small" : "middle"}
              >
                PDF
              </Button>
              <Button
                onClick={() => setPrintModalVisible(true)}
                icon={<PrinterOutlined />}
                style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
                size={window.innerWidth <= 768 ? "small" : "middle"}
              >
                인쇄
              </Button>
            </Space>
          </Space>
        </Col>
      </Row>

      <Table
          id="customer-table"
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            ...pagination,
            pageSize: window.innerWidth <= 768 ? 5 : pagination.pageSize,
            showSizeChanger: window.innerWidth > 768,
            showQuickJumper: window.innerWidth > 768,
            simple: window.innerWidth <= 768,
            showTotal: (total, range) =>
              window.innerWidth <= 768
                ? `${total}건`
                : `${range[0]}-${range[1]} of ${total} items`,
          }}
          onChange={handleTableChange}
          onRow={(record) => ({
            onClick: (e) => {
              // 체크박스, 버튼, 링크 클릭은 제외
              const target = e.target as HTMLElement;
              if (
                target.closest('.ant-checkbox') ||
                target.closest('.ant-btn') ||
                target.closest('button') ||
                target.closest('a')
              ) {
                return;
              }

              // 행 클릭 시 체크박스 토글
              if (selectedRowKeys.includes(record.id)) {
                setSelectedRowKeys(selectedRowKeys.filter(key => key !== record.id));
              } else {
                setSelectedRowKeys([...selectedRowKeys, record.id]);
              }
            },
            onDoubleClick: () => handleRowDoubleClick(record),
            style: { cursor: 'pointer' },
          })}
          scroll={{ x: window.innerWidth <= 768 ? 1400 : 'max-content', y: window.innerWidth <= 768 ? 400 : 600 }}
          size={window.innerWidth <= 768 ? 'small' : 'middle'}
        />

      <Modal
        title={editingCustomer ? '거래처 수정' : '거래처 등록'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        width={window.innerWidth <= 768 ? '95%' : 800}
        style={{ top: window.innerWidth <= 768 ? 20 : undefined }}
        footer={
          window.innerWidth <= 768 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                key="cancel"
                size="small"
                onClick={handleModalCancel}
                style={{ width: '100%' }}
              >
                취소
              </Button>
              <Button
                key="save"
                size="small"
                type="primary"
                loading={loading}
                onClick={() => handleModalOk()}
                style={{ width: '100%' }}
              >
                저장
              </Button>
              {!editingCustomer && (
                <Button
                  key="saveAndReset"
                  size="small"
                  type="default"
                  style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    color: 'white',
                    width: '100%'
                  }}
                  loading={loading}
                  onClick={() => handleModalOk(true)}
                >
                  저장 후 초기화
                </Button>
              )}
            </Space>
          ) : [
            <Button key="cancel" size="middle" onClick={handleModalCancel}>
              취소
            </Button>,
            <Button key="save" size="middle" type="primary" loading={loading} onClick={() => handleModalOk()}>
              저장
            </Button>,
            !editingCustomer && (
              <Button
                key="saveAndReset"
                size="middle"
                type="default"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                loading={loading}
                onClick={() => handleModalOk(true)}
              >
                저장 후 초기화
              </Button>
            )
          ]
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            customerType: '기타',
          }}
        >
          <Row gutter={window.innerWidth <= 768 ? 8 : 16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="거래처명"
                name="name"
                rules={[
                  { required: true, message: '거래처명을 입력해주세요' },
                  { min: 1, max: 200, message: '거래처명은 1-200자 사이여야 합니다' },
                ]}
              >
                <Input
                  placeholder="거래처명 입력"
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="구분"
                name="customerType"
                rules={[{ required: true, message: '거래처 구분을 선택해주세요' }]}
              >
                <Select size={window.innerWidth <= 768 ? 'small' : 'middle'}>
                  <Option value="매출처">매출처</Option>
                  <Option value="매입처">매입처</Option>
                  <Option value="기타">기타</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={window.innerWidth <= 768 ? 8 : 16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="사업자번호"
                name="businessNumber"
                rules={[
                  { pattern: /^\d{3}-\d{2}-\d{5}$/, message: '올바른 사업자번호 형식이 아닙니다 (000-00-00000)' },
                ]}
              >
                <Input
                  placeholder="000-00-00000"
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                  onChange={(e) => {
                    const formatted = formatBusinessNumber(e.target.value);
                    form.setFieldsValue({ businessNumber: formatted });
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="대표자"
                name="representative"
                rules={[
                  { max: 100, message: '대표자명은 100자 이하여야 합니다' },
                ]}
              >
                <Input
                  placeholder="대표자명 입력"
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={window.innerWidth <= 768 ? 8 : 16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="전화번호"
                name="phone"
                rules={[
                  { max: 20, message: '전화번호는 20자 이하여야 합니다' },
                ]}
              >
                <Input
                  placeholder="전화번호 입력"
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    form.setFieldsValue({ phone: formatted });
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="팩스번호"
                name="fax"
                rules={[
                  { max: 20, message: '팩스번호는 20자 이하여야 합니다' },
                ]}
              >
                <Input
                  placeholder="팩스번호 입력"
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    form.setFieldsValue({ fax: formatted });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={18}>
              <Form.Item
                label="주소"
                name="address"
                rules={[
                  { max: 500, message: '주소는 500자 이하여야 합니다' },
                ]}
              >
                <Input placeholder="주소를 입력하거나 주소찾기 버튼을 클릭하세요" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label=" " colon={false}>
                <Button
                  type="primary"
                  onClick={openDaumPostcode}
                  style={{ width: '100%' }}
                >
                  주소찾기
                </Button>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="이메일"
                name="email"
                rules={[
                  { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
                  { max: 100, message: '이메일은 100자 이하여야 합니다' },
                ]}
              >
                <Input placeholder="이메일 입력" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="담당자 연락처"
                name="managerContact"
                rules={[
                  { max: 20, message: '담당자 연락처는 20자 이하여야 합니다' },
                ]}
              >
                <Input
                  placeholder="담당자 연락처 입력"
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    form.setFieldsValue({ managerContact: formatted });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="업태"
                name="businessType"
                rules={[
                  { max: 100, message: '업태는 100자 이하여야 합니다' },
                ]}
              >
                <Input placeholder="업태 입력" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="종목"
                name="businessItem"
                rules={[
                  { max: 100, message: '종목은 100자 이하여야 합니다' },
                ]}
              >
                <Input placeholder="종목 입력" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 엑셀 업로드 모달 */}
      <ExcelUploadModal
        visible={excelUploadModalVisible}
        onCancel={() => setExcelUploadModalVisible(false)}
        onSuccess={handleExcelUpload}
        title="거래처 엑셀 업로드"
        templateType="customer"
        description="거래처 정보를 엑셀 파일로 일괄 업로드할 수 있습니다. 먼저 템플릿을 다운로드하여 양식을 확인하세요."
        requiredFields={['거래처명']}
      />

      <CustomerPrintModal
        open={printModalVisible}
        onClose={() => setPrintModalVisible(false)}
        customers={customers.filter(customer =>
          selectedRowKeys.length > 0
            ? selectedRowKeys.includes(customer.id)
            : true
        )}
        title="거래처 관리"
      />
    </div>
  );
};

export default CustomerManagement;