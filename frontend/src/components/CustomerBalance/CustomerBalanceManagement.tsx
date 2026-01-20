import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Tabs,
  Statistic,
  Input,
  Space,
  Progress,
  Button,
  Modal,
  Tooltip,
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  AccountBookOutlined,
  ExportOutlined,
  EyeOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { customerAPI, salesAPI, purchaseAPI, paymentAPI } from '../../utils/api';
import dayjs from 'dayjs';
import { useMessage } from '../../hooks/useMessage';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface CustomerBalance {
  id: number;
  customerCode: string;
  name: string;
  businessNumber?: string;
  customerType: 'customer' | 'supplier' | 'both';
  totalSales: number;
  totalReceipts: number;
  receivableBalance: number; // 미수금 (매출 - 수금)
  totalPurchases: number;
  totalPayments: number;
  payableBalance: number; // 미지급 (매입 - 지급)
  netBalance: number; // 순잔액 (미수금 - 미지급)
  lastTransactionDate?: string;
  overdueDays?: number;
}

interface TransactionDetail {
  id: number;
  date: string;
  type: 'sales' | 'receipt' | 'purchase' | 'payment';
  description: string;
  amount: number;
  balance: number;
}

const CustomerBalanceManagement: React.FC = () => {
  const message = useMessage();
  const { isMobile } = useMediaQuery();
  const { currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();

  const [balances, setBalances] = useState<CustomerBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('receivable');
  const [searchText, setSearchText] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerBalance | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetail[]>([]);

  // 샘플 데이터
  const [sampleBalances] = useState<CustomerBalance[]>([
    {
      id: 1,
      customerCode: 'C001',
      name: '(주)테스트기업',
      businessNumber: '123-45-67890',
      customerType: 'customer',
      totalSales: 5000000,
      totalReceipts: 3500000,
      receivableBalance: 1500000,
      totalPurchases: 0,
      totalPayments: 0,
      payableBalance: 0,
      netBalance: 1500000,
      lastTransactionDate: '2026-01-15',
      overdueDays: 15,
    },
    {
      id: 2,
      customerCode: 'C002',
      name: '삼성전자',
      businessNumber: '234-56-78901',
      customerType: 'customer',
      totalSales: 10000000,
      totalReceipts: 10000000,
      receivableBalance: 0,
      totalPurchases: 0,
      totalPayments: 0,
      payableBalance: 0,
      netBalance: 0,
      lastTransactionDate: '2026-01-18',
    },
    {
      id: 3,
      customerCode: 'C003',
      name: 'LG전자',
      businessNumber: '345-67-89012',
      customerType: 'customer',
      totalSales: 8000000,
      totalReceipts: 5000000,
      receivableBalance: 3000000,
      totalPurchases: 0,
      totalPayments: 0,
      payableBalance: 0,
      netBalance: 3000000,
      lastTransactionDate: '2026-01-10',
      overdueDays: 30,
    },
    {
      id: 4,
      customerCode: 'S001',
      name: '(주)공급업체A',
      businessNumber: '111-22-33333',
      customerType: 'supplier',
      totalSales: 0,
      totalReceipts: 0,
      receivableBalance: 0,
      totalPurchases: 3000000,
      totalPayments: 2000000,
      payableBalance: 1000000,
      netBalance: -1000000,
      lastTransactionDate: '2026-01-12',
    },
    {
      id: 5,
      customerCode: 'S002',
      name: '(주)공급업체B',
      businessNumber: '222-33-44444',
      customerType: 'supplier',
      totalSales: 0,
      totalReceipts: 0,
      receivableBalance: 0,
      totalPurchases: 5000000,
      totalPayments: 3500000,
      payableBalance: 1500000,
      netBalance: -1500000,
      lastTransactionDate: '2026-01-08',
      overdueDays: 20,
    },
  ]);

  // 데이터 로드
  const fetchData = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      // TODO: 실제 API 연동
      setBalances(sampleBalances);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, message, sampleBalances]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalReceivable = balances.reduce((sum, b) => sum + b.receivableBalance, 0);
    const totalPayable = balances.reduce((sum, b) => sum + b.payableBalance, 0);
    const overdueCount = balances.filter(b => b.overdueDays && b.overdueDays > 0).length;
    const receivableCustomers = balances.filter(b => b.receivableBalance > 0).length;
    const payableSuppliers = balances.filter(b => b.payableBalance > 0).length;

    return {
      totalReceivable,
      totalPayable,
      netBalance: totalReceivable - totalPayable,
      overdueCount,
      receivableCustomers,
      payableSuppliers,
    };
  }, [balances]);

  // 필터링된 데이터
  const filteredBalances = useMemo(() => {
    let result = [...balances];

    // 탭 필터
    if (activeTab === 'receivable') {
      result = result.filter(b => b.receivableBalance > 0);
    } else if (activeTab === 'payable') {
      result = result.filter(b => b.payableBalance > 0);
    } else if (activeTab === 'overdue') {
      result = result.filter(b => b.overdueDays && b.overdueDays > 0);
    }

    // 검색 필터
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(search) ||
        b.customerCode.toLowerCase().includes(search) ||
        b.businessNumber?.includes(search)
      );
    }

    return result;
  }, [balances, activeTab, searchText]);

  // 상세보기
  const openDetail = (customer: CustomerBalance) => {
    setSelectedCustomer(customer);
    // 샘플 거래 내역
    setTransactionDetails([
      { id: 1, date: '2026-01-05', type: 'sales', description: '매출 #S001', amount: 1000000, balance: 1000000 },
      { id: 2, date: '2026-01-10', type: 'receipt', description: '수금 #R001', amount: -500000, balance: 500000 },
      { id: 3, date: '2026-01-15', type: 'sales', description: '매출 #S002', amount: 2000000, balance: 2500000 },
      { id: 4, date: '2026-01-18', type: 'receipt', description: '수금 #R002', amount: -1000000, balance: 1500000 },
    ]);
    setDetailModalVisible(true);
  };

  // 금액 포맷
  const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원';

  // 미수/미지급 테이블 컬럼
  const columns = [
    {
      title: '거래처코드',
      dataIndex: 'customerCode',
      key: 'customerCode',
      width: 100,
    },
    {
      title: '거래처명',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CustomerBalance) => (
        <a onClick={() => openDetail(record)}>{text}</a>
      ),
    },
    {
      title: '사업자번호',
      dataIndex: 'businessNumber',
      key: 'businessNumber',
      width: 130,
      responsive: ['md'] as any,
    },
    ...(activeTab !== 'payable' ? [{
      title: '미수금',
      dataIndex: 'receivableBalance',
      key: 'receivableBalance',
      width: 130,
      align: 'right' as const,
      render: (val: number) => val > 0 ? <Text type="danger" strong>{formatCurrency(val)}</Text> : '-',
    }] : []),
    ...(activeTab !== 'receivable' ? [{
      title: '미지급',
      dataIndex: 'payableBalance',
      key: 'payableBalance',
      width: 130,
      align: 'right' as const,
      render: (val: number) => val > 0 ? <Text type="warning" strong>{formatCurrency(val)}</Text> : '-',
    }] : []),
    {
      title: '연체',
      dataIndex: 'overdueDays',
      key: 'overdueDays',
      width: 80,
      render: (days: number) => days > 0 ? (
        <Tag color={days > 30 ? 'red' : days > 14 ? 'orange' : 'gold'} icon={<WarningOutlined />}>
          {days}일
        </Tag>
      ) : '-',
    },
    {
      title: '최근거래',
      dataIndex: 'lastTransactionDate',
      key: 'lastTransactionDate',
      width: 110,
      responsive: ['lg'] as any,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '관리',
      key: 'action',
      width: 80,
      render: (_: any, record: CustomerBalance) => (
        <Tooltip title="상세보기">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
        </Tooltip>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: `전체` },
    { key: 'receivable', label: `미수금 (${stats.receivableCustomers})` },
    { key: 'payable', label: `미지급 (${stats.payableSuppliers})` },
    { key: 'overdue', label: <span style={{ color: '#ff4d4f' }}>연체 ({stats.overdueCount})</span> },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: isDark ? '#fff' : undefined }}>
          <AccountBookOutlined style={{ marginRight: 8, color: '#36cfc9' }} />
          미수금/미지급 현황
        </Title>
        <Button icon={<ExportOutlined />}>내보내기</Button>
      </div>

      {/* 통계 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="총 미수금"
              value={stats.totalReceivable}
              formatter={(val) => formatCurrency(val as number)}
              valueStyle={{ color: '#cf1322', fontSize: isMobile ? 16 : 20 }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="총 미지급"
              value={stats.totalPayable}
              formatter={(val) => formatCurrency(val as number)}
              valueStyle={{ color: '#faad14', fontSize: isMobile ? 16 : 20 }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="순잔액"
              value={stats.netBalance}
              formatter={(val) => formatCurrency(val as number)}
              valueStyle={{ color: stats.netBalance >= 0 ? '#3f8600' : '#cf1322', fontSize: isMobile ? 16 : 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="연체 거래처"
              value={stats.overdueCount}
              suffix="개"
              valueStyle={{ color: stats.overdueCount > 0 ? '#cf1322' : '#52c41a', fontSize: isMobile ? 16 : 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 수금률 표시 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Text strong>수금률</Text>
            <Progress
              percent={Math.round((1 - stats.totalReceivable / (stats.totalReceivable + balances.reduce((s, b) => s + b.totalReceipts, 0) || 1)) * 100)}
              strokeColor="#52c41a"
              style={{ marginTop: 8 }}
            />
          </Col>
          <Col xs={24} md={12}>
            <Text strong>지급률</Text>
            <Progress
              percent={Math.round((1 - stats.totalPayable / (stats.totalPayable + balances.reduce((s, b) => s + b.totalPayments, 0) || 1)) * 100)}
              strokeColor="#1890ff"
              style={{ marginTop: 8 }}
            />
          </Col>
        </Row>
      </Card>

      {/* 필터 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="거래처명, 코드, 사업자번호 검색"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: isMobile ? '100%' : 250 }}
            allowClear
          />
        </Space>
      </Card>

      {/* 테이블 */}
      <Card size="small">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        <Table
          columns={columns}
          dataSource={filteredBalances}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `총 ${total}건` }}
          scroll={{ x: 700 }}
          size={isMobile ? 'small' : 'middle'}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: isDark ? '#1f1f1f' : '#fafafa' }}>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>합계</Text>
                </Table.Summary.Cell>
                {activeTab !== 'payable' && (
                  <Table.Summary.Cell index={3} align="right">
                    <Text type="danger" strong>{formatCurrency(filteredBalances.reduce((s, b) => s + b.receivableBalance, 0))}</Text>
                  </Table.Summary.Cell>
                )}
                {activeTab !== 'receivable' && (
                  <Table.Summary.Cell index={4} align="right">
                    <Text type="warning" strong>{formatCurrency(filteredBalances.reduce((s, b) => s + b.payableBalance, 0))}</Text>
                  </Table.Summary.Cell>
                )}
                <Table.Summary.Cell index={5} colSpan={3} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* 상세보기 모달 */}
      <Modal
        title={`거래처 잔액 상세 - ${selectedCustomer?.name}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={<Button onClick={() => setDetailModalVisible(false)}>닫기</Button>}
        width={800}
      >
        {selectedCustomer && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="총 매출" value={selectedCustomer.totalSales} formatter={(v) => formatCurrency(v as number)} valueStyle={{ fontSize: 16 }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="총 수금" value={selectedCustomer.totalReceipts} formatter={(v) => formatCurrency(v as number)} valueStyle={{ fontSize: 16, color: '#52c41a' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="미수금 잔액" value={selectedCustomer.receivableBalance} formatter={(v) => formatCurrency(v as number)} valueStyle={{ fontSize: 16, color: '#cf1322' }} />
                </Card>
              </Col>
            </Row>

            <Title level={5}>거래 내역</Title>
            <Table
              dataSource={transactionDetails}
              columns={[
                { title: '일자', dataIndex: 'date', key: 'date', width: 110 },
                {
                  title: '구분',
                  dataIndex: 'type',
                  key: 'type',
                  width: 80,
                  render: (type: string) => (
                    <Tag color={type === 'sales' || type === 'purchase' ? 'blue' : 'green'}>
                      {type === 'sales' ? '매출' : type === 'receipt' ? '수금' : type === 'purchase' ? '매입' : '지급'}
                    </Tag>
                  ),
                },
                { title: '내용', dataIndex: 'description', key: 'description' },
                {
                  title: '금액',
                  dataIndex: 'amount',
                  key: 'amount',
                  width: 130,
                  align: 'right',
                  render: (val: number) => (
                    <Text type={val > 0 ? 'danger' : 'success'}>{formatCurrency(Math.abs(val))}</Text>
                  ),
                },
                {
                  title: '잔액',
                  dataIndex: 'balance',
                  key: 'balance',
                  width: 130,
                  align: 'right',
                  render: (val: number) => <Text strong>{formatCurrency(val)}</Text>,
                },
              ]}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerBalanceManagement;
