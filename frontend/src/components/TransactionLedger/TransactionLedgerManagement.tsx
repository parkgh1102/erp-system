import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Row, Col, Select, DatePicker, Button, Table, Space, message, Modal, Form, Input, Spin, AutoComplete, Dropdown, Statistic, Alert, Badge, Tabs, Tag, Progress, Divider, List, Avatar, Tooltip } from 'antd';
import { SearchOutlined, PrinterOutlined, FilePdfOutlined, ExportOutlined, DollarOutlined, UserOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import SignatureEditModal from './SignatureEditModal';
import DateRangeFilter from '../Common/DateRangeFilter';
import { createExportMenuItems } from '../../utils/exportUtils';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { customerAPI, transactionLedgerAPI } from '../../utils/api';
import { formatBusinessNumber } from '../../utils/formatters';
import { TransactionLedger } from '../Print/TransactionLedger';
import PrintModal from '../Print/PrintModal';
import TransactionLedgerPrintModal from '../Print/TransactionLedgerPrintModal';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface LedgerItemInfo {
  itemCode: string;
  itemName: string;
  spec?: string;
  quantity: number;
  unitPrice: number;
  amount: number;  // 공급가액
  taxAmount?: number;  // 세액
  totalAmount?: number;  // 합계
}

interface LedgerEntry {
  id: number;
  date: string;
  type: 'sales' | 'purchase' | 'receipt' | 'payment';
  description: string;
  customerName: string;
  amount: number;
  supplyAmount: number;  // 공급가액
  vatAmount: number;     // 세액
  totalAmount: number;   // 합계
  balance: number;
  memo?: string;
  itemInfo?: LedgerItemInfo;
  itemCount?: number;  // 품목 개수
  items?: LedgerItemInfo[];  // 전체 품목 배열
}

// 품목별 펼친 엔트리 (테이블 표시용)
interface ExpandedLedgerEntry extends LedgerEntry {
  rowKey: string;
  isFirstRow: boolean;
  itemIndex: number;
  currentItemInfo?: LedgerItemInfo;
}

interface Customer {
  id: number;
  name: string;
  customerCode: string;
  businessNumber?: string;
  representative?: string;
  address?: string;
  phone?: string;
  email?: string;
}

const TransactionLedgerManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersWithTransactions, setCustomersWithTransactions] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [signatureData, setSignatureData] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>({});
  const [customerBalances, setCustomerBalances] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ledger');
  const [analysisData, setAnalysisData] = useState<any>({});
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [generalPrintModalVisible, setGeneralPrintModalVisible] = useState(false);
  const [ledgerPrintModalVisible, setLedgerPrintModalVisible] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const { currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();

  // 품목별로 펼친 엔트리 생성
  const expandedEntries = useMemo((): ExpandedLedgerEntry[] => {
    const result: ExpandedLedgerEntry[] = [];

    ledgerEntries.forEach((entry) => {
      // 수금/지급은 품목 없이 그대로 표시
      if (entry.type === 'receipt' || entry.type === 'payment') {
        result.push({
          ...entry,
          rowKey: `${entry.id}-0`,
          isFirstRow: true,
          itemIndex: 0,
          currentItemInfo: undefined
        });
        return;
      }

      // 매출/매입: 품목별로 펼치기
      const items = entry.items || [];
      if (items.length === 0) {
        // 품목이 없으면 그대로 표시
        result.push({
          ...entry,
          rowKey: `${entry.id}-0`,
          isFirstRow: true,
          itemIndex: 0,
          currentItemInfo: entry.itemInfo
        });
      } else {
        // 품목별로 각각 행 생성
        items.forEach((item, index) => {
          result.push({
            ...entry,
            rowKey: `${entry.id}-${index}`,
            isFirstRow: index === 0,
            itemIndex: index,
            currentItemInfo: item
          });
        });
      }
    });

    return result;
  }, [ledgerEntries]);

  useEffect(() => {
    if (currentBusiness) {
      fetchCustomers();
      fetchCustomersWithTransactions();
    }
  }, [currentBusiness]);

  // 기간이 변경되면 거래 있는 거래처 목록 다시 조회
  useEffect(() => {
    if (currentBusiness && dateRange) {
      fetchCustomersWithTransactions();
    }
  }, [dateRange, currentBusiness]);

  // 거래처 검색 (2글자 이상) - 기간 내 거래가 있는 거래처만 표시
  useEffect(() => {
    if (customerSearchText.length >= 2) {
      // 기간 내 거래가 있는 거래처만 필터링
      const searchSource = customersWithTransactions.length > 0 ? customersWithTransactions : customers;
      const filtered = searchSource.filter(customer =>
        customer.name.toLowerCase().includes(customerSearchText.toLowerCase()) ||
        customer.customerCode.toLowerCase().includes(customerSearchText.toLowerCase())
      );
      console.log('🔍 검색어:', customerSearchText, '/ 기간 내 거래 업체 중 결과:', filtered.length, '개');
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers([]);
    }
  }, [customerSearchText, customersWithTransactions, customers]);

  // 키보드 단축키를 위한 래퍼 함수들
  const handleAddWrapper = () => {
    // 거래원장에서는 조회 기능을 Add 단축키로 사용
    handleSearch();
  };

  const handleSelectAllWrapper = () => {
    // 거래원장에서는 전체 선택 기능이 없으므로 메시지 표시
    message.info('거래원장에서는 전체 선택 기능을 지원하지 않습니다.');
  };

  const handleBulkDeleteWrapper = () => {
    // 거래원장에서는 삭제 기능이 없으므로 메시지 표시
    message.info('거래원장에서는 삭제 기능을 지원하지 않습니다.');
  };

  // 키보드 단축키 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            handleAddWrapper();
            break;
          case '2':
            event.preventDefault();
            handleSelectAllWrapper();
            break;
          case '3':
            event.preventDefault();
            handleBulkDeleteWrapper();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleAddWrapper, handleSelectAllWrapper, handleBulkDeleteWrapper]);

  const fetchCustomers = async () => {
    if (!currentBusiness) return;

    try {
      // 모든 거래처를 가져오기 위해 limit을 크게 설정
      const response = await customerAPI.getAll(currentBusiness.id, { page: 1, limit: 10000 });
      const customerList = response.data.data.customers || [];
      console.log('📋 거래처 목록 로드:', customerList.length, '개');
      setCustomers(customerList);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setCustomers([]);
      } else {
        message.error('거래처 목록을 불러오는데 실패했습니다.');
        console.error('Customer fetch error:', error);
      }
    }
  };

  // 기간 내 거래가 있는 거래처 목록 조회
  const fetchCustomersWithTransactions = async () => {
    if (!currentBusiness || !dateRange) return;

    try {
      const [startDate, endDate] = dateRange;
      const response = await transactionLedgerAPI.getCustomersWithTransactions(currentBusiness.id, {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      });
      const customerList = response.data.data?.customers || [];
      console.log('📋 기간 내 거래 업체 로드:', customerList.length, '개', `(${startDate.format('YYYY-MM-DD')} ~ ${endDate.format('YYYY-MM-DD')})`);
      setCustomersWithTransactions(customerList);
    } catch (error: any) {
      console.error('기간 내 거래 업체 조회 오류:', error);
      // 오류 시 전체 거래처로 fallback
      setCustomersWithTransactions([]);
    }
  };

  const fetchLedgerData = async () => {
    if (!currentBusiness || !selectedCustomer || !dateRange) return;

    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      const params = {
        customerId: selectedCustomer,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      };

      console.log('🔍 거래원장 조회 요청:', {
        businessId: currentBusiness.id,
        params
      });

      // 거래원장 데이터 조회
      const response = await transactionLedgerAPI.getLedger(currentBusiness.id, params);
      console.log('📊 거래원장 응답:', response.data);

      if (response.data.success && response.data.data.entries) {
        setLedgerEntries(response.data.data.entries);
        setLedgerData(response.data.data);
      } else {
        // 임시로 mock 데이터 생성 (백엔드 데이터가 없을 때)
        const mockEntries: LedgerEntry[] = [
          {
            id: 1,
            date: dayjs().format('YYYY-MM-DD'),
            type: 'sales',
            description: '매출',
            customerName: customers.find(c => c.id === selectedCustomer)?.name || '',
            amount: 1000000,
            balance: 1000000,
            memo: '거래완료'
          },
          {
            id: 2,
            date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
            type: 'receipt',
            description: '수금',
            customerName: customers.find(c => c.id === selectedCustomer)?.name || '',
            amount: 500000,
            balance: 500000,
            memo: '부분수금'
          }
        ];
        setLedgerEntries(mockEntries);

        // Mock 데이터에 대한 ledgerData 생성
        const customer = customers.find(c => c.id === selectedCustomer);
        const mockLedgerData = {
          companyName: customer?.name || '',
          companyAddress: customer?.address,
          fromCompany: {
            name: '가온에프에스유한회사',
            businessNumber: '818-87-01513',
            representative: '이수연',
            address: '경기도 남양주시 오남읍 양지로125번길 6, 에이동',
            phone: '',
            fax: '',
            email: 'business@gaonfscorp.com'
          },
          toCompany: {
            name: customer?.name || '',
            businessNumber: customer?.businessNumber || '',
            representative: customer?.representative || '',
            address: customer?.address || '',
            phone: customer?.phone || '',
            email: customer?.email || ''
          },
          period: {
            start: startDate.format('YYYY-MM-DD'),
            end: endDate.format('YYYY-MM-DD')
          },
          previousBalance: 0,
          entries: mockEntries,
          totalPurchase: 0,
          totalPayment: 0,
          totalSales: 1500000,
          totalReceipt: 500000,
          finalBalance: 1000000,
          transactionCount: mockEntries.length,
          totalQuantity: 0
        };
        setLedgerData(mockLedgerData);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setLedgerEntries([]);
      } else {
        message.error('거래원장 데이터를 불러오는데 실패했습니다.');
      }
      console.error('Ledger fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!selectedCustomer) {
      message.warning('거래처를 선택해주세요.');
      return;
    }
    fetchLedgerData();
  };

  const selectedCustomerInfo = customers.find(c => c.id === selectedCustomer);

  const reactToPrintFn = useReactToPrint({
    contentRef: printRef,
    documentTitle: '거래원장',
    onAfterPrint: () => setPrintModalVisible(false),
  });

  const handlePrint = () => {
    setPrintModalVisible(true);
  };

  const handleGeneralPrint = () => {
    setGeneralPrintModalVisible(true);
  };

  const handleSignatureEdit = () => {
    setSignatureModalVisible(true);
  };

  const handleSignatureSave = (data: any) => {
    setSignatureData(data);
    setSignatureModalVisible(false);
    message.success('전자서명이 저장되었습니다.');
  };

  const handleExportExcel = () => {
    message.info('엑셀 내보내기 기능을 준비중입니다.');
  };

  const handleExportPdf = () => {
    message.info('PDF 내보내기 기능을 준비중입니다.');
  };

  const columns = [
    {
      title: '일자',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      align: 'center' as const,
      render: (text: string, record: ExpandedLedgerEntry) => {
        if (!record.isFirstRow) return null;
        return dayjs(text).format('YYYY-MM-DD');
      },
    },
    {
      title: '거래처',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
      align: 'center' as const,
      render: (text: string, record: ExpandedLedgerEntry) => {
        if (!record.isFirstRow) return null;
        return text;
      },
    },
    {
      title: '구분',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      align: 'center' as const,
      render: (type: string, record: ExpandedLedgerEntry) => {
        if (!record.isFirstRow) return null;
        const typeMap = {
          'sales': '매출',
          'purchase': '매입',
          'receipt': '수금',
          'payment': '지급'
        };
        const colorMap = {
          'sales': 'blue',
          'purchase': 'red',
          'receipt': 'green',
          'payment': 'orange'
        };
        return <span style={{ color: colorMap[type as keyof typeof colorMap] }}>{typeMap[type as keyof typeof typeMap]}</span>;
      },
    },
    {
      title: '품목명',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      align: 'center' as const,
      render: (description: string, record: ExpandedLedgerEntry) => {
        // 수금, 지급은 기존 description 표시
        if (record.type === 'receipt' || record.type === 'payment') {
          return description;
        }

        // 품목별 개별 행 표시
        if (record.currentItemInfo) {
          return record.currentItemInfo.itemName;
        }

        return description;
      },
    },
    {
      title: '공급가액',
      dataIndex: 'supplyAmount',
      key: 'supplyAmount',
      width: 120,
      align: 'right' as const,
      render: (supplyAmount: number, record: ExpandedLedgerEntry) => {
        // 품목별 공급가액 표시
        const displayAmount = record.currentItemInfo?.amount ?? supplyAmount;
        const colorMap = {
          'sales': isDark ? '#40a9ff' : '#1890ff',
          'purchase': isDark ? '#d9d9d9' : '#000000',
          'receipt': isDark ? '#ff7875' : '#ff4d4f',
          'payment': isDark ? '#d9d9d9' : '#000000'
        };
        return (
          <span style={{ color: colorMap[record.type] }}>
            {Math.round(displayAmount || 0).toLocaleString()}원
          </span>
        );
      },
    },
    {
      title: '세액',
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: 100,
      align: 'right' as const,
      render: (vatAmount: number, record: ExpandedLedgerEntry) => {
        // 품목별 세액 표시
        const displayTax = record.currentItemInfo?.taxAmount ?? vatAmount;
        return (
          <span>
            {Math.round(displayTax || 0).toLocaleString()}원
          </span>
        );
      },
    },
    {
      title: '합계',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right' as const,
      render: (totalAmount: number, record: ExpandedLedgerEntry) => {
        // 품목별 합계 표시
        const displayTotal = record.currentItemInfo?.totalAmount ?? totalAmount;
        return (
          <span style={{ fontWeight: 'bold' }}>
            {Math.round(displayTotal || 0).toLocaleString()}원
          </span>
        );
      },
    },
    {
      title: '잔액',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      align: 'right' as const,
      render: (balance: number, record: ExpandedLedgerEntry) => {
        if (!record.isFirstRow) return null;
        const color = balance >= 0
          ? (isDark ? '#40a9ff' : '#1890ff')  // 양수: 파랑
          : (isDark ? '#ff7875' : '#ff4d4f'); // 음수: 빨강
        return (
          <span style={{ fontWeight: 'bold', color }}>
            {Math.round(balance || 0).toLocaleString()}원
          </span>
        );
      },
    },
    {
      title: '비고',
      dataIndex: 'memo',
      key: 'memo',
      align: 'center' as const,
      render: (memo: string, record: ExpandedLedgerEntry) => {
        if (!record.isFirstRow) return null;
        return memo || '-';
      },
    },
  ];

  const actionMenuItems = createExportMenuItems(
    ledgerEntries,
    columns,
    '거래원장_목록',
    'transaction-ledger-table'
  );

  return (
    <div style={{
      padding: window.innerWidth <= 768 ? '16px 8px' : '24px',
      minHeight: 'calc(100vh - 140px)'
    }}>
      <Row align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h2 style={{ margin: 0, color: isDark ? '#ffffff' : '#000000', fontSize: '24px', fontWeight: 'bold' }}>거래원장 조회</h2>
        </Col>
        <Col style={{ marginLeft: '100px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space size="middle" wrap>
              <AutoComplete
                style={{ width: 300 }}
                value={customerSearchText}
                onChange={(value) => setCustomerSearchText(value)}
                onSelect={(value, option: any) => {
                  setSelectedCustomer(option.key);
                  setCustomerSearchText(option.label);
                }}
                placeholder="거래처명 입력 (기간 내 거래 업체)"
                size="middle"
                options={filteredCustomers.map(customer => ({
                  key: customer.id,
                  value: customer.name,
                  label: `${customer.name} (${customer.customerCode})`
                }))}
                notFoundContent={
                  customerSearchText.length < 2
                    ? '2글자 이상 입력해주세요'
                    : filteredCustomers.length === 0
                      ? customersWithTransactions.length === 0
                        ? '선택한 기간에 거래 기록이 없습니다'
                        : '검색 결과가 없습니다'
                      : null
                }
              />
              <RangePicker
                style={{ width: 300 }}
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                format="YYYY-MM-DD"
                size="middle"
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                size="middle"
              >
                조회
              </Button>
              <Dropdown menu={{ items: actionMenuItems }} placement="bottomRight">
                <Button
                  icon={<ExportOutlined />}
                  size="middle"
                  style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}
                >
                  파일저장
                </Button>
              </Dropdown>
              <Button
                icon={<PrinterOutlined />}
                onClick={() => setLedgerPrintModalVisible(true)}
                size="middle"
                style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
              >
                인쇄
              </Button>
            </Space>
            <DateRangeFilter
              onDateRangeChange={(startDate, endDate) => {
                setDateRange([dayjs(startDate), dayjs(endDate)]);
              }}
            />
          </Space>
        </Col>
      </Row>

      {selectedCustomerInfo && (
        <Card size="small" style={{ marginBottom: '16px', backgroundColor: isDark ? '#1f1f1f' : '#f8f9fa' }}>
          <Row gutter={16}>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <strong>거래처명:</strong> {selectedCustomerInfo.name}
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <strong>거래처코드:</strong> {selectedCustomerInfo.customerCode}
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <strong>사업자번호:</strong> {selectedCustomerInfo.businessNumber ? formatBusinessNumber(selectedCustomerInfo.businessNumber) : '미등록'}
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <strong>대표자:</strong> {selectedCustomerInfo.representative || '미등록'}
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '8px' }}>
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
              <strong>주소:</strong> {selectedCustomerInfo.address || '미등록'}
            </Col>
            <Col xs={12} sm={6} md={6} lg={6} xl={6}>
              <strong>전화번호:</strong> {selectedCustomerInfo.phone || '미등록'}
            </Col>
            <Col xs={12} sm={6} md={6} lg={6} xl={6}>
              <strong>이메일:</strong> {selectedCustomerInfo.email || '미등록'}
            </Col>
          </Row>
        </Card>
      )}

      <Card>
        <Spin spinning={loading}>
          <Table
            id="transaction-ledger-table"
            columns={columns}
            dataSource={expandedEntries}
            rowKey="rowKey"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: expandedEntries.length,
              showSizeChanger: true,
              showTotal: () => `총 ${ledgerEntries.length}건`,
              onChange: (page, size) => {
                setCurrentPage(page);
                if (size !== pageSize) {
                  setPageSize(size);
                  setCurrentPage(1);
                }
              },
            }}
            summary={(pageData) => {
              if (pageData.length === 0) return null;

              // 첫 행만 필터하여 합계 계산 (중복 방지)
              const firstRows = pageData.filter((e: ExpandedLedgerEntry) => e.isFirstRow);

              const totalSalesSupply = firstRows.filter(e => e.type === 'sales').reduce((sum, e) => sum + (e.supplyAmount || 0), 0);
              const totalSalesVat = firstRows.filter(e => e.type === 'sales').reduce((sum, e) => sum + (e.vatAmount || 0), 0);
              const totalSales = firstRows.filter(e => e.type === 'sales').reduce((sum, e) => sum + (e.totalAmount || 0), 0);

              const totalPurchaseSupply = firstRows.filter(e => e.type === 'purchase').reduce((sum, e) => sum + (e.supplyAmount || 0), 0);
              const totalPurchaseVat = firstRows.filter(e => e.type === 'purchase').reduce((sum, e) => sum + (e.vatAmount || 0), 0);
              const totalPurchase = firstRows.filter(e => e.type === 'purchase').reduce((sum, e) => sum + (e.totalAmount || 0), 0);

              const totalReceipt = firstRows.filter(e => e.type === 'receipt').reduce((sum, e) => sum + (e.totalAmount || e.amount || 0), 0);
              const totalPayment = firstRows.filter(e => e.type === 'payment').reduce((sum, e) => sum + (e.totalAmount || e.amount || 0), 0);

              // 합계 잔액은 전체 거래의 마지막 잔액을 표시
              const finalBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;

              return (
                <>
                  <Table.Summary.Row style={{ backgroundColor: isDark ? '#1f1f1f' : '#fafafa', fontWeight: 'bold' }}>
                    <Table.Summary.Cell index={0} colSpan={3} align="center">합계</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">-</Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">-</Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">-</Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">-</Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">
                      <span style={{ color: finalBalance >= 0 ? (isDark ? '#40a9ff' : '#1890ff') : (isDark ? '#ff7875' : '#ff4d4f') }}>
                        {Math.round(finalBalance || 0).toLocaleString()}원
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8}>-</Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row style={{ backgroundColor: isDark ? '#141414' : '#f0f0f0' }}>
                    <Table.Summary.Cell index={0} colSpan={3} align="center">매출 합계</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">-</Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <span style={{ color: isDark ? '#40a9ff' : '#1890ff' }}>{Math.round(totalSalesSupply).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">
                      <span style={{ color: isDark ? '#40a9ff' : '#1890ff' }}>{Math.round(totalSalesVat).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <span style={{ color: isDark ? '#40a9ff' : '#1890ff', fontWeight: 'bold' }}>{Math.round(totalSales).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} colSpan={1} align="center">수금 합계</Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">
                      <span style={{ color: isDark ? '#ff7875' : '#ff4d4f' }}>{Math.round(totalReceipt).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row style={{ backgroundColor: isDark ? '#141414' : '#f0f0f0' }}>
                    <Table.Summary.Cell index={0} colSpan={3} align="center">매입 합계</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">-</Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <span style={{ color: isDark ? '#d9d9d9' : '#000000' }}>{Math.round(totalPurchaseSupply).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">
                      <span style={{ color: isDark ? '#d9d9d9' : '#000000' }}>{Math.round(totalPurchaseVat).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <span style={{ color: isDark ? '#d9d9d9' : '#000000', fontWeight: 'bold' }}>{Math.round(totalPurchase).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} colSpan={1} align="center">지급 합계</Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">
                      <span style={{ color: isDark ? '#d9d9d9' : '#000000' }}>{Math.round(totalPayment).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              );
            }}
            locale={{
              emptyText: selectedCustomer ? '조회 버튼을 클릭하여 거래원장을 조회하세요.' : '거래처를 선택하고 조회하세요.'
            }}
          />
        </Spin>
      </Card>




      <SignatureEditModal
        open={signatureModalVisible}
        onCancel={() => setSignatureModalVisible(false)}
        onSave={handleSignatureSave}
        initialData={signatureData}
      />

      {/* 거래원장 인쇄 모달 */}
      <Modal
        title="거래원장 인쇄"
        open={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        width={window.innerWidth <= 768 ? '95%' : '90%'}
        style={{ maxWidth: window.innerWidth <= 768 ? 'none' : '1200px' }}
        footer={[
          <Button key="cancel" onClick={() => setPrintModalVisible(false)}>
            취소
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={reactToPrintFn}>
            인쇄
          </Button>
        ]}
      >
        <div ref={printRef}>
          {ledgerData && (
            <TransactionLedger
              data={ledgerData}
              type="sales"
            />
          )}
        </div>
      </Modal>

      {/* 일반 인쇄 모달 (기존 거래명세서) */}
      {ledgerData && (
        <PrintModal
          open={generalPrintModalVisible}
          onClose={() => setGeneralPrintModalVisible(false)}
          transactionData={{
            id: selectedCustomer || 0,
            date: dateRange[0].format('YYYY-MM-DD'),
            companyName: selectedCustomerInfo?.name || '',
            companyAddress: selectedCustomerInfo?.address,
            companyPhone: selectedCustomerInfo?.phone,
            companyRegistrationNumber: selectedCustomerInfo?.businessNumber,
            ceoName: selectedCustomerInfo?.representative,
            items: ledgerEntries.map(entry => ({
              itemName: entry.description,
              quantity: 1,
              unitPrice: entry.amount,
              amount: entry.amount
            })),
            totalAmount: ledgerEntries.reduce((sum, entry) => sum + entry.amount, 0),
            tax: 0,
            grandTotal: ledgerEntries.reduce((sum, entry) => sum + entry.amount, 0),
            balanceAmount: ledgerEntries[ledgerEntries.length - 1]?.balance || 0
          }}
          type="sales"
        />
      )}

      {/* 거래원장 전용 인쇄 모달 */}
      <TransactionLedgerPrintModal
        open={ledgerPrintModalVisible}
        onClose={() => setLedgerPrintModalVisible(false)}
        ledgerEntries={ledgerEntries}
        customer={customers.find(c => c.id === selectedCustomer) || null}
        dateRange={dateRange}
        title="거래원장"
        previousBalance={ledgerData?.previousBalance || 0}
      />
    </div>
  );
};

export default TransactionLedgerManagement;