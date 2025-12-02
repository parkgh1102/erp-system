import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, Input, Space, message, Popconfirm, Card, Row, Col, InputNumber, Tabs, Spin, AutoComplete, Typography, Dropdown, Radio, Alert } from 'antd';
import { EditOutlined, DeleteOutlined, MoneyCollectOutlined, PayCircleOutlined, SearchOutlined, ExportOutlined, ImportOutlined, PrinterOutlined } from '@ant-design/icons';
import { createExportMenuItems } from '../../utils/exportUtils';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { paymentAPI, customerAPI } from '../../utils/api';
import ExcelUploadModal from '../Common/ExcelUploadModal';
import DateRangeFilter from '../Common/DateRangeFilter';
import PaymentPrintModal from '../Print/PaymentPrintModal';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Option } = Select;
const { TextArea } = Input;
// RangePicker duplicate issue resolved

interface Customer {
  id: number;
  customerCode: string;
  name: string;
  businessNumber?: string;
  customerType: string;
  phone?: string;
  email?: string;
  address?: string;
  representative?: string;
}

interface Payment {
  id: number;
  paymentDate: string;
  customerId: number;
  customer?: Customer;
  type: 'receipt' | 'payment';
  amount: number;
  memo?: string;
  businessId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('receipt');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<{value: string}[]>([]);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [excelUploadModalVisible, setExcelUploadModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkForm] = Form.useForm();
  const { currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (currentBusiness) {
      fetchData();
    }
  }, [currentBusiness]);

  useEffect(() => {
    if (!modalVisible) return;

    const handleModalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F4') {
        event.preventDefault();
        if (!editingPayment) {
          form.validateFields().then(values => {
            handleSubmit(values, true);
          }).catch(info => {
            console.log('Validate Failed:', info);
          });
        }
      }
    };

    document.addEventListener('keydown', handleModalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleModalKeyDown);
    };
  }, [modalVisible, editingPayment, form]);

  const fetchData = async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      const [paymentsRes, customersRes] = await Promise.all([
        paymentAPI.getAll(currentBusiness.id),
        customerAPI.getAll(currentBusiness.id, { page: 1, limit: 10000 })
      ]);

      setPayments(paymentsRes.data.data.payments || []);
      setCustomers(customersRes.data.data.customers || []);

    } catch (error) {
      console.error('데이터 로드 오류:', error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    // 날짜 필터링
    const paymentDate = dayjs(payment.paymentDate);
    const [startDate, endDate] = dateRange;
    if (!paymentDate.isBetween(startDate, endDate, 'day', '[]')) {
      return false;
    }

    // 검색 텍스트 필터링
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      payment.customer?.name?.toLowerCase().includes(searchLower) ||
      payment.memo?.toLowerCase().includes(searchLower) ||
      payment.amount?.toString().includes(searchText)
    );
  });

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const generateAutoCompleteOptions = (keyword: string) => {
    if (keyword.length < 2) {
      setAutoCompleteOptions([]);
      return;
    }

    const searchLower = keyword.toLowerCase();
    const matches = new Set<string>();

    payments.forEach(payment => {
      if (payment.customer?.name?.toLowerCase().includes(searchLower)) {
        matches.add(payment.customer.name);
      }
      if (payment.memo?.toLowerCase().includes(searchLower)) {
        matches.add(payment.memo);
      }
      if (payment.amount?.toString().includes(keyword)) {
        matches.add(payment.amount.toString());
      }
    });

    const options = Array.from(matches)
      .slice(0, 10)
      .map(value => ({ value }));

    setAutoCompleteOptions(options);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    generateAutoCompleteOptions(value);
  };

  const handleAdd = (type: 'receipt' | 'payment') => {
    setEditingPayment(null);
    form.resetFields();
    form.setFieldsValue({
      type,
      paymentDate: dayjs()
    });
    setModalVisible(true);
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setModalVisible(true);
    setTimeout(() => {
      form.setFieldsValue({
        ...payment,
        paymentDate: dayjs(payment.paymentDate),
      });
    }, 100);
  };

  const handleDelete = async (id: number) => {
    if (!currentBusiness) return;

    try {
      const response = await paymentAPI.delete(currentBusiness.id, id);

      if (response.data?.success || response.status === 200) {
        message.success('수금/지급이 삭제되었습니다.', 2);
        fetchData();
      } else {
        message.error('수금/지급 삭제에 실패했습니다.', 2);
      }
    } catch (error) {
      message.error('수금/지급 삭제에 실패했습니다.', 2);
    }
  };

  const handleSelectAll = () => {
    const currentData = activeTab === 'receipt' ? getFilteredReceiptData() : getFilteredPaymentData();
    if (selectedRowKeys.length === currentData.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(currentData.map(payment => payment.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('삭제할 항목을 선택해주세요.', 2);
      return;
    }

    try {
      await Promise.all(selectedRowKeys.map(id =>
        paymentAPI.delete(currentBusiness!.id, id as number)
      ));

      message.success(`${selectedRowKeys.length}개의 수금/지급이 삭제되었습니다.`, 2);
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error('수금/지급 삭제에 실패했습니다.', 2);
    }
  };

  // 키보드 단축키 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 모달이 열려있으면 단축키 무시
      if (modalVisible || bulkModalVisible || uploadModalVisible || excelUploadModalVisible || printModalVisible) {
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            handleAdd('receipt'); // 수금
            break;
          case '2':
            event.preventDefault();
            handleAdd('payment'); // 지급
            break;
          case '3':
            event.preventDefault();
            handleSelectAll(); // 전체선택
            break;
          case '4':
            event.preventDefault();
            handleBulkDelete(); // 삭제
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalVisible, bulkModalVisible, uploadModalVisible, excelUploadModalVisible, printModalVisible]);

  const handlePrint = () => {
    setPrintModalVisible(true);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleRowClick = (record: Payment, event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        target.className.includes('ant-checkbox') ||
        target.closest('.ant-checkbox') ||
        target.closest('button') ||
        target.closest('.ant-btn')) {
      return;
    }

    event.preventDefault();

    if (selectedRowKeys.includes(record.id)) {
      setSelectedRowKeys(prev => prev.filter(key => key !== record.id));
    } else {
      setSelectedRowKeys(prev => [...prev, record.id]);
    }
  };

  const getRowSelection = () => ({
    selectedRowKeys,
    onChange: onSelectChange,
    preserveSelectedRowKeys: true,
  });

  const handleSubmit = async (values: any, resetAfterSave = false) => {
    if (!currentBusiness) return;

    try {
      const paymentData = {
        ...values,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        businessId: currentBusiness.id
      };

      if (editingPayment) {
        await paymentAPI.update(currentBusiness.id, editingPayment.id, paymentData);
        message.success('수금/지급이 수정되었습니다.', 2);
      } else {
        await paymentAPI.create(currentBusiness.id, paymentData);
        message.success('수금/지급이 저장되었습니다.', 2);
      }

      if (resetAfterSave && !editingPayment) {
        // 저장 후 초기화 - 새로 등록할 때만
        const currentType = form.getFieldValue('type');
        form.resetFields();
        await fetchData();
        // 오늘 날짜와 type 다시 설정
        form.setFieldsValue({
          paymentDate: dayjs(),
          type: currentType
        });
      } else {
        // 일반 저장
        setModalVisible(false);
        form.resetFields();
        setEditingPayment(null);
        fetchData();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '수금/지급 저장에 실패했습니다.', 2);
    }
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
          // 거래처명으로 거래처 찾기
          const customer = customers.find(c => c.name === row['거래처명']);
          if (!customer) {
            failCount++;
            console.error(`거래처를 찾을 수 없습니다: ${row['거래처명']}`);
            continue;
          }

          // 유형 처리 (수금/지급)
          let type = 'receipt';
          if (row['유형'] === '지급' || row['유형'] === 'payment') {
            type = 'payment';
          }

          await paymentAPI.create(currentBusiness.id, {
            paymentDate: row['결제일자'] || row['결제일'] || dayjs().format('YYYY-MM-DD'),
            customerId: customer.id,
            type: type,
            amount: Number(row['금액']) || 0,
            memo: (row['결제방법'] || '') + (row['비고'] ? ' ' + row['비고'] : ''),
            businessId: currentBusiness.id
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error('Payment upload error:', error);
        }
      }

      message.success(`${successCount}건 업로드 완료, ${failCount}건 실패`);
      fetchData();
    } catch (error) {
      message.error('엑셀 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 엑셀 업로드 관련 함수들
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFileUpload = (_file: File) => {
    // TODO: Implement file upload functionality
    message.info('파일 업로드 기능은 준비 중입니다.');
    return false;
  };

  const handleUploadConfirm = async () => {
    if (!currentBusiness || uploadData.length === 0) return;

    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const paymentData of uploadData) {
        try {
          if (!paymentData.customerId) {
            failCount++;
            console.error('Customer not found for:', paymentData.customerName);
            continue;
          }

          await paymentAPI.create(currentBusiness.id, {
            paymentDate: paymentData.paymentDate,
            customerId: paymentData.customerId,
            type: paymentData.type,
            amount: Number(paymentData.amount) || 0,
            memo: paymentData.memo,
            businessId: currentBusiness.id
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error('Payment upload error:', error);
        }
      }

      message.success(`${successCount}건 업로드 완료, ${failCount}건 실패`);
      setUploadModalVisible(false);
      setUploadData([]);
      fetchData();
    } catch (error) {
      message.error('엑셀 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const downloadTemplate = () => {
    // TODO: Implement template download functionality
    message.info('템플릿 다운로드 기능은 준비 중입니다.');
  };

  // 일괄 등록 함수
  const handleBulkCreate = async (values: any) => {
    if (!currentBusiness || !values.customerIds || values.customerIds.length === 0) {
      message.error('거래처를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const customerId of values.customerIds) {
        try {
          await paymentAPI.create(currentBusiness.id, {
            paymentDate: values.paymentDate.format('YYYY-MM-DD'),
            customerId: customerId,
            type: values.type,
            amount: values.amount,
            memo: values.memo || '',
            businessId: currentBusiness.id
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error('Bulk payment creation error:', error);
        }
      }

      message.success(`${successCount}건 등록 완료, ${failCount}건 실패`);
      setBulkModalVisible(false);
      bulkForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('일괄 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const receiptColumns = [
    {
      title: 'No.',
      key: 'index',
      width: '8%',
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '수금일자',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: '15%',
      align: 'center' as const,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
      sorter: (a: Payment, b: Payment) => new Date(a.paymentDate || '').getTime() - new Date(b.paymentDate || '').getTime(),
    },
    {
      title: '거래처',
      key: 'customerName',
      width: '20%',
      align: 'center' as const,
      render: (record: Payment) => record.customer?.name || '-',
      sorter: (a: Payment, b: Payment) => (a.customer?.name || '').localeCompare(b.customer?.name || ''),
    },
    {
      title: '수금금액',
      dataIndex: 'amount',
      key: 'amount',
      width: '15%',
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {amount ? amount.toLocaleString() : '0'}원
        </span>
      ),
      sorter: (a: Payment, b: Payment) => (a.amount || 0) - (b.amount || 0),
    },
    {
      title: '메모',
      dataIndex: 'memo',
      key: 'memo',
      width: '25%',
      align: 'center' as const,
      render: (memo: string) => memo || '-',
      sorter: (a: Payment, b: Payment) => (a.memo || '').localeCompare(b.memo || ''),
    },
    {
      title: '작업',
      key: 'action',
      width: '17%',
      align: 'center' as const,
      render: (_: any, record: Payment) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            수정
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="예"
            cancelText="아니오"
            okButtonProps={{ autoFocus: true }}
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: 'No.',
      key: 'index',
      width: '8%',
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '지급일자',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: '15%',
      align: 'center' as const,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
      sorter: (a: Payment, b: Payment) => new Date(a.paymentDate || '').getTime() - new Date(b.paymentDate || '').getTime(),
    },
    {
      title: '거래처',
      key: 'customerName',
      width: '20%',
      align: 'center' as const,
      render: (record: Payment) => record.customer?.name || '-',
      sorter: (a: Payment, b: Payment) => (a.customer?.name || '').localeCompare(b.customer?.name || ''),
    },
    {
      title: '지급금액',
      dataIndex: 'amount',
      key: 'amount',
      width: '15%',
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {amount ? amount.toLocaleString() : '0'}원
        </span>
      ),
      sorter: (a: Payment, b: Payment) => (a.amount || 0) - (b.amount || 0),
    },
    {
      title: '메모',
      dataIndex: 'memo',
      key: 'memo',
      width: '25%',
      align: 'center' as const,
      render: (memo: string) => memo || '-',
      sorter: (a: Payment, b: Payment) => (a.memo || '').localeCompare(b.memo || ''),
    },
    {
      title: '작업',
      key: 'action',
      width: '17%',
      align: 'center' as const,
      render: (_: any, record: Payment) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            수정
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="예"
            cancelText="아니오"
            okButtonProps={{ autoFocus: true }}
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getFilteredReceiptData = () => filteredPayments.filter(p => p.type === 'receipt');
  const getFilteredPaymentData = () => filteredPayments.filter(p => p.type === 'payment');

  const filteredReceiptData = getFilteredReceiptData();
  const filteredPaymentData = getFilteredPaymentData();


  const handleExport = async (type: 'excel' | 'pdf') => {
    // Export functionality can be implemented here
    message.info(`${type.toUpperCase()} 내보내기 기능은 준비 중입니다.`);
  };

  const actionMenuItems = createExportMenuItems(handleExport);

  return (
    <div style={{
      padding: window.innerWidth <= 768 ? '16px 8px' : '24px',
      minHeight: 'calc(100vh - 140px)'
    }}>
      <Row align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h2 style={{ margin: 0, color: isDark ? '#ffffff' : '#000000', fontSize: '24px', fontWeight: 'bold' }}>수금/지급 관리</h2>
        </Col>
        <Col style={{ marginLeft: '100px' }}>
          <Space size="middle" wrap>
            <AutoComplete
              options={autoCompleteOptions}
              value={searchText}
              onChange={handleSearchChange}
              onSelect={(value) => setSearchText(value)}
              style={{ width: window.innerWidth <= 768 ? 250 : 300 }}
            >
              <Input.Search
                placeholder="거래처, 수금/지급금액, 메모 등으로 검색 (2글자 이상)"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={handleSearch}
              />
            </AutoComplete>
            <DatePicker.RangePicker
              style={{ width: 300 }}
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="YYYY-MM-DD"
            />
            <DateRangeFilter
              onDateRangeChange={(startDate, endDate) => {
                setDateRange([dayjs(startDate), dayjs(endDate)]);
              }}
            />
            <Button
              type="primary"
              icon={<MoneyCollectOutlined />}
              onClick={() => handleAdd('receipt')}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              수금
            </Button>
            <Button
              type="primary"
              icon={<PayCircleOutlined />}
              onClick={() => handleAdd('payment')}
              style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
            >
              지급
            </Button>
            <Button
              icon={<ImportOutlined />}
              size={window.innerWidth <= 768 ? "small" : "middle"}
              onClick={() => setExcelUploadModalVisible(true)}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
            >
              {window.innerWidth <= 768 ? '' : '엑셀업로드'}
            </Button>
            <Dropdown menu={{ items: actionMenuItems }} placement="bottomRight">
              <Button
                icon={<ExportOutlined />}
                size={window.innerWidth <= 768 ? "small" : "middle"}
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}
              >
                {window.innerWidth <= 768 ? '' : '파일저장'}
              </Button>
            </Dropdown>
            {window.innerWidth > 768 && (
              <Button
                onClick={handleSelectAll}
                type="default"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
              >
                {selectedRowKeys.length === (activeTab === 'receipt' ? filteredReceiptData.length : filteredPaymentData.length)
                  && (activeTab === 'receipt' ? filteredReceiptData.length : filteredPaymentData.length) > 0
                  ? '전체 해제' : '전체 선택'}
              </Button>
            )}
            <Popconfirm
              title={`선택한 ${selectedRowKeys.length}개 항목을 삭제하시겠습니까?`}
              onConfirm={handleBulkDelete}
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
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              size="middle"
              style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
            >
              인쇄
            </Button>
          </Space>
        </Col>
      </Row>


      {loading && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
          <Spin size="large" />
        </div>
      )}

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setSelectedRowKeys([]);
          }}
          items={[
            {
              key: 'receipt',
              label: `수금 관리 (${filteredReceiptData.length})`,
              children: (
                <Table
                  id="payment-table"
                  columns={receiptColumns}
                  dataSource={filteredReceiptData}
                  rowKey="id"
                  loading={false}
                  rowSelection={getRowSelection()}
                  showSorterTooltip={false}
                  scroll={{ x: 900 }}
                  size={window.innerWidth <= 768 ? "small" : "middle"}
                  onRow={(record) => ({
                    onClick: (e) => handleRowClick(record, e),
                    onDoubleClick: () => handleEdit(record),
                    style: { cursor: 'pointer' }
                  })}
                  pagination={{
                    pageSize: window.innerWidth <= 768 ? 5 : 10,
                    pageSizeOptions: ['5', '10', '20', '50'],
                    showSizeChanger: true,
                    showQuickJumper: window.innerWidth > 768,
                    showTotal: (total, range) => {
                      const searchInfo = searchText ? ` (전체 ${payments.filter(p => p.type === 'receipt').length}건 중 검색결과)` : '';
                      return window.innerWidth <= 768
                        ? `${total}건`
                        : `${range[0]}-${range[1]} / ${total}건${searchInfo}`;
                    },
                  }}
                />
              )
            },
            {
              key: 'payment',
              label: `지급 관리 (${filteredPaymentData.length})`,
              children: (
                <Table
                  id="payment-table"
                  columns={paymentColumns}
                  dataSource={filteredPaymentData}
                  rowKey="id"
                  loading={false}
                  rowSelection={getRowSelection()}
                  showSorterTooltip={false}
                  scroll={{ x: 900 }}
                  size={window.innerWidth <= 768 ? "small" : "middle"}
                  onRow={(record) => ({
                    onClick: (e) => handleRowClick(record, e),
                    onDoubleClick: () => handleEdit(record),
                    style: { cursor: 'pointer' }
                  })}
                  pagination={{
                    pageSize: window.innerWidth <= 768 ? 5 : 10,
                    pageSizeOptions: ['5', '10', '20', '50'],
                    showSizeChanger: true,
                    showQuickJumper: window.innerWidth > 768,
                    showTotal: (total, range) => {
                      const searchInfo = searchText ? ` (전체 ${payments.filter(p => p.type === 'payment').length}건 중 검색결과)` : '';
                      return window.innerWidth <= 768
                        ? `${total}건`
                        : `${range[0]}-${range[1]} / ${total}건${searchInfo}`;
                    },
                  }}
                />
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={editingPayment ?
          '수금/지급 내역 수정' :
          (form.getFieldValue('type') === 'receipt' ? '수금 내역 등록' : '지급 내역 등록')
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingPayment(null);
        }}
        closable={true}
        maskClosable={false}
        keyboard={true}
        destroyOnHidden={true}
        footer={null}
        width={800}
        style={{ top: 50 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item name="type" style={{ display: 'none' }}>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerId"
                label="거래처"
                rules={[{ required: true, message: '거래처를 선택해주세요!' }]}
              >
                <Select
                  placeholder="거래처 선택"
                  showSearch
                  allowClear
                  virtual={true}
                  listHeight={256}
                  filterOption={(input, option: any) => {
                    if (!input) return true;
                    const label = String(option?.label || '');
                    const searchText = String(input || '').toLowerCase().trim();
                    return label.toLowerCase().includes(searchText);
                  }}
                  options={customers.map(customer => ({
                    label: `${customer.name} (${customer.customerCode})`,
                    value: customer.id,
                    key: customer.id
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentDate"
                label={form.getFieldValue('type') === 'receipt' ? '수금일자' : '지급일자'}
                rules={[{ required: true, message: '일자를 선택해주세요!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label={form.getFieldValue('type') === 'receipt' ? '수금금액' : '지급금액'}
                rules={[{ required: true, message: '금액을 입력해주세요!' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: string | undefined) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  min={0}
                  placeholder="0"
                  addonAfter="원"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="memo"
            label="메모"
          >
            <TextArea rows={3} placeholder="메모를 입력하세요" />
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: 0, paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Space size="middle" style={{ justifyContent: 'center' }}>
              <Button size="middle" onClick={() => {
                setModalVisible(false);
                form.resetFields();
                setEditingPayment(null);
              }}>
                취소
              </Button>
              <Button size="middle" type="primary" htmlType="submit">
                저장
              </Button>
              {!editingPayment && (
                <Button
                  size="middle"
                  type="default"
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                  onClick={() => {
                    form.validateFields().then(values => {
                      handleSubmit(values, true);
                    }).catch(info => {
                      console.log('Validate Failed:', info);
                    });
                  }}
                >
                  저장 후 초기화
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Modal>

      {/* 엑셀 업로드 미리보기 모달 */}
      <Modal
        title="엑셀 업로드 미리보기"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setUploadData([]);
        }}
        onOk={handleUploadConfirm}
        width={1200}
        okText="업로드 실행"
        cancelText="취소"
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">
            총 {uploadData.length}건의 데이터가 업로드됩니다. 확인 후 &apos;업로드 실행&apos; 버튼을 클릭하세요.
          </Typography.Text>
        </div>
        <Table
          dataSource={uploadData}
          scroll={{ x: 1000, y: 400 }}
          pagination={{ pageSize: 10 }}
          rowKey="index"
          size="small"
          columns={[
            { title: 'No', dataIndex: 'index', width: 50 },
            { title: '거래일', dataIndex: 'paymentDate', width: 100 },
            { title: '거래처명', dataIndex: 'customerName', width: 150 },
            { title: '구분', dataIndex: 'type', width: 80, render: (type: string) => type === 'receipt' ? '수금' : '지급' },
            {
              title: '금액',
              dataIndex: 'amount',
              width: 120,
              render: (amount: number) => amount ? amount.toLocaleString() + '원' : '0원'
            },
            { title: '결제방법', dataIndex: 'paymentMethod', width: 100 },
            { title: '비고', dataIndex: 'memo', width: 150 },
            {
              title: '상태',
              width: 80,
              render: (record: any) => (
                <span style={{ color: record.customerId ? '#52c41a' : '#ff4d4f' }}>
                  {record.customerId ? '정상' : '거래처 없음'}
                </span>
              )
            }
          ]}
        />
      </Modal>

      {/* 일괄 등록 모달 */}
      <Modal
        title="일괄 수금/지급 등록"
        open={bulkModalVisible}
        onCancel={() => {
          setBulkModalVisible(false);
          bulkForm.resetFields();
        }}
        footer={null}
        width={window.innerWidth <= 768 ? '95%' : 800}
      >
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkCreate}
        >
          <Alert
            message="다중 거래처에 대해 동일한 수금/지급 내역을 일괄로 등록할 수 있습니다."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="유형"
                rules={[{ required: true, message: '유형을 선택해주세요!' }]}
              >
                <Radio.Group>
                  <Radio value="receipt">수금</Radio>
                  <Radio value="payment">지급</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentDate"
                label="일자"
                rules={[{ required: true, message: '일자를 선택해주세요!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="customerIds"
            label="거래처 (여러 개 선택 가능)"
            rules={[{ required: true, message: '거래처를 선택해주세요!' }]}
          >
            <Select
              mode="multiple"
              placeholder="거래처 선택"
              showSearch
              allowClear
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.customerCode})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="금액"
                rules={[{ required: true, message: '금액을 입력해주세요!' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: string | undefined) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  min={0}
                  placeholder="0"
                  addonAfter="원"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="memo"
            label="메모"
          >
            <TextArea rows={3} placeholder="메모를 입력하세요" />
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: 0, paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Space size="middle">
              <Button onClick={() => {
                setBulkModalVisible(false);
                bulkForm.resetFields();
              }}>
                취소
              </Button>
              <Button type="primary" htmlType="submit">
                일괄 등록
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* 엑셀 업로드 모달 */}
      <ExcelUploadModal
        visible={excelUploadModalVisible}
        onCancel={() => setExcelUploadModalVisible(false)}
        onSuccess={handleExcelUpload}
        title={activeTab === 'receipt' ? '수금 엑셀 업로드' : '지급 엑셀 업로드'}
        templateType={activeTab === 'receipt' ? 'receivable' : 'payable'}
        description={activeTab === 'receipt'
          ? '수금 정보를 엑셀 파일로 일괄 업로드할 수 있습니다. 먼저 템플릿을 다운로드하여 양식을 확인하세요.'
          : '지급 정보를 엑셀 파일로 일괄 업로드할 수 있습니다. 먼저 템플릿을 다운로드하여 양식을 확인하세요.'}
        requiredFields={activeTab === 'receipt' ? ['수금일자', '거래처', '수금금액'] : ['지급일자', '거래처', '지급금액']}
      />

      <PaymentPrintModal
        open={printModalVisible}
        onClose={() => setPrintModalVisible(false)}
        payments={activeTab === 'receipt' ? filteredReceiptData : filteredPaymentData}
        title="수금/지급 관리"
      />
    </div>
  );
};

export default PaymentManagement;