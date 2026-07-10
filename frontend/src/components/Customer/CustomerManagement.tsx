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
  Dropdown,
  Drawer,
  Card,
  Checkbox,
  Tag,
  Skeleton,
  Empty,
} from 'antd';
import ExcelUploadModal from '../Common/ExcelUploadModal';
import { AnimatedSearchBar } from '../ui/AnimatedSearchBar';
import ExcelBulkUploadModal from '../Common/ExcelBulkUploadModal';
import UploadResultModal, { UploadResultItem } from '../Common/UploadResultModal';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  MoreOutlined,
  PhoneOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { customerAPI } from '../../utils/api';
import { formatPhoneNumber, formatBusinessNumber } from '../../utils/formatters';
import CustomerPrintModal from '../Print/CustomerPrintModal';
import logger from '../../utils/logger';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useResizableColumns } from '../../hooks/useResizableColumns';
import TrackPagination from '../Common/TrackPagination';
import MobileStickyBar from '../Common/MobileStickyBar';
import TableColumnSettings from '../Common/TableColumnSettings';

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
  const { isMobile } = useMediaQuery();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterType] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const { currentBusiness, user } = useAuthStore();
  const { isDark } = useThemeStore();
  const isSalesViewer = user?.role === 'sales_viewer';

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [excelUploadModalVisible, setExcelUploadModalVisible] = useState(false);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [uploadResultModalVisible, setUploadResultModalVisible] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResultItem[]>([]);
  const [mobileActionDrawerVisible, setMobileActionDrawerVisible] = useState(false);

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
      // F7: 저장
      if (event.key === 'F7') {
        event.preventDefault();
        form.validateFields().then(_values => {
          handleModalOk(false);
        }).catch(info => {
          logger.debug('Validate Failed:', info);
        });
      }
      // F8: 저장 후 초기화
      if (event.key === 'F8') {
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
    const results: UploadResultItem[] = [];

    try {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          await customerAPI.create(currentBusiness.id, {
            customerCode: row['거래처코드'] || '',
            name: row['거래처명'] || '',
            businessNumber: row['사업자번호']?.toString().replace(/-/g, '') || '',
            representative: row['대표자'] || '',
            customerType: row['거래처구분'] || '기타',
            address: row['주소'] || '',
            phone: row['전화번호'] || '',
            fax: row['팩스번호'] || '',
            email: row['이메일'] || '',
            managerContact: row['담당자 연락처'] || row['담당자연락처'] || '',
            businessType: row['업태'] || '',
            businessItem: row['종목'] || '',
            memo: row['비고'] || ''
          });
          results.push({
            rowNumber: i + 2, // 엑셀 기준 (헤더 제외)
            data: row,
            success: true
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류';
          results.push({
            rowNumber: i + 2,
            data: row,
            success: false,
            error: errorMessage
          });
          logger.error('Customer upload error:', error);
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      // 결과 저장 및 모달 표시
      setUploadResults(results);
      setUploadResultModalVisible(true);

      if (failCount === 0) {
        message.success(`${successCount}건 모두 업로드 완료!`);
      } else {
        message.warning(`${successCount}건 성공, ${failCount}건 실패 - 상세 내역을 확인하세요.`);
      }

      loadCustomers();
    } catch (error) {
      message.error('엑셀 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (paginationConfig: any, filters: any, sorter: any) => {
    if (paginationConfig && paginationConfig.current) {
      setPagination(prev => ({
        ...prev,
        current: paginationConfig.current,
        pageSize: paginationConfig.pageSize,
      }));
    }

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
          {isSalesViewer ? (
            <span>{text}</span>
          ) : (
            <Button
              type="link"
              onClick={() => handleEditCustomer(record)}
              style={{ padding: 0, height: 'auto', textAlign: 'left', width: '100%' }}
            >
              {text}
            </Button>
          )}
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
      hidden: isSalesViewer,
      render: (_: any, record: Customer) => (
        <Space size="small">
          <Tooltip title="수정">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditCustomer(record)}
              style={{ color: '#1B61A8' }}
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

  const { columns: resizableColumns, components: resizableComponents, columnMeta, toggleColumn, reset: resetColumns } = useResizableColumns(
    'customer',
    columns,
    { baseWidth: 1200, enabled: !isMobile, alwaysVisibleKeys: ['actions'] }
  );



  // 모바일 액션 드로어 내용
  const mobileActionDrawerContent = (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <Button
        icon={<ImportOutlined />}
        onClick={() => { setExcelUploadModalVisible(true); setMobileActionDrawerVisible(false); }}
        block
        size="large"
        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white', justifyContent: 'flex-start' }}
      >
        엑셀업로드
      </Button>
      <Button
        onClick={() => {
          if (selectedRowKeys.length === customers.length && customers.length > 0) {
            setSelectedRowKeys([]);
          } else {
            setSelectedRowKeys(customers.map(customer => customer.id));
          }
          setMobileActionDrawerVisible(false);
        }}
        block
        size="large"
        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white', justifyContent: 'flex-start' }}
      >
        {selectedRowKeys.length === customers.length && customers.length > 0 ? '전체 해제' : '전체 선택'}
      </Button>
      <Popconfirm
        title={`선택한 ${selectedRowKeys.length}개 항목을 삭제하시겠습니까?`}
        onConfirm={() => { handleBatchDelete(); setMobileActionDrawerVisible(false); }}
        okText="예"
        cancelText="아니오"
        disabled={selectedRowKeys.length === 0}
      >
        <Button danger block size="large" disabled={selectedRowKeys.length === 0} style={{ justifyContent: 'flex-start' }}>
          선택 삭제 ({selectedRowKeys.length})
        </Button>
      </Popconfirm>
      <Popconfirm
        title="모든 거래처를 삭제하시겠습니까?"
        description="이 작업은 되돌릴 수 없습니다."
        onConfirm={() => { handleDeleteAll(); setMobileActionDrawerVisible(false); }}
        okText="예"
        cancelText="아니오"
      >
        <Button danger type="primary" block size="large" style={{ justifyContent: 'flex-start' }}>
          전체 삭제
        </Button>
      </Popconfirm>
      <Button
        onClick={() => { handleExport('excel'); setMobileActionDrawerVisible(false); }}
        icon={<FileExcelOutlined />}
        block
        size="large"
        style={{ backgroundColor: '#1B61A8', borderColor: '#1B61A8', color: 'white', justifyContent: 'flex-start' }}
      >
        엑셀 내보내기
      </Button>
      <Button
        onClick={() => { handleExport('pdf'); setMobileActionDrawerVisible(false); }}
        icon={<FilePdfOutlined />}
        block
        size="large"
        style={{ backgroundColor: '#fa541c', borderColor: '#fa541c', color: 'white', justifyContent: 'flex-start' }}
      >
        PDF 내보내기
      </Button>
      <Button
        onClick={() => { setPrintModalVisible(true); setMobileActionDrawerVisible(false); }}
        icon={<PrinterOutlined />}
        block
        size="large"
        style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white', justifyContent: 'flex-start' }}
      >
        인쇄
      </Button>
    </Space>
  );

  // 모바일 카드 리스트 (테이블 대체)
  const toggleCardSelection = (id: number) => {
    setSelectedRowKeys(prev =>
      prev.includes(id) ? prev.filter(key => key !== id) : [...prev, id]
    );
  };

  const handleCopyAddress = (address: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(address).then(
        () => message.success('주소가 복사되었습니다'),
        () => message.error('주소 복사에 실패했습니다')
      );
    }
  };

  const renderCustomerCards = () => {
    if (loading) {
      return (
        <div>
          {[1, 2, 3].map(i => (
            <Card key={i} size="small" style={{ marginBottom: 8 }} styles={{ body: { padding: 12 } }}>
              <Skeleton active title={false} paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      );
    }
    if (customers.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="조회된 거래처가 없습니다."
          style={{ padding: '32px 0' }}
        />
      );
    }
    return (
      <div className="erp-stagger">
        {customers.map(customer => {
          const checked = selectedRowKeys.includes(customer.id);
          return (
            <Card
              key={customer.id}
              size="small"
              style={{ marginBottom: 8, borderColor: checked ? '#1B61A8' : undefined }}
              styles={{ body: { padding: 12 } }}
              onClick={isSalesViewer ? undefined : (e) => {
                const target = e.target as HTMLElement;
                if (
                  target.closest('.ant-checkbox') ||
                  target.closest('button') ||
                  target.closest('a')
                ) {
                  return;
                }
                toggleCardSelection(customer.id);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                  {!isSalesViewer && (
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleCardSelection(customer.id)}
                      style={{ marginTop: 2 }}
                    />
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {isSalesViewer ? (
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 15,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: isDark ? '#e6e6e6' : '#1f1f1f',
                          }}
                        >
                          {customer.name}
                        </span>
                      ) : (
                        <a
                          onClick={() => handleEditCustomer(customer)}
                          style={{
                            fontWeight: 600,
                            fontSize: 15,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: isDark ? '#7db4e8' : '#1B61A8',
                          }}
                        >
                          {customer.name}
                        </a>
                      )}
                      <Tag style={{ marginRight: 0, flexShrink: 0 }}>{customer.customerCode}</Tag>
                    </div>
                    {(customer.representative || customer.businessNumber) && (
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                        {customer.representative}
                        {customer.representative && customer.businessNumber ? ' · ' : ''}
                        {customer.businessNumber ? formatBusinessNumber(customer.businessNumber) : ''}
                      </div>
                    )}
                  </div>
                </div>
                {!isSalesViewer && (
                  <Space size={0} style={{ flexShrink: 0 }}>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEditCustomer(customer)}
                      style={{ color: '#1B61A8', minWidth: 40, minHeight: 40 }}
                      aria-label="수정"
                    />
                    <Popconfirm
                      title="정말로 삭제하시겠습니까?"
                      onConfirm={() => handleDeleteCustomer(customer.id)}
                      okText="삭제"
                      cancelText="취소"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        style={{ minWidth: 40, minHeight: 40 }}
                        aria-label="삭제"
                      />
                    </Popconfirm>
                  </Space>
                )}
              </div>
              {(customer.phone || customer.address) && (
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid rgba(128, 128, 128, 0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone.replace(/[^0-9+]/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: 13,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        width: 'fit-content',
                      }}
                    >
                      <PhoneOutlined />
                      {formatPhoneNumber(customer.phone)}
                    </a>
                  )}
                  {customer.address && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAddress(customer.address!);
                      }}
                      style={{
                        fontSize: 12,
                        color: '#8c8c8c',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <CopyOutlined style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {customer.address}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      padding: isMobile ? '16px 8px' : '24px',
      minHeight: 'calc(100vh - 140px)'
    }}>
      {/* 모바일 레이아웃 — sticky는 부모 박스 안에서만 고정되므로
          검색바를 작은 헤더 div가 아닌 페이지 레벨에 직접 배치 */}
      {isMobile ? (
        <>
          <h2 style={{
            margin: '0 0 12px 0',
            color: isDark ? '#ffffff' : '#000000',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            거래처 관리
          </h2>
          {/* 검색 + 주요 액션 버튼 (스크롤 시 상단 고정) */}
          <MobileStickyBar>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <AnimatedSearchBar
                placeholder="거래처명 또는 사업자번호 검색"
                onSearch={handleSearch}
                width="100%"
              />
              {!isSalesViewer && (
                <Space size="small" wrap>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCustomer} size="middle">
                    추가
                  </Button>
                  <Button
                    icon={<MoreOutlined />}
                    onClick={() => setMobileActionDrawerVisible(true)}
                    size="middle"
                  >
                    더보기
                  </Button>
                </Space>
              )}
            </Space>
          </MobileStickyBar>
          <div style={{ height: 8 }} />
        </>
      ) : (
        /* 데스크톱 레이아웃 */
        <Row align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <h2 style={{
              margin: 0,
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              거래처 관리
            </h2>
          </Col>
          <Col style={{ marginLeft: '100px' }}>
            <Space size="middle" wrap>
              <AnimatedSearchBar
                placeholder="거래처명 또는 사업자번호 검색"
                onSearch={handleSearch}
                width={300}
              />
              {!isSalesViewer && (
              <>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCustomer}>
                추가
              </Button>
              <Button
                icon={<ImportOutlined />}
                onClick={() => setExcelUploadModalVisible(true)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
              >
                엑셀업로드
              </Button>
              <Button
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
                {selectedRowKeys.length === customers.length && customers.length > 0 ? '전체 해제' : '전체 선택'}
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
                <Button danger disabled={selectedRowKeys.length === 0}>
                  선택 삭제 ({selectedRowKeys.length})
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
                <Button danger type="primary">
                  전체 삭제
                </Button>
              </Popconfirm>
              </>
              )}
              <Button
                onClick={() => handleExport('excel')}
                icon={<FileExcelOutlined />}
                style={{ backgroundColor: '#1B61A8', borderColor: '#1B61A8', color: 'white' }}
              >
                엑셀
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                icon={<FilePdfOutlined />}
                style={{ backgroundColor: '#fa541c', borderColor: '#fa541c', color: 'white' }}
              >
                PDF
              </Button>
              <Button
                onClick={() => setPrintModalVisible(true)}
                icon={<PrinterOutlined />}
                style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
              >
                인쇄
              </Button>
              <TableColumnSettings columns={columnMeta} onToggle={toggleColumn} onReset={resetColumns} />
            </Space>
          </Col>
        </Row>
      )}

      {/* 모바일 액션 드로어 */}
      <Drawer
        title="작업 선택"
        placement="bottom"
        onClose={() => setMobileActionDrawerVisible(false)}
        open={mobileActionDrawerVisible}
        height="auto"
        styles={{ body: { padding: '12px 16px' } }}
      >
        {mobileActionDrawerContent}
      </Drawer>

      {isMobile ? (
        renderCustomerCards()
      ) : (
        <Table
          id="customer-table"
          columns={resizableColumns}
          components={resizableComponents}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          rowSelection={isSalesViewer ? undefined : {
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={false}
          onChange={handleTableChange}
          onRow={isSalesViewer ? undefined : (record) => ({
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
          scroll={{ x: 'max-content', y: 600 }}
          size="middle"
        />
      )}

      <TrackPagination
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={pagination.total}
        showSizeChanger={!isMobile}
        onChange={(page, size) =>
          setPagination(prev => ({ ...prev, current: page, pageSize: size }))
        }
        extra={(() => {
          const total = pagination.total;
          if (isMobile) return `${total}건`;
          const start = total === 0 ? 0 : (pagination.current - 1) * pagination.pageSize + 1;
          const end = Math.min(pagination.current * pagination.pageSize, total);
          return `${start}-${end} of ${total} items`;
        })()}
      />

      <Modal
        title={editingCustomer ? '거래처 수정' : '거래처 등록'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        width={isMobile ? '100%' : 800}
        style={isMobile ? { top: 0, maxWidth: '100vw', margin: 0, paddingBottom: 0 } : undefined}
        footer={
          isMobile ? (
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
                className="erp-cta"
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
            <Button key="save" size="middle" type="primary" loading={loading} onClick={() => handleModalOk()} className="erp-cta">
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
          <Row gutter={isMobile ? 8 : 16}>
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
                  size={isMobile ? 'small' : 'middle'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="구분"
                name="customerType"
                rules={[{ required: true, message: '거래처 구분을 선택해주세요' }]}
              >
                <Select size={isMobile ? 'small' : 'middle'}>
                  <Option value="매출처">매출처</Option>
                  <Option value="매입처">매입처</Option>
                  <Option value="기타">기타</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={isMobile ? 8 : 16}>
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
                  size={isMobile ? 'small' : 'middle'}
                  inputMode="numeric"
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
                  size={isMobile ? 'small' : 'middle'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={isMobile ? 8 : 16}>
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
                  size={isMobile ? 'small' : 'middle'}
                  inputMode="numeric"
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
                  size={isMobile ? 'small' : 'middle'}
                  inputMode="numeric"
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
                  inputMode="numeric"
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

      {/* 업로드 결과 모달 */}
      <UploadResultModal
        visible={uploadResultModalVisible}
        onClose={() => setUploadResultModalVisible(false)}
        results={uploadResults}
        title="거래처 업로드 결과"
        columns={[
          { title: '거래처코드', dataIndex: '거래처코드' },
          { title: '거래처명', dataIndex: '거래처명' },
          { title: '사업자번호', dataIndex: '사업자번호' },
          { title: '대표자', dataIndex: '대표자' },
        ]}
      />
    </div>
  );
};

export default CustomerManagement;