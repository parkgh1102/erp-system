import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, Input, Space, message, Popconfirm, Card, Row, Col, InputNumber, Tabs, Spin, AutoComplete, Typography, Dropdown, Radio, Alert, Drawer } from 'antd';
import { EditOutlined, DeleteOutlined, MoneyCollectOutlined, PayCircleOutlined, SearchOutlined, ExportOutlined, ImportOutlined, PrinterOutlined, MoreOutlined } from '@ant-design/icons';
import { createExportMenuItems, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { paymentAPI, customerAPI } from '../../utils/api';
import ExcelUploadModal from '../Common/ExcelUploadModal';
import DateRangeFilter from '../Common/DateRangeFilter';
import PaymentPrintModal from '../Print/PaymentPrintModal';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

import { useMediaQuery } from '../../hooks/useMediaQuery';

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
  const { isMobile } = useMediaQuery();
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
    dayjs().subtract(2, 'month').startOf('month'),
    dayjs().endOf('month')
  ]);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkForm] = Form.useForm();
  const [mobileActionDrawerVisible, setMobileActionDrawerVisible] = useState(false);
  const [pageSize, setPageSize] = useState(10);
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
      // F7: 저장
      if (event.key === 'F7') {
        event.preventDefault();
        form.validateFields().then(values => {
          handleSubmit(values, false);
        }).catch(info => {
                  });
      }
      // F8: 저장 후 초기화
      if (event.key === 'F8') {
        event.preventDefault();
        if (!editingPayment) {
          form.validateFields().then(values => {
            handleSubmit(values, true);
          }).catch(info => {
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
        (typeof target.className === 'string' && target.className.includes('ant-checkbox')) ||
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
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          // 거래처 찾기 (템플릿에서 '거래처' 사용)
          const customer = customers.find(c => c.name === row['거래처']);
          if (!customer) {
            const errorMsg = `${i + 1}행: 거래처 '${row['거래처']}'를 찾을 수 없습니다.`;
            console.error(errorMsg);
            errors.push(errorMsg);
            failCount++;
            continue;
          }

          // activeTab에 따라 유형 결정
          const type = activeTab === 'receipt' ? 'receipt' : 'payment';

          // activeTab에 따라 필드명 다르게 읽기
          const paymentDate = activeTab === 'receipt'
            ? (row['수금일자'] || dayjs().format('YYYY-MM-DD'))
            : (row['지급일자'] || dayjs().format('YYYY-MM-DD'));

          const amount = activeTab === 'receipt'
            ? (Number(row['수금금액']) || 0)
            : (Number(row['지급금액']) || 0);

          const memo = row['메모'] || '';

          await paymentAPI.create(currentBusiness.id, {
            paymentDate: paymentDate,
            customerId: customer.id,
            type: type,
            amount: amount,
            memo: memo,
            businessId: currentBusiness.id
          });
          successCount++;
        } catch (error: any) {
          const errorMsg = `${i + 1}행: ${error.response?.data?.message || error.message || '업로드 실패'}`;
          errors.push(errorMsg);
          failCount++;
          console.error('Payment upload error:', error);
        }
      }

      fetchData();

      if (failCount > 0) {
        const errorSummary = errors.slice(0, 3).join('\n');
        const moreErrors = errors.length > 3 ? `\n... 외 ${errors.length - 3}건` : '';
        message.warning(`${successCount}건 성공, ${failCount}건 실패\n\n${errorSummary}${moreErrors}`, 5);
      } else {
        message.success(`${successCount}건 업로드 완료`, 2);
      }
    } catch (error) {
      message.error('엑셀 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 엑셀 업로드 관련 함수들
  const handleFileUpload = async (file: File) => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      message.error('엑셀 시트를 찾을 수 없습니다.');
      return false;
    }

    const parsedData: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 스킵

      const dateValue = row.getCell(1).value;
      const customerName = String(row.getCell(2).value || '').trim();
      const typeValue = String(row.getCell(3).value || '').trim();
      const amount = Number(String(row.getCell(4).value || '0').replace(/[^0-9.-]/g, '')) || 0;
      const memo = String(row.getCell(5).value || '').trim();

      if (!customerName || !amount) return;

      // 거래처 매칭
      const matchedCustomer = customers.find(c =>
        c.name === customerName || c.name.includes(customerName) || customerName.includes(c.name)
      );

      // 날짜 처리
      let paymentDate = '';
      if (dateValue instanceof Date) {
        paymentDate = dayjs(dateValue).format('YYYY-MM-DD');
      } else if (typeof dateValue === 'string') {
        paymentDate = dayjs(dateValue).format('YYYY-MM-DD');
      } else if (typeof dateValue === 'number') {
        // Excel 날짜 시리얼 넘버
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + dateValue * 86400000);
        paymentDate = dayjs(jsDate).format('YYYY-MM-DD');
      }

      // 유형 처리
      const type = typeValue.includes('수금') ? 'receipt' : typeValue.includes('지급') ? 'payment' : 'receipt';

      parsedData.push({
        paymentDate,
        customerName,
        customerId: matchedCustomer?.id || null,
        type,
        amount,
        memo,
        matched: !!matchedCustomer
      });
    });

    if (parsedData.length === 0) {
      message.warning('업로드할 데이터가 없습니다.');
      return false;
    }

    setUploadData(parsedData);
    setUploadModalVisible(true);
    message.success(`${parsedData.length}건의 데이터를 불러왔습니다.`);
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

  const downloadTemplate = async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('수금지급 업로드 템플릿');

    // 헤더 설정
    const headers = ['일자', '거래처명', '유형(수금/지급)', '금액', '메모'];
    worksheet.addRow(headers);

    // 헤더 스타일
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // 샘플 데이터
    worksheet.addRow(['2026-01-13', '(주)테스트거래처', '수금', '1000000', '1월분 수금']);
    worksheet.addRow(['2026-01-14', '(주)샘플회사', '지급', '500000', '외주비 지급']);

    // 컬럼 너비
    worksheet.columns = [
      { width: 15 }, { width: 25 }, { width: 15 }, { width: 15 }, { width: 30 }
    ];

    // 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '수금지급_업로드_템플릿.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success('템플릿이 다운로드되었습니다.');
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
      width: isMobile ? 0 : '8%',
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '수금일자',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: isMobile ? 80 : '15%',
      align: 'center' as const,
      render: (date: string) => date ? dayjs(date).format(isMobile ? 'MM-DD' : 'YYYY-MM-DD') : '-',
      sorter: (a: Payment, b: Payment) => new Date(a.paymentDate || '').getTime() - new Date(b.paymentDate || '').getTime(),
    },
    {
      title: '거래처',
      key: 'customerName',
      width: isMobile ? 80 : '20%',
      align: 'center' as const,
      render: (record: Payment) => record.customer?.name || '-',
      sorter: (a: Payment, b: Payment) => (a.customer?.name || '').localeCompare(b.customer?.name || ''),
    },
    {
      title: isMobile ? '금액' : '수금금액',
      dataIndex: 'amount',
      key: 'amount',
      width: isMobile ? 80 : '15%',
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: isMobile ? '11px' : 'inherit' }}>
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
      width: isMobile ? 0 : '8%',
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '지급일자',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: isMobile ? 80 : '15%',
      align: 'center' as const,
      render: (date: string) => date ? dayjs(date).format(isMobile ? 'MM-DD' : 'YYYY-MM-DD') : '-',
      sorter: (a: Payment, b: Payment) => new Date(a.paymentDate || '').getTime() - new Date(b.paymentDate || '').getTime(),
    },
    {
      title: '거래처',
      key: 'customerName',
      width: isMobile ? 80 : '20%',
      align: 'center' as const,
      render: (record: Payment) => record.customer?.name || '-',
      sorter: (a: Payment, b: Payment) => (a.customer?.name || '').localeCompare(b.customer?.name || ''),
    },
    {
      title: isMobile ? '금액' : '지급금액',
      dataIndex: 'amount',
      key: 'amount',
      width: isMobile ? 80 : '15%',
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: isMobile ? '11px' : 'inherit' }}>
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
    const isReceipt = activeTab === 'receipt';
    const data = isReceipt ? filteredReceiptData : filteredPaymentData;
    const title = isReceipt ? '수금 내역' : '지급 내역';
    const filename = isReceipt ? '수금내역' : '지급내역';

    const exportColumns = [
      { key: 'paymentDate', title: isReceipt ? '수금일자' : '지급일자', dataIndex: 'paymentDate', render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-' },
      { key: 'customerName', title: '거래처', dataIndex: 'customer', render: (_: any, record: Payment) => record.customer?.name || '-' },
      { key: 'amount', title: isReceipt ? '수금금액' : '지급금액', dataIndex: 'amount', render: (amount: number) => amount ? `${amount.toLocaleString()}원` : '0원' },
      { key: 'memo', title: '메모', dataIndex: 'memo', render: (memo: string) => memo || '-' },
    ];

    if (type === 'excel') {
      await exportToExcel({ filename, title, columns: exportColumns, data, selectedRowKeys });
    } else {
      await exportToPDF({ filename, title, columns: exportColumns, data, selectedRowKeys });
    }
  };

  const actionMenuItems = createExportMenuItems(handleExport);

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
      <Dropdown menu={{ items: actionMenuItems }} placement="bottomRight" trigger={['click']}>
        <Button icon={<ExportOutlined />} block size="large" style={{ backgroundColor: '#1B61A8', borderColor: '#1B61A8', color: 'white', justifyContent: 'flex-start' }}>
          파일저장
        </Button>
      </Dropdown>
      <Button
        onClick={() => { handleSelectAll(); setMobileActionDrawerVisible(false); }}
        block
        size="large"
        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white', justifyContent: 'flex-start' }}
      >
        {selectedRowKeys.length === (activeTab === 'receipt' ? filteredReceiptData.length : filteredPaymentData.length) && (activeTab === 'receipt' ? filteredReceiptData.length : filteredPaymentData.length) > 0 ? '전체 해제' : '전체 선택'}
      </Button>
      <Popconfirm
        title={`선택한 ${selectedRowKeys.length}개 항목을 삭제하시겠습니까?`}
        onConfirm={() => { handleBulkDelete(); setMobileActionDrawerVisible(false); }}
        okText="예"
        cancelText="아니오"
        disabled={selectedRowKeys.length === 0}
      >
        <Button danger block size="large" disabled={selectedRowKeys.length === 0} style={{ justifyContent: 'flex-start' }}>
          선택 삭제 ({selectedRowKeys.length})
        </Button>
      </Popconfirm>
      <Button
        icon={<PrinterOutlined />}
        onClick={() => { handlePrint(); setMobileActionDrawerVisible(false); }}
        block
        size="large"
        style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white', justifyContent: 'flex-start' }}
      >
        인쇄
      </Button>
    </Space>
  );

  return (
    <div style={{
      padding: isMobile ? '16px 8px' : '24px',
      minHeight: 'calc(100vh - 140px)'
    }}>
      {/* 모바일 레이아웃 */}
      {isMobile ? (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 12px 0', color: isDark ? '#ffffff' : '#000000', fontSize: '20px', fontWeight: 'bold' }}>수금/지급 관리</h2>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <AutoComplete
              options={autoCompleteOptions}
              value={searchText}
              onChange={handleSearchChange}
              onSelect={(value) => setSearchText(value)}
              style={{ width: '100%' }}
            >
              <Input.Search
                placeholder="거래처, 금액 검색"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={handleSearch}
              />
            </AutoComplete>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="YYYY-MM-DD"
              size="middle"
            />
            <Space size="small" wrap>
              <Button
                type="primary"
                icon={<MoneyCollectOutlined />}
                onClick={() => handleAdd('receipt')}
                size="middle"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                수금
              </Button>
              <Button
                type="primary"
                icon={<PayCircleOutlined />}
                onClick={() => handleAdd('payment')}
                size="middle"
                style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
              >
                지급
              </Button>
              <Button icon={<MoreOutlined />} onClick={() => setMobileActionDrawerVisible(true)} size="middle">
                더보기
              </Button>
            </Space>
            <DateRangeFilter
              onDateRangeChange={(startDate, endDate) => setDateRange([dayjs(startDate), dayjs(endDate)])}
              isMobile={true}
            />
          </Space>
        </div>
      ) : (
        /* 데스크톱 레이아웃 */
        <Row align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <h2 style={{ margin: 0, color: isDark ? '#ffffff' : '#000000', fontSize: '24px', fontWeight: 'bold' }}>수금/지급 관리</h2>
          </Col>
          <Col style={{ marginLeft: '100px' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space size="middle" wrap>
                <AutoComplete
                  options={autoCompleteOptions}
                  value={searchText}
                  onChange={handleSearchChange}
                  onSelect={(value) => setSearchText(value)}
                  style={{ width: 300 }}
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
                  size="middle"
                  onClick={() => setExcelUploadModalVisible(true)}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                >
                  엑셀업로드
                </Button>
                <Dropdown menu={{ items: actionMenuItems }} placement="bottomRight">
                  <Button icon={<ExportOutlined />} size="middle" style={{ backgroundColor: '#1B61A8', borderColor: '#1B61A8', color: 'white' }}>
                    파일저장
                  </Button>
                </Dropdown>
                <Button
                  onClick={handleSelectAll}
                  type="default"
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                >
                  {selectedRowKeys.length === (activeTab === 'receipt' ? filteredReceiptData.length : filteredPaymentData.length) && (activeTab === 'receipt' ? filteredReceiptData.length : filteredPaymentData.length) > 0 ? '전체 해제' : '전체 선택'}
                </Button>
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
              <DateRangeFilter
                onDateRangeChange={(startDate, endDate) => setDateRange([dayjs(startDate), dayjs(endDate)])}
              />
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
                  className={isMobile ? 'mobile-compact-table' : ''}
                  columns={isMobile ? receiptColumns.filter(col => ['paymentDate', 'customerName', 'amount'].includes(col.key as string)) : receiptColumns}
                  dataSource={filteredReceiptData}
                  rowKey="id"
                  loading={false}
                  rowSelection={getRowSelection()}
                  showSorterTooltip={false}
                  scroll={{ x: isMobile ? 260 : 900 }}
                  size={isMobile ? "small" : "middle"}
                  onRow={(record) => ({
                    onClick: (e) => handleRowClick(record, e),
                    onDoubleClick: () => handleEdit(record),
                    style: { cursor: 'pointer' }
                  })}
                  pagination={{
                    pageSize: pageSize,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showSizeChanger: true,
                    showQuickJumper: !isMobile,
                    onChange: (page, size) => {
                      if (size !== pageSize) setPageSize(size);
                    },
                    showTotal: (total, range) => {
                      const searchInfo = searchText ? ` (전체 ${payments.filter(p => p.type === 'receipt').length}건 중 검색결과)` : '';
                      return isMobile
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
                  className={isMobile ? 'mobile-compact-table' : ''}
                  columns={isMobile ? paymentColumns.filter(col => ['paymentDate', 'customerName', 'amount'].includes(col.key as string)) : paymentColumns}
                  dataSource={filteredPaymentData}
                  rowKey="id"
                  loading={false}
                  rowSelection={getRowSelection()}
                  showSorterTooltip={false}
                  scroll={{ x: isMobile ? 260 : 900 }}
                  size={isMobile ? "small" : "middle"}
                  onRow={(record) => ({
                    onClick: (e) => handleRowClick(record, e),
                    onDoubleClick: () => handleEdit(record),
                    style: { cursor: 'pointer' }
                  })}
                  pagination={{
                    pageSize: pageSize,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showSizeChanger: true,
                    showQuickJumper: !isMobile,
                    onChange: (page, size) => {
                      if (size !== pageSize) setPageSize(size);
                    },
                    showTotal: (total, range) => {
                      const searchInfo = searchText ? ` (전체 ${payments.filter(p => p.type === 'payment').length}건 중 검색결과)` : '';
                      return isMobile
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
            <Col xs={24} sm={12}>
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
                  popupMatchSelectWidth={false}
                  popupClassName={isMobile ? "mobile-full-dropdown" : undefined}
                  styles={{ popup: { root: { minWidth: isMobile ? '94vw' : 300, maxWidth: isMobile ? '94vw' : 'none' } } }}
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
            <Col xs={24} sm={12}>
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
            <Col xs={24} sm={12}>
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
                  inputMode="numeric"
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
        width={isMobile ? '95%' : 800}
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
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
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
                  inputMode="numeric"
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
        payments={(activeTab === 'receipt' ? filteredReceiptData : filteredPaymentData) as any}
        title="수금/지급 관리"
      />
    </div>
  );
};

export default PaymentManagement;