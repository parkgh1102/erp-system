import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  DatePicker,
  Select,
  Table,
  Tag,
  Typography,
  Space,
  Modal,
  Input,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  WalletOutlined,
  TeamOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../utils/api';
import { useMessage } from '../../hooks/useMessage';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import dayjs from 'dayjs';
import logger from '../../utils/logger';

const { Title: AntTitle, Text } = Typography;
const { RangePicker } = DatePicker;


const Dashboard: React.FC = () => {
  const message = useMessage();
  const { isMobile } = useMediaQuery();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalDateRange, setModalDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  const { currentBusiness, isNewUser, clearNewUserFlag } = useAuthStore();
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      const params = {
        period: selectedPeriod,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      };

      const [
        statsResponse,
        transactionsResponse
      ] = await Promise.allSettled([
        dashboardAPI.getStats(currentBusiness.id, params),
        dashboardAPI.getRecentTransactions(currentBusiness.id, { limit: 5 })
      ]);

      if (statsResponse.status === 'fulfilled') {
        setDashboardStats(statsResponse.value.data.data);
      } else {
        logger.error('Stats API failed:', statsResponse.reason);
      }

      if (transactionsResponse.status === 'fulfilled') {
        setRecentTransactions(transactionsResponse.value.data.data || []);
      } else {
        logger.error('Transactions API failed:', transactionsResponse.reason);
      }

    } catch (error) {
      logger.error('Dashboard data fetch error:', error);
      message.error('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, selectedPeriod, dateRange, message]);

  useEffect(() => {
    if (isNewUser) {
      message.success({
        content: '🎉 회원가입을 축하합니다! ERP 시스템을 이용해 보세요.',
        duration: 5,
        style: {
          marginTop: '20vh',
          fontSize: '16px',
        },
      });
      clearNewUserFlag();
    }
  }, [isNewUser, clearNewUserFlag, message]);

  // 기간 선택 시 날짜 범위 자동 업데이트
  useEffect(() => {
    switch (selectedPeriod) {
      case 'week':
        setDateRange([dayjs().startOf('week'), dayjs().endOf('week')]);
        break;
      case 'month':
        setDateRange([dayjs().startOf('month'), dayjs().endOf('month')]);
        break;
      case 'year':
        setDateRange([dayjs().startOf('year'), dayjs().endOf('year')]);
        break;
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (currentBusiness) {
      fetchDashboardData();
    }
  }, [currentBusiness, selectedPeriod, dateRange, fetchDashboardData]);

  const fetchAllTransactions = async () => {
    if (!currentBusiness) return;

    try {
      const response = await dashboardAPI.getAllTransactions(currentBusiness.id, {
        startDate: modalDateRange[0].format('YYYY-MM-DD'),
        endDate: modalDateRange[1].format('YYYY-MM-DD'),
        search: searchQuery
      });

      if (response.data && response.data.data) {
        setAllTransactions(response.data.data);
      } else {
        setAllTransactions([]);
      }
    } catch (error) {
      logger.error('All transactions fetch error:', error);
      setAllTransactions([]);
    }
  };

  // 실제 데이터가 없을 때 사용할 기본값
  const defaultStats = {
    totalSales: 0,
    totalPurchases: 0,
    totalCustomers: 0,
    totalProducts: 0,
    salesGrowth: 0,
    purchaseGrowth: 0,
  };

  // 현재 사용할 데이터 (실제 데이터가 있으면 사용, 없으면 기본값)
  const currentStats = dashboardStats || defaultStats;

  const defaultRecentTransactions: any[] = [];

  // 현재 사용할 거래 내역 데이터
  const currentTransactions = recentTransactions.length > 0 ? recentTransactions : defaultRecentTransactions;


  const quickActions = [
    {
      title: '매출 전표 작성',
      icon: <ShoppingCartOutlined />,
      color: '#52c41a',
      action: () => {
        navigate('/sales');
        // 매출 페이지에서 새 전표 작성 모달을 열기 위해 state 전달
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openSalesModal'));
        }, 100);
      },
    },
    {
      title: '매입 전표 작성',
      icon: <FileTextOutlined />,
      color: '#1890ff',
      action: () => {
        navigate('/purchases');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openPurchaseModal'));
        }, 100);
      },
    },
    {
      title: '거래처 등록',
      icon: <TeamOutlined />,
      color: '#722ed1',
      action: () => {
        navigate('/customers');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openCustomerModal'));
        }, 100);
      },
    },
    {
      title: '수금 처리',
      icon: <WalletOutlined />,
      color: '#fa8c16',
      action: () => {
        navigate('/payments');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openPaymentModal'));
        }, 100);
      },
    },
  ];

  const transactionColumns = [
    {
      title: '구분',
      dataIndex: 'type',
      key: 'type',
      width: isMobile ? 50 : 80,
      render: (type: string) => (
        <Tag color={type === '매출' ? 'green' : 'blue'}>{type}</Tag>
      ),
    },
    {
      title: '거래처',
      dataIndex: 'customer',
      key: 'customer',
      width: isMobile ? 70 : 120,
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      width: isMobile ? 80 : 100,
      render: (amount: number) => (
        <span style={{ fontSize: isMobile ? '11px' : 'inherit' }}>
          {amount.toLocaleString()}원
        </span>
      ),
    },
    {
      title: '일자',
      dataIndex: 'date',
      key: 'date',
      width: isMobile ? 65 : 100,
      render: (date: string) => isMobile && date ? date.slice(5) : date,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 50 : 80,
      render: (status: string) => (
        <Tag color={status === '완료' ? 'green' : 'processing'}>{status}</Tag>
      ),
    },
  ];

  return (
    <div style={{
      padding: isMobile ? '16px 8px' : '24px',
      minHeight: 'calc(100vh - 140px)'
    }}>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
        <Row justify="space-between" align="middle" gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <AntTitle level={isMobile ? 3 : 2} style={{ margin: 0 }}>
              대시보드
            </AntTitle>
            <Text type="secondary" style={{
              fontSize: isMobile ? '12px' : '14px',
              display: 'block',
              marginTop: '4px'
            }}>
              {currentBusiness?.companyName} - 경영 현황을 한눈에 확인하세요
            </Text>
          </Col>
          <Col xs={24} md={12}>
            <Space
              direction={isMobile ? "vertical" : "horizontal"}
              style={{ width: '100%' }}
              size={isMobile ? 8 : 16}
            >
              <Select
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                style={{ width: isMobile ? '100%' : 120 }}
                size={isMobile ? 'small' : 'middle'}
              >
                <Select.Option value="week">이번 주</Select.Option>
                <Select.Option value="month">이번 달</Select.Option>
                <Select.Option value="year">올해</Select.Option>
              </Select>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                style={{ width: isMobile ? '100%' : 'auto' }}
                size={isMobile ? 'small' : 'middle'}
              />
            </Space>
          </Col>
        </Row>
      </div>

      {/* 주요 지표 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: isMobile ? '16px' : '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            size={isMobile ? 'small' : 'default'}
            style={{ height: isMobile ? '120px' : '140px' }}
          >
            <Statistic
              title="총 매출"
              value={currentStats.totalSales}
              precision={0}
              valueStyle={{
                color: '#3f8600',
                fontSize: isMobile ? '20px' : '24px'
              }}
              prefix={<ArrowUpOutlined />}
              suffix="원"
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                전월 대비 <Text style={{ color: '#3f8600' }}>+{currentStats.salesGrowth}%</Text>
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size={isMobile ? 'small' : 'default'}
            style={{ height: isMobile ? '120px' : '140px' }}
          >
            <Statistic
              title="총 매입"
              value={currentStats.totalPurchases}
              precision={0}
              valueStyle={{
                color: '#cf1322',
                fontSize: isMobile ? '20px' : '24px'
              }}
              prefix={<ArrowDownOutlined />}
              suffix="원"
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                전월 대비 <Text style={{ color: '#cf1322' }}>{currentStats.purchaseGrowth}%</Text>
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size={isMobile ? 'small' : 'default'}
            style={{ height: isMobile ? '120px' : '140px' }}
          >
            <Statistic
              title="총 거래처"
              value={currentStats.totalCustomers}
              prefix={<TeamOutlined />}
              suffix="개"
              valueStyle={{ fontSize: isMobile ? '20px' : '24px' }}
            />
            <div style={{ marginTop: '8px', minHeight: '20px' }}>
              <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                활성 거래처
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size={isMobile ? 'small' : 'default'}
            style={{ height: isMobile ? '120px' : '140px' }}
          >
            <Statistic
              title="등록 품목"
              value={currentStats.totalProducts}
              prefix={<FileTextOutlined />}
              suffix="개"
              valueStyle={{ fontSize: isMobile ? '20px' : '24px' }}
            />
            <div style={{ marginTop: '8px', minHeight: '20px' }}>
              <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                활성 품목
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 빠른 작업 버튼 */}
      <Card
        title="빠른 작업"
        size={isMobile ? 'small' : 'default'}
        style={{ marginBottom: isMobile ? '16px' : '24px' }}
      >
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={12} sm={12} md={6} key={index}>
              <Button
                type="dashed"
                style={{
                  width: '100%',
                  height: isMobile ? '60px' : '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '4px' : '8px',
                }}
                onClick={action.action}
              >
                <div style={{
                  fontSize: isMobile ? '18px' : '24px',
                  color: action.color
                }}>
                  {action.icon}
                </div>
                <Text
                  strong
                  style={{
                    fontSize: isMobile ? '11px' : '14px',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}
                >
                  {action.title}
                </Text>
              </Button>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 차트 및 리스트 */}
      {/* 최근 거래 내역 - moved above charts */}
      <Card
        title="최근 거래 내역"
        size={isMobile ? 'small' : 'default'}
        extra={
          <Button
            type="link"
            icon={<EyeOutlined />}
            size={isMobile ? 'small' : 'middle'}
            onClick={() => {
              setTransactionModalVisible(true);
              fetchAllTransactions();
            }}
          >
            {isMobile ? '전체' : '전체보기'}
          </Button>
        }
        style={{ marginBottom: isMobile ? '16px' : '24px' }}
      >
        <Table
          className={isMobile ? 'mobile-compact-table' : ''}
          columns={transactionColumns}
          dataSource={currentTransactions}
          pagination={false}
          size="small"
          rowKey="id"
          loading={loading}
          scroll={{ x: isMobile ? 320 : 600 }}
        />
      </Card>


      {/* 전체 거래내역 모달 */}
      <Modal
        title="전체 거래 내역"
        open={transactionModalVisible}
        onCancel={() => setTransactionModalVisible(false)}
        footer={null}
        width={isMobile ? '95%' : 1000}
        style={{ top: isMobile ? 20 : undefined }}
        destroyOnHidden
      >
        <div style={{ marginBottom: '16px' }}>
          <Row gutter={[8, 8]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="거래처명 또는 금액으로 검색"
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                size={isMobile ? 'small' : 'middle'}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                style={{ width: '100%' }}
                value={modalDateRange}
                onChange={(dates) => {
                  if (dates) {
                    setModalDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
                  }
                }}
                placeholder={['시작일', '종료일']}
                size={isMobile ? 'small' : 'middle'}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={fetchAllTransactions}
                style={{ width: '100%' }}
                size={isMobile ? 'small' : 'middle'}
              >
                검색
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={[
            {
              title: '구분',
              dataIndex: 'type',
              key: 'type',
              render: (type: string) => (
                <Tag color={type === '매출' ? 'green' : 'blue'}>{type}</Tag>
              ),
            },
            {
              title: '거래처',
              dataIndex: 'customer',
              key: 'customer',
              sorter: (a, b) => a.customer.localeCompare(b.customer),
            },
            {
              title: '금액',
              dataIndex: 'amount',
              key: 'amount',
              render: (amount: number) => `${amount.toLocaleString()}원`,
              sorter: (a, b) => a.amount - b.amount,
            },
            {
              title: '일자',
              dataIndex: 'date',
              key: 'date',
              sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            },
            {
              title: '상태',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Tag color={status === '완료' ? 'green' : status === '진행중' ? 'processing' : 'warning'}>
                  {status}
                </Tag>
              ),
              filters: [
                { text: '완료', value: '완료' },
                { text: '진행중', value: '진행중' },
                { text: '대기', value: '대기' },
              ],
              onFilter: (value, record) => record.status === value,
            },
          ]}
          dataSource={allTransactions.filter(transaction =>
            !searchQuery ||
            transaction.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transaction.amount.toString().includes(searchQuery)
          )}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 600 }}
        />
      </Modal>

    </div>
  );
};

export default Dashboard;