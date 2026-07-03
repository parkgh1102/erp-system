import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Row, Col, Select, DatePicker, Button, Table, Space, message, Modal, Form, Input, Spin, AutoComplete, Dropdown, Statistic, Alert, Badge, Tabs, Tag, Progress, Divider, List, Avatar, Tooltip, Drawer, Empty, Typography } from 'antd';
import { SearchOutlined, PrinterOutlined, FilePdfOutlined, ExportOutlined, DollarOutlined, UserOutlined, ArrowUpOutlined, ArrowDownOutlined, MoreOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import SignatureEditModal from './SignatureEditModal';
import DateRangeFilter from '../Common/DateRangeFilter';
import TrackPagination from '../Common/TrackPagination';
import { exportTransactionLedgerToPDF, exportTransactionLedgerToExcel } from '../../utils/exportUtils';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { customerAPI, transactionLedgerAPI } from '../../utils/api';
import { formatBusinessNumber } from '../../utils/formatters';
import { TransactionLedger } from '../Print/TransactionLedger';
import PrintModal from '../Print/PrintModal';
import TransactionLedgerPrintModal from '../Print/TransactionLedgerPrintModal';
import dayjs from 'dayjs';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Text } = Typography;

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
  cumulativeBalance?: number;  // 품목별 누적 잔액
  isCarryOver?: boolean;  // 이월잔액 행 여부
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
  const { isMobile } = useMediaQuery();
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersWithTransactions, setCustomersWithTransactions] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(2, 'month').startOf('month'),
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
  const [mobileActionDrawerVisible, setMobileActionDrawerVisible] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const { currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();

  // 선택된 거래처 정보 (useMemo보다 먼저 정의) - customers 또는 customersWithTransactions에서 찾기
  const selectedCustomerInfo = customers.find(c => c.id === selectedCustomer) || customersWithTransactions.find(c => c.id === selectedCustomer);

  // 품목별로 펼친 엔트리 생성 (이월잔액 및 품목별 누적 잔액 포함)
  const expandedEntries = useMemo((): ExpandedLedgerEntry[] => {
    const result: ExpandedLedgerEntry[] = [];
    const previousBalance = ledgerData?.previousBalance || 0;

    // 이월잔액 행 추가 (previousBalance가 있고 dateRange가 있을 때)
    if (previousBalance !== 0 && dateRange && dateRange[0] && selectedCustomerInfo) {
      result.push({
        id: -1,
        date: dateRange[0].subtract(1, 'day').format('YYYY-MM-DD'),
        type: 'sales' as const,
        description: '이월',
        customerName: selectedCustomerInfo.name,
        amount: 0,
        supplyAmount: 0,
        vatAmount: 0,
        totalAmount: 0,
        balance: previousBalance,
        memo: '',
        rowKey: 'carry-over',
        isFirstRow: true,
        itemIndex: 0,
        currentItemInfo: { itemCode: '', itemName: '이월잔액', quantity: 0, unitPrice: 0, amount: 0 },
        cumulativeBalance: previousBalance,
        isCarryOver: true
      });
    }

    // 품목별 누적 잔액 계산을 위한 변수
    let runningBalance = previousBalance;

    ledgerEntries.forEach((entry) => {
      // 수금/지급은 품목 없이 그대로 표시
      if (entry.type === 'receipt' || entry.type === 'payment') {
        // 수금은 잔액 감소, 지급은 잔액 증가
        const balanceChange = entry.type === 'receipt'
          ? -(entry.totalAmount || entry.amount || 0)
          : (entry.totalAmount || entry.amount || 0);
        runningBalance += balanceChange;

        result.push({
          ...entry,
          rowKey: `${entry.id}-0`,
          isFirstRow: true,
          itemIndex: 0,
          currentItemInfo: undefined,
          cumulativeBalance: runningBalance
        });
        return;
      }

      // 매출/매입: 품목별로 펼치기
      const items = entry.items || [];
      if (items.length === 0) {
        // 품목이 없으면 그대로 표시
        const balanceChange = entry.type === 'sales'
          ? (entry.totalAmount || 0)
          : -(entry.totalAmount || 0);
        runningBalance += balanceChange;

        result.push({
          ...entry,
          rowKey: `${entry.id}-0`,
          isFirstRow: true,
          itemIndex: 0,
          currentItemInfo: entry.itemInfo,
          cumulativeBalance: runningBalance
        });
      } else {
        // 품목별로 각각 행 생성하며 누적 잔액 계산
        items.forEach((item, index) => {
          const itemTotal = item.totalAmount || item.amount || 0;
          const balanceChange = entry.type === 'sales' ? itemTotal : -itemTotal;
          runningBalance += balanceChange;

          result.push({
            ...entry,
            rowKey: `${entry.id}-${index}`,
            isFirstRow: index === 0,
            itemIndex: index,
            currentItemInfo: item,
            cumulativeBalance: runningBalance
          });
        });
      }
    });

    return result;
  }, [ledgerEntries, ledgerData?.previousBalance, dateRange, selectedCustomer, customers]);

  // Track 페이지네이션: pagination={false} 로 전체 렌더되므로 현재 페이지만큼 직접 잘라서 표시
  // (summary 는 잘린 페이지 데이터를 pageData 로 받아 기존과 동일하게 페이지 합계를 계산)
  const pagedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return expandedEntries.slice(start, start + pageSize);
  }, [expandedEntries, currentPage, pageSize]);
  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(expandedEntries.length / pageSize));
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [expandedEntries.length, pageSize, currentPage]);

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

      // 거래원장 데이터 조회
      const response = await transactionLedgerAPI.getLedger(currentBusiness.id, params);

      if (response.data.success && response.data.data.entries) {
        setLedgerEntries(response.data.data.entries);
        setLedgerData(response.data.data);
      } else {
        setLedgerEntries([]);
        setLedgerData(null);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        setLedgerEntries([]);
      } else {
        message.error('거래원장 데이터를 불러오는데 실패했습니다.');
      }
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
      width: isMobile ? 78 : 120,
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
      width: isMobile ? 88 : 150,
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
      width: isMobile ? 52 : 80,
      align: 'center' as const,
      render: (type: string, record: ExpandedLedgerEntry) => {
        if (!record.isFirstRow) return null;
        // 이월잔액 행
        if (record.isCarryOver) {
          return <span style={{ color: '#faad14' }}>이월</span>;
        }
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
          'payment': 'red'
        };
        return <span style={{ color: colorMap[type as keyof typeof colorMap] }}>{typeMap[type as keyof typeof typeMap]}</span>;
      },
    },
    {
      title: '품목명',
      dataIndex: 'description',
      key: 'description',
      width: isMobile ? 104 : 200,
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
      title: '수량',
      key: 'quantity',
      width: isMobile ? 50 : 70,
      align: 'right' as const,
      render: (_: any, record: ExpandedLedgerEntry) => {
        if (record.isCarryOver || record.type === 'receipt' || record.type === 'payment') return null;
        const qty = record.currentItemInfo?.quantity;
        if (qty === undefined || qty === null) return null;
        return <span>{qty.toLocaleString()}</span>;
      },
    },
    {
      title: '공급가액',
      dataIndex: 'supplyAmount',
      key: 'supplyAmount',
      width: isMobile ? 92 : 120,
      align: 'right' as const,
      render: (supplyAmount: number, record: ExpandedLedgerEntry) => {
        // 이월잔액 행은 공급가액 비움
        if (record.isCarryOver) return null;
        // 품목별 공급가액 표시
        const displayAmount = record.currentItemInfo?.amount ?? supplyAmount;
        // 음수(반품)는 빨간색, 양수는 타입별 색상
        const isNegative = displayAmount < 0;
        const colorMap = {
          'sales': isDark ? '#40a9ff' : '#1B61A8',
          'purchase': isDark ? '#d9d9d9' : '#000000',
          'receipt': isDark ? '#ff7875' : '#ff4d4f',
          'payment': isDark ? '#d9d9d9' : '#000000'
        };
        const color = isNegative ? (isDark ? '#ff7875' : '#ff4d4f') : colorMap[record.type];
        return (
          <span style={{ color }}>
            {Math.round(displayAmount || 0).toLocaleString()}원
          </span>
        );
      },
    },
    {
      title: '세액',
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: isMobile ? 78 : 100,
      align: 'right' as const,
      render: (vatAmount: number, record: ExpandedLedgerEntry) => {
        // 이월잔액 행은 세액 비움
        if (record.isCarryOver) return null;
        // 품목별 세액 표시
        const displayTax = record.currentItemInfo?.taxAmount ?? vatAmount;
        // 음수(반품)는 빨간색
        const isNegative = displayTax < 0;
        const color = isNegative ? (isDark ? '#ff7875' : '#ff4d4f') : undefined;
        return (
          <span style={{ color }}>
            {Math.round(displayTax || 0).toLocaleString()}원
          </span>
        );
      },
    },
    {
      title: '합계',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: isMobile ? 92 : 120,
      align: 'right' as const,
      render: (totalAmount: number, record: ExpandedLedgerEntry) => {
        // 이월잔액 행은 합계 비움
        if (record.isCarryOver) return null;
        // 품목별 합계 표시
        const displayTotal = record.currentItemInfo?.totalAmount ?? totalAmount;
        // 음수(반품)는 빨간색
        const isNegative = displayTotal < 0;
        const color = isNegative ? (isDark ? '#ff7875' : '#ff4d4f') : undefined;
        return (
          <span style={{ fontWeight: 'bold', color }}>
            {Math.round(displayTotal || 0).toLocaleString()}원
          </span>
        );
      },
    },
    {
      title: '잔액',
      dataIndex: 'balance',
      key: 'balance',
      width: isMobile ? 96 : 120,
      align: 'right' as const,
      render: (balance: number, record: ExpandedLedgerEntry) => {
        // 품목별 누적 잔액 표시 (cumulativeBalance 사용)
        const displayBalance = record.cumulativeBalance ?? balance;
        const color = displayBalance >= 0
          ? (isDark ? '#40a9ff' : '#1B61A8')  // 양수: 파랑
          : (isDark ? '#ff7875' : '#ff4d4f'); // 음수: 빨강
        return (
          <span style={{ fontWeight: 'bold', color }}>
            {Math.round(displayBalance || 0).toLocaleString()}원
          </span>
        );
      },
    },
    {
      title: '비고',
      dataIndex: 'memo',
      key: 'memo',
      width: isMobile ? 60 : undefined,
      align: 'center' as const,
      render: (memo: string, record: ExpandedLedgerEntry) => {
        if (!record.isFirstRow) return null;
        return memo || '';
      },
    },
  ];

  // 거래원장 전용 PDF 내보내기 핸들러
  const handleExportLedgerPDF = () => {
    if (!selectedCustomerInfo) {
      message.warning('거래처를 선택해주세요.');
      return;
    }
    if (expandedEntries.length === 0) {
      message.warning('내보낼 데이터가 없습니다.');
      return;
    }

    exportTransactionLedgerToPDF({
      filename: `거래원장_${selectedCustomerInfo.name}`,
      title: '거래원장',
      customer: {
        name: selectedCustomerInfo.name,
        customerCode: selectedCustomerInfo.customerCode,
        businessNumber: selectedCustomerInfo.businessNumber,
        representative: selectedCustomerInfo.representative,
        address: selectedCustomerInfo.address,
        phone: selectedCustomerInfo.phone,
        email: selectedCustomerInfo.email
      },
      dateRange: {
        start: dateRange[0].format('YYYY-MM-DD'),
        end: dateRange[1].format('YYYY-MM-DD')
      },
      previousBalance: ledgerData?.previousBalance || 0,
      entries: expandedEntries,
      ledgerEntries: ledgerEntries
    });
  };

  // 거래원장 전용 엑셀 내보내기 핸들러
  const handleExportLedgerExcel = () => {
    if (!selectedCustomerInfo) {
      message.warning('거래처를 선택해주세요.');
      return;
    }
    if (expandedEntries.length === 0) {
      message.warning('내보낼 데이터가 없습니다.');
      return;
    }

    exportTransactionLedgerToExcel({
      filename: `거래원장_${selectedCustomerInfo.name}`,
      title: '거래원장',
      customer: {
        name: selectedCustomerInfo.name,
        customerCode: selectedCustomerInfo.customerCode,
        businessNumber: selectedCustomerInfo.businessNumber,
        representative: selectedCustomerInfo.representative,
        address: selectedCustomerInfo.address,
        phone: selectedCustomerInfo.phone,
        email: selectedCustomerInfo.email
      },
      dateRange: {
        start: dateRange[0].format('YYYY-MM-DD'),
        end: dateRange[1].format('YYYY-MM-DD')
      },
      previousBalance: ledgerData?.previousBalance || 0,
      entries: expandedEntries,
      ledgerEntries: ledgerEntries
    });
  };

  // 거래원장 전용 내보내기 메뉴
  const actionMenuItems = [
    {
      key: 'ledger-excel',
      label: '엑셀로 내보내기 (거래원장 형식)',
      onClick: handleExportLedgerExcel
    },
    {
      key: 'ledger-pdf',
      label: 'PDF로 내보내기 (거래원장 형식)',
      onClick: handleExportLedgerPDF
    }
  ];

  // 모바일 액션 드로어 내용
  const mobileActionDrawerContent = (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <Dropdown menu={{ items: actionMenuItems }} placement="bottomRight" trigger={['click']}>
        <Button icon={<ExportOutlined />} block size="large" style={{ backgroundColor: '#1B61A8', borderColor: '#1B61A8', color: 'white', justifyContent: 'flex-start' }}>
          파일저장
        </Button>
      </Dropdown>
      <Button
        icon={<PrinterOutlined />}
        onClick={() => { setLedgerPrintModalVisible(true); setMobileActionDrawerVisible(false); }}
        block
        size="large"
        style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white', justifyContent: 'flex-start' }}
      >
        인쇄
      </Button>
    </Space>
  );

  // 모바일 카드형 거래원장 (테이블 대체)
  const renderLedgerCards = () => {
    if (expandedEntries.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={selectedCustomer ? '조회 버튼을 클릭하여 거래원장을 조회하세요.' : '거래처를 선택하고 조회하세요.'}
          style={{ padding: '32px 0' }}
        />
      );
    }

    const typeMap: Record<string, string> = { sales: '매출', purchase: '매입', receipt: '수금', payment: '지급' };
    const typeColor: Record<string, string> = { sales: 'blue', purchase: 'red', receipt: 'green', payment: 'red' };

    // 요약 합계 (전체 데이터 기준)
    const sales = ledgerEntries.filter(e => e.type === 'sales');
    const purchases = ledgerEntries.filter(e => e.type === 'purchase');
    const totalSalesSupply = sales.reduce((s, e) => s + (e.supplyAmount || 0), 0);
    const totalSalesVat = sales.reduce((s, e) => s + (e.vatAmount || 0), 0);
    const totalSales = sales.reduce((s, e) => s + (e.totalAmount || 0), 0);
    const totalPurchaseSupply = purchases.reduce((s, e) => s + (e.supplyAmount || 0), 0);
    const totalPurchaseVat = purchases.reduce((s, e) => s + (e.vatAmount || 0), 0);
    const totalPurchase = purchases.reduce((s, e) => s + (e.totalAmount || 0), 0);
    const totalReceipt = ledgerEntries.filter(e => e.type === 'receipt').reduce((s, e) => s + (e.totalAmount || e.amount || 0), 0);
    const totalPayment = ledgerEntries.filter(e => e.type === 'payment').reduce((s, e) => s + (e.totalAmount || e.amount || 0), 0);
    const finalBalance = expandedEntries.length > 0
      ? (expandedEntries[expandedEntries.length - 1].cumulativeBalance ?? 0)
      : 0;
    const fmt = (v: number) => Math.round(v || 0).toLocaleString() + '원';
    const balColorOf = (v: number) => (v >= 0 ? (isDark ? '#40a9ff' : '#1B61A8') : (isDark ? '#ff7875' : '#ff4d4f'));

    return (
      <div className="ledger-mobile-cards">
        {expandedEntries.map((record) => {
          const isCarry = record.isCarryOver;
          const t = record.type;
          const isMoney = t === 'receipt' || t === 'payment';
          const bal = record.cumulativeBalance ?? record.balance;
          const supply = record.currentItemInfo?.amount ?? record.supplyAmount;
          const tax = record.currentItemInfo?.taxAmount ?? record.vatAmount;
          const total = record.currentItemInfo?.totalAmount ?? record.totalAmount;
          const qty = record.currentItemInfo?.quantity;
          const isNeg = (total ?? 0) < 0;
          return (
            <Card key={record.rowKey} size="small" style={{ marginBottom: 8 }} styles={{ body: { padding: '10px 12px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={6}>
                  {isCarry ? <Tag color="gold">이월</Tag> : <Tag color={typeColor[t]}>{typeMap[t]}</Tag>}
                  {record.isFirstRow && (
                    <Text style={{ fontSize: 12, color: isDark ? '#a6a6a6' : '#8c8c8c' }}>
                      {dayjs(record.date).format('YYYY-MM-DD')}
                    </Text>
                  )}
                </Space>
                <Text style={{ fontWeight: 'bold', color: balColorOf(bal) }}>잔액 {fmt(bal)}</Text>
              </div>

              {!isCarry && (
                <div style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 13 }}>
                    {isMoney ? record.description : (record.currentItemInfo?.itemName || record.description || '-')}
                  </Text>
                  {!isMoney && qty !== undefined && qty !== null && (
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>수량 {qty.toLocaleString()}</Text>
                  )}
                </div>
              )}

              {!isCarry && !isMoney && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                  <Text type="secondary">공급 {Math.round(supply || 0).toLocaleString()}</Text>
                  <Text type="secondary">세액 {Math.round(tax || 0).toLocaleString()}</Text>
                  <Text strong style={{ color: isNeg ? '#ff4d4f' : undefined }}>합계 {fmt(total)}</Text>
                </div>
              )}

              {!isCarry && isMoney && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: 12 }}>
                  <Text strong>{fmt(total || record.amount || 0)}</Text>
                </div>
              )}

              {record.isFirstRow && record.memo && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>비고: {record.memo}</Text>
                </div>
              )}
            </Card>
          );
        })}

        {/* 요약 카드 */}
        <Card size="small" style={{ marginTop: 4, background: isDark ? '#1f1f1f' : '#fafafa' }} styles={{ body: { padding: 12 } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text strong>합계</Text>
            <Text style={{ fontWeight: 'bold', color: balColorOf(finalBalance) }}>잔액 {fmt(finalBalance)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <Text style={{ color: isDark ? '#40a9ff' : '#1B61A8' }}>매출 합계</Text>
            <Text style={{ color: isDark ? '#40a9ff' : '#1B61A8' }}>
              공급 {Math.round(totalSalesSupply).toLocaleString()} · 세액 {Math.round(totalSalesVat).toLocaleString()} · 합계 {fmt(totalSales)}
            </Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <Text>매입 합계</Text>
            <Text>
              공급 {Math.round(totalPurchaseSupply).toLocaleString()} · 세액 {Math.round(totalPurchaseVat).toLocaleString()} · 합계 {fmt(totalPurchase)}
            </Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <Text style={{ color: isDark ? '#ff7875' : '#ff4d4f' }}>수금 합계 {fmt(totalReceipt)}</Text>
            <Text>지급 합계 {fmt(totalPayment)}</Text>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div style={{
      padding: isMobile ? '16px 8px' : '24px',
      minHeight: 'calc(100vh - 140px)'
    }}>
      {/* 모바일 레이아웃 */}
      {isMobile ? (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 12px 0', color: isDark ? '#ffffff' : '#000000', fontSize: '20px', fontWeight: 'bold' }}>거래원장 조회</h2>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Select
              style={{ width: '100%' }}
              showSearch
              placeholder="거래처 선택"
              size="middle"
              value={selectedCustomer}
              onChange={(value) => {
                setSelectedCustomer(value);
                const customer = customersWithTransactions.find(c => c.id === value);
                if (customer) setCustomerSearchText(customer.name);
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                (option?.code ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={customersWithTransactions.map(customer => ({
                value: customer.id,
                label: `${customer.name} (${customer.customerCode})`,
                code: customer.customerCode
              }))}
              notFoundContent={customersWithTransactions.length === 0 ? '선택한 기간에 거래 기록이 없습니다' : '검색 결과가 없습니다'}
              allowClear
              onClear={() => { setSelectedCustomer(null); setCustomerSearchText(''); }}
            />
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="YYYY-MM-DD"
              size="middle"
            />
            <Space size="small" wrap>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} size="middle">
                조회
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
            <h2 style={{ margin: 0, color: isDark ? '#ffffff' : '#000000', fontSize: '24px', fontWeight: 'bold' }}>거래원장 조회</h2>
          </Col>
          <Col style={{ marginLeft: '100px' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space size="middle" wrap>
                <Select
                  style={{ width: 350 }}
                  showSearch
                  placeholder="거래처 선택"
                  size="middle"
                  value={selectedCustomer}
                  onChange={(value) => {
                    setSelectedCustomer(value);
                    const customer = customersWithTransactions.find(c => c.id === value);
                    if (customer) setCustomerSearchText(customer.name);
                  }}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                    (option?.code ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={customersWithTransactions.map(customer => ({
                    value: customer.id,
                    label: `${customer.name} (${customer.customerCode})`,
                    code: customer.customerCode
                  }))}
                  notFoundContent={customersWithTransactions.length === 0 ? '선택한 기간에 거래 기록이 없습니다' : '검색 결과가 없습니다'}
                  allowClear
                  onClear={() => { setSelectedCustomer(null); setCustomerSearchText(''); }}
                />
                <RangePicker
                  style={{ width: 300 }}
                  value={dateRange}
                  onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                  format="YYYY-MM-DD"
                  size="middle"
                />
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} size="middle">
                  조회
                </Button>
                <Dropdown menu={{ items: actionMenuItems }} placement="bottomRight">
                  <Button icon={<ExportOutlined />} size="middle" style={{ backgroundColor: '#1B61A8', borderColor: '#1B61A8', color: 'white' }}>
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
            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <strong>주소:</strong> {selectedCustomerInfo.address || '미등록'}
            </Col>
            <Col xs={12} sm={6} md={6} lg={6} xl={6}>
              <strong>전화번호:</strong> {selectedCustomerInfo.phone || '미등록'}
            </Col>
            <Col xs={12} sm={6} md={6} lg={6} xl={6}>
              <strong>이메일:</strong> {selectedCustomerInfo.email || '미등록'}
            </Col>
            <Col xs={24} sm={6} md={6} lg={6} xl={6}>
              <strong>조회기간:</strong> {dateRange ? `${dateRange[0].format('YYYY-MM-DD')} ~ ${dateRange[1].format('YYYY-MM-DD')}` : '-'}
            </Col>
          </Row>
        </Card>
      )}

      <Card>
        <Spin spinning={loading}>
          {isMobile ? (
            renderLedgerCards()
          ) : (
          <>
          <Table
            id="transaction-ledger-table"
            className={isMobile ? 'mobile-compact-table' : ''}
            columns={columns}
            dataSource={pagedEntries}
            rowKey="rowKey"
            scroll={{ x: isMobile ? 400 : 'max-content' }}
            size={isMobile ? 'small' : 'middle'}
            pagination={false}
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

              // 전체 수량 합계
              const totalQuantity = pageData.reduce((sum: number, e: ExpandedLedgerEntry) => {
                if (e.isCarryOver || e.type === 'receipt' || e.type === 'payment') return sum;
                return sum + (e.currentItemInfo?.quantity || 0);
              }, 0);

              return (
                <>
                  <Table.Summary.Row style={{ backgroundColor: isDark ? '#1f1f1f' : '#fafafa', fontWeight: 'bold' }}>
                    <Table.Summary.Cell index={0} colSpan={3} align="center">합계</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center"></Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">{totalQuantity > 0 ? totalQuantity.toLocaleString() : ''}</Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right"></Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right"></Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right"></Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">
                      <span style={{ color: finalBalance >= 0 ? (isDark ? '#40a9ff' : '#1B61A8') : (isDark ? '#ff7875' : '#ff4d4f') }}>
                        {Math.round(finalBalance || 0).toLocaleString()}원
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={9}></Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row style={{ backgroundColor: isDark ? '#141414' : '#f0f0f0' }}>
                    <Table.Summary.Cell index={0} colSpan={3} align="center">매출 합계</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center"></Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right"></Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">
                      <span style={{ color: isDark ? '#40a9ff' : '#1B61A8' }}>{Math.round(totalSalesSupply).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <span style={{ color: isDark ? '#40a9ff' : '#1B61A8' }}>{Math.round(totalSalesVat).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">
                      <span style={{ color: isDark ? '#40a9ff' : '#1B61A8', fontWeight: 'bold' }}>{Math.round(totalSales).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8} colSpan={1} align="center">수금 합계</Table.Summary.Cell>
                    <Table.Summary.Cell index={9} align="right">
                      <span style={{ color: isDark ? '#ff7875' : '#ff4d4f' }}>{Math.round(totalReceipt).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row style={{ backgroundColor: isDark ? '#141414' : '#f0f0f0' }}>
                    <Table.Summary.Cell index={0} colSpan={3} align="center">매입 합계</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center"></Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right"></Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">
                      <span style={{ color: isDark ? '#d9d9d9' : '#000000' }}>{Math.round(totalPurchaseSupply).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <span style={{ color: isDark ? '#d9d9d9' : '#000000' }}>{Math.round(totalPurchaseVat).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">
                      <span style={{ color: isDark ? '#d9d9d9' : '#000000', fontWeight: 'bold' }}>{Math.round(totalPurchase).toLocaleString()}원</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8} colSpan={1} align="center">지급 합계</Table.Summary.Cell>
                    <Table.Summary.Cell index={9} align="right">
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
          <TrackPagination
            current={currentPage}
            pageSize={pageSize}
            total={expandedEntries.length}
            showSizeChanger={true}
            onChange={(page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
                setCurrentPage(1);
              }
            }}
            extra={`총 ${ledgerEntries.length}건`}
          />
          </>
          )}
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
        width={isMobile ? '95%' : '90%'}
        style={{ maxWidth: isMobile ? 'none' : '1200px' }}
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
        expandedEntries={expandedEntries}
        customer={customers.find(c => c.id === selectedCustomer) || customersWithTransactions.find(c => c.id === selectedCustomer) || null}
        dateRange={dateRange}
        title="거래원장"
        previousBalance={ledgerData?.previousBalance || 0}
      />
    </div>
  );
};

export default TransactionLedgerManagement;