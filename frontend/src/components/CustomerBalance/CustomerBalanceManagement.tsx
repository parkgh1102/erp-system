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
  Dropdown,
  Checkbox,
  Empty,
  Popconfirm,
} from 'antd';
import {
  SearchOutlined,
  AccountBookOutlined,
  EyeOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PrinterOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  CopyOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import KakaoIcon from '../Common/KakaoIcon';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { customerAPI, salesAPI, purchaseAPI, paymentAPI, transactionLedgerAPI } from '../../utils/api';
import { formatBusinessNumber } from '../../utils/formatters';
import dayjs from 'dayjs';
import { useMessage } from '../../hooks/useMessage';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import CustomerBalancePrint from '../Print/CustomerBalancePrint';
import { docTotal, computeAging, sumAging, type AgingBuckets } from '../../utils/receivableAging';
import TrackPagination from '../Common/TrackPagination';
import { useResizableColumns } from '../../hooks/useResizableColumns';

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
  overdueDays?: number; // 미수금이 발생한 가장 오래된 매출의 경과일수
  aging?: AgingBuckets; // 미수금 연령 구간별 분포
}

interface TransactionDetail {
  id: number;
  date: string;
  type: 'sales' | 'receipt' | 'purchase' | 'payment';
  description: string;
  amount: number;
  balance: number;
}

/**
 * 거래 내용 표시용 라벨. 매출조회 화면과 동일한 규칙:
 *   품목 1건 → 품목명 / 2건 이상 → "품목명 외 N"
 * 품목이 없을 때만 비고·메모로 폴백한다(내부 ID는 노출하지 않음).
 */
const describeItems = (doc: any, fallback: string): string => {
  const items = doc?.items;
  if (Array.isArray(items) && items.length > 0) {
    const first = items[0]?.itemName || items[0]?.productName || '품목';
    return items.length === 1 ? first : `${first} 외 ${items.length - 1}`;
  }
  return doc?.description || doc?.memo || fallback;
};

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
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [autoSaveType, setAutoSaveType] = useState<'pdf' | 'png' | 'jpg' | 'clipboard' | null>(null);
  // 거래처별 거래 내역 (상세보기/인쇄용) — fetchData 시 함께 계산해 보관
  const [detailsMap, setDetailsMap] = useState<Record<number, TransactionDetail[]>>({});
  // 미수금 안내 알림톡 전송 중인 거래처 id
  const [sendingNoticeId, setSendingNoticeId] = useState<number | null>(null);
  const [bulkSending, setBulkSending] = useState(false);

  // 데이터 로드 + 미수금/미지급 및 일자분석 계산
  const fetchData = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      // 일부 API가 실패(예: 권한/404)해도 전체가 깨지지 않도록 개별 방어 처리.
      // 다만 실패를 조용히 빈 배열로 두면 '잔액 0원'이라는 틀린 금액을 보여주게 되므로
      // 어떤 데이터가 빠졌는지 추적해 사용자에게 경고한다.
      const failed: string[] = [];
      const safeGet = (p: Promise<any>, label: string) =>
        p.catch(() => {
          failed.push(label);
          return { data: { data: {} } };
        });
      const [customersRes, salesRes, purchasesRes, paymentsRes] = await Promise.all([
        safeGet(customerAPI.getAll(currentBusiness.id, { page: 1, limit: 10000 }), '거래처'),
        safeGet(salesAPI.getAll(currentBusiness.id), '매출'),
        safeGet(purchaseAPI.getAll(currentBusiness.id), '매입'),
        safeGet(paymentAPI.getAll(currentBusiness.id), '수금/지급'),
      ]);

      if (failed.length > 0) {
        message.warning(
          `${failed.join('·')} 데이터를 불러오지 못해 잔액이 실제와 다를 수 있습니다. 새로고침 후 다시 확인해주세요.`
        );
      }

      const customers: any[] = customersRes.data?.data?.customers || [];
      const sales: any[] = salesRes.data?.data?.sales || [];
      const purchases: any[] = purchasesRes.data?.data?.purchases || [];
      const payments: any[] = paymentsRes.data?.data?.payments || [];

      // 거래처별로 매출/매입/수금/지급을 그룹화
      const byCustomer = new Map<number, {
        sales: any[]; purchases: any[]; receipts: number; payments: number;
      }>();
      const ensure = (id: number) => {
        if (!byCustomer.has(id)) byCustomer.set(id, { sales: [], purchases: [], receipts: 0, payments: 0 });
        return byCustomer.get(id)!;
      };
      sales.forEach(s => { if (s.customerId != null) ensure(s.customerId).sales.push(s); });
      purchases.forEach(p => { if (p.customerId != null) ensure(p.customerId).purchases.push(p); });
      payments.forEach(p => {
        if (p.customerId == null) return;
        const bucket = ensure(p.customerId);
        if (p.paymentType === '수금') bucket.receipts += Number(p.amount) || 0;
        else if (p.paymentType === '지급') bucket.payments += Number(p.amount) || 0;
      });

      const details: Record<number, TransactionDetail[]> = {};

      const computed: CustomerBalance[] = customers.map((c: any) => {
        const g = byCustomer.get(c.id) || { sales: [], purchases: [], receipts: 0, payments: 0 };

        const totalSales = g.sales.reduce((sum, s) => sum + docTotal(s), 0);
        const totalPurchases = g.purchases.reduce((sum, p) => sum + docTotal(p), 0);
        const totalReceipts = g.receipts;
        const totalPayments = g.payments;
        const receivableBalance = totalSales - totalReceipts;
        const payableBalance = totalPurchases - totalPayments;

        // 미수금 일자분석 (수금액을 오래된 매출부터 FIFO 차감)
        const { aging, overdueDays } = computeAging(g.sales, totalReceipts);

        // 거래 내역 타임라인 (순 미수 포지션 기준 잔액)
        const timeline: Array<{ date: string; type: TransactionDetail['type']; description: string; amount: number }> = [];
        g.sales.forEach(s => timeline.push({ date: dayjs(s.transactionDate).format('YYYY-MM-DD'), type: 'sales', description: describeItems(s, '매출'), amount: docTotal(s) }));
        g.purchases.forEach(p => timeline.push({ date: dayjs(p.transactionDate).format('YYYY-MM-DD'), type: 'purchase', description: describeItems(p, '매입'), amount: -docTotal(p) }));
        payments.filter(p => p.customerId === c.id).forEach(p => {
          const amt = Number(p.amount) || 0;
          timeline.push({
            date: dayjs(p.paymentDate).format('YYYY-MM-DD'),
            type: p.paymentType === '수금' ? 'receipt' : 'payment',
            description: p.description || p.memo || p.paymentType,
            amount: p.paymentType === '수금' ? -amt : amt,
          });
        });
        timeline.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
        let running = 0;
        details[c.id] = timeline.map((t, idx) => {
          running += t.amount;
          return { id: idx + 1, date: t.date, type: t.type, description: t.description, amount: t.amount, balance: running };
        });

        const allDates = [
          ...g.sales.map(s => s.transactionDate),
          ...g.purchases.map(p => p.transactionDate),
          ...payments.filter(p => p.customerId === c.id).map(p => p.paymentDate),
        ].filter(Boolean);
        const lastTransactionDate = allDates.length
          ? dayjs(Math.max(...allDates.map(d => dayjs(d).valueOf()))).format('YYYY-MM-DD')
          : undefined;

        const typeMap: Record<string, CustomerBalance['customerType']> = {
          '매출처': 'customer', '매입처': 'supplier', '기타': 'both',
        };

        return {
          id: c.id,
          customerCode: c.customerCode || '',
          name: c.name,
          businessNumber: c.businessNumber,
          customerType: typeMap[c.customerType] || 'both',
          totalSales,
          totalReceipts,
          receivableBalance,
          totalPurchases,
          totalPayments,
          payableBalance,
          netBalance: receivableBalance - payableBalance,
          lastTransactionDate,
          overdueDays,
          aging,
        };
      })
      // 거래 이력이 전혀 없는 거래처는 제외
      .filter(b => b.totalSales > 0 || b.totalPurchases > 0 || b.totalReceipts > 0 || b.totalPayments > 0);

      setDetailsMap(details);
      setBalances(computed);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, message]);

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

    // 미수금 연령 구간별 합계
    const aging = sumAging(balances.map(b => b.aging).filter((a): a is AgingBuckets => !!a));

    return {
      totalReceivable,
      totalPayable,
      netBalance: totalReceivable - totalPayable,
      overdueCount,
      receivableCustomers,
      payableSuppliers,
      aging,
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

  // Track 페이지네이션: pagination={false} 로 전체 렌더되므로 현재 페이지만큼 직접 잘라서 표시
  const [cbPage, setCbPage] = useState(1);
  const [cbPageSize, setCbPageSize] = useState(10);
  const pagedBalances = useMemo(() => {
    const start = (cbPage - 1) * cbPageSize;
    return filteredBalances.slice(start, start + cbPageSize);
  }, [filteredBalances, cbPage, cbPageSize]);
  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(filteredBalances.length / cbPageSize));
    if (cbPage > pageCount) setCbPage(pageCount);
  }, [filteredBalances.length, cbPageSize, cbPage]);

  // 거래처별 실제 거래 내역 설정 (fetchData에서 계산해 둔 detailsMap 사용)
  const loadTransactionDetails = (customer: CustomerBalance) => {
    setSelectedCustomer(customer);
    setTransactionDetails(detailsMap[customer.id] || []);
  };

  // 상세보기
  const openDetail = (customer: CustomerBalance) => {
    loadTransactionDetails(customer);
    setDetailModalVisible(true);
  };

  /**
   * 미수금 안내 알림톡 전송 (템플릿 SJT_256790).
   * 수신번호·금액·연체일수는 서버가 DB에서 직접 산출하므로 여기서는 거래처 id만 넘긴다.
   */
  const handleSendNotice = async (customer: CustomerBalance) => {
    if (!currentBusiness) return;
    setSendingNoticeId(customer.id);
    try {
      const res = await transactionLedgerAPI.sendReceivableNotice(currentBusiness.id, customer.id);
      message.success(res.data?.message || '미수금 안내를 전송했습니다.');
    } catch (error: any) {
      // 서버가 사유(전화번호 미등록, 미수금 없음 등)를 내려주면 그대로 노출
      message.error(error?.response?.data?.message || '알림톡 전송에 실패했습니다.');
    } finally {
      setSendingNoticeId(null);
    }
  };

  /** 일괄 전송 대상: 선택한 거래처 중 미수금이 있는 것만 */
  const noticeTargets = useMemo(
    () => filteredBalances.filter(b => selectedRowKeys.includes(b.id) && b.receivableBalance > 0),
    [filteredBalances, selectedRowKeys]
  );

  const handleSendNoticesBulk = async () => {
    if (!currentBusiness || noticeTargets.length === 0) return;
    setBulkSending(true);
    try {
      const res = await transactionLedgerAPI.sendReceivableNoticesBulk(
        currentBusiness.id,
        noticeTargets.map(b => b.id)
      );
      const data = res.data?.data;
      message.success(res.data?.message || '일괄 전송이 완료되었습니다.');
      // 제외/실패 사유가 있으면 사용자가 알 수 있게 함께 보여준다
      if (data?.details?.length) {
        message.warning(`제외·실패 내역: ${data.details.slice(0, 5).join(' / ')}`, 6);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || '일괄 전송에 실패했습니다.');
    } finally {
      setBulkSending(false);
    }
  };

  // 인쇄
  const openPrint = (customer: CustomerBalance) => {
    loadTransactionDetails(customer);
    setPrintModalVisible(true);
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
      render: (val: string) => val ? formatBusinessNumber(val) : '-',
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
      width: 120,
      render: (_: any, record: CustomerBalance) => (
        <Space size={0}>
          <Tooltip title="상세보기">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Popconfirm
            title="미수금 안내 전송"
            description={
              <div style={{ maxWidth: 260 }}>
                <div><strong>{record.name}</strong>님에게 카카오 알림톡을 보냅니다.</div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                  미수금 {formatCurrency(record.receivableBalance)} · 연체 {record.overdueDays || 0}일
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                  거래처에 등록된 전화번호로 발송됩니다.
                </div>
              </div>
            }
            okText="전송"
            cancelText="취소"
            onConfirm={() => handleSendNotice(record)}
            disabled={record.receivableBalance <= 0}
          >
            <Tooltip title={record.receivableBalance > 0 ? '미수금 안내 알림톡' : '미수금이 없습니다'}>
              <Button
                type="text"
                size="small"
                icon={sendingNoticeId === record.id ? undefined : <KakaoIcon size={20} />}
                loading={sendingNoticeId === record.id}
                disabled={record.receivableBalance <= 0}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const { columns: resizableColumns, components: resizableComponents } = useResizableColumns(
    'customer-balance',
    columns,
    { baseWidth: 700, enabled: !isMobile }
  );

  const tabItems = [
    { key: 'all', label: `전체` },
    { key: 'receivable', label: `미수금 (${stats.receivableCustomers})` },
    { key: 'payable', label: `미지급 (${stats.payableSuppliers})` },
    { key: 'overdue', label: <span style={{ color: '#ff4d4f' }}>연체 ({stats.overdueCount})</span> },
  ];

  // 모바일 카드형 목록 (테이블 대체)
  const renderBalanceCards = () => {
    if (!loading && filteredBalances.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="조회된 거래처가 없습니다." style={{ padding: '24px 0' }} />;
    }
    const sumReceivable = filteredBalances.reduce((s, b) => s + b.receivableBalance, 0);
    const sumPayable = filteredBalances.reduce((s, b) => s + b.payableBalance, 0);
    return (
      <div className="balance-mobile-cards">
        {filteredBalances.map((b) => {
          const checked = selectedRowKeys.includes(b.id);
          const overdue = b.overdueDays || 0;
          return (
            <Card
              key={b.id}
              size="small"
              style={{ marginBottom: 8, borderColor: checked ? '#1B61A8' : undefined }}
              styles={{ body: { padding: 12 } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 0 }}>
                  <Checkbox
                    checked={checked}
                    onChange={() =>
                      setSelectedRowKeys((prev) =>
                        prev.includes(b.id) ? prev.filter((k) => k !== b.id) : [...prev, b.id]
                      )
                    }
                  />
                  <div style={{ minWidth: 0 }}>
                    <a onClick={() => openDetail(b)} style={{ fontWeight: 600, fontSize: 15 }}>
                      {b.name}
                    </a>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {b.customerCode}{b.businessNumber ? ` · ${formatBusinessNumber(b.businessNumber)}` : ''}
                      </Text>
                    </div>
                  </div>
                </div>
                <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => openDetail(b)} />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {activeTab !== 'payable' && (
                  <div style={{ flex: 1, background: isDark ? '#2a1215' : '#fff1f0', borderRadius: 8, padding: '6px 10px' }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>미수금</Text>
                    <div style={{ fontWeight: 700, color: '#cf1322' }}>
                      {b.receivableBalance > 0 ? formatCurrency(b.receivableBalance) : '-'}
                    </div>
                  </div>
                )}
                {activeTab !== 'receivable' && (
                  <div style={{ flex: 1, background: isDark ? '#2b2111' : '#fffbe6', borderRadius: 8, padding: '6px 10px' }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>미지급</Text>
                    <div style={{ fontWeight: 700, color: '#faad14' }}>
                      {b.payableBalance > 0 ? formatCurrency(b.payableBalance) : '-'}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                {overdue > 0 ? (
                  <Tag color={overdue > 30 ? 'red' : overdue > 14 ? 'orange' : 'gold'} icon={<WarningOutlined />}>
                    {overdue}일 연체
                  </Tag>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>연체 없음</Text>
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  최근거래 {b.lastTransactionDate ? dayjs(b.lastTransactionDate).format('YYYY-MM-DD') : '-'}
                </Text>
              </div>
            </Card>
          );
        })}

        {/* 합계 카드 */}
        {filteredBalances.length > 0 && (
          <Card size="small" style={{ marginTop: 4, background: isDark ? '#1f1f1f' : '#fafafa' }} styles={{ body: { padding: 12 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>합계 ({filteredBalances.length}건)</Text>
              <div style={{ textAlign: 'right' }}>
                {activeTab !== 'payable' && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>미수금 </Text>
                    <Text type="danger" strong>{formatCurrency(sumReceivable)}</Text>
                  </div>
                )}
                {activeTab !== 'receivable' && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>미지급 </Text>
                    <Text type="warning" strong>{formatCurrency(sumPayable)}</Text>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

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
              strokeColor="#1B61A8"
              style={{ marginTop: 8 }}
            />
          </Col>
        </Row>
      </Card>

      {/* 미수금 일자분석 */}
      {stats.totalReceivable > 0 && (
        <Card size="small" title={<span><WarningOutlined style={{ color: '#fa8c16', marginRight: 6 }} />미수금 일자분석</span>} style={{ marginBottom: 16 }}>
          {(() => {
            const buckets = [
              { key: 'b0_30', label: '0~30일', value: stats.aging.b0_30, color: '#52c41a' },
              { key: 'b31_60', label: '31~60일', value: stats.aging.b31_60, color: '#faad14' },
              { key: 'b61_90', label: '61~90일', value: stats.aging.b61_90, color: '#fa8c16' },
              { key: 'b90plus', label: '90일 초과', value: stats.aging.b90plus, color: '#cf1322' },
            ];
            const total = stats.totalReceivable || 1;
            return (
              <>
                <Row gutter={[12, 12]}>
                  {buckets.map(bk => (
                    <Col xs={12} md={6} key={bk.key}>
                      <div style={{ textAlign: 'center', padding: '8px 4px', border: `1px solid ${bk.color}33`, borderRadius: 8, background: `${bk.color}0d` }}>
                        <Text style={{ fontSize: 12, color: bk.color }}>{bk.label}</Text>
                        <div style={{ fontSize: isMobile ? 14 : 18, fontWeight: 600, color: bk.color, marginTop: 4 }}>
                          {formatCurrency(bk.value)}
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{Math.round((bk.value / total) * 100)}%</Text>
                      </div>
                    </Col>
                  ))}
                </Row>
                <Progress
                  style={{ marginTop: 12 }}
                  percent={100}
                  showInfo={false}
                  success={{ percent: Math.round((stats.aging.b0_30 / total) * 100) }}
                  strokeColor="#cf1322"
                />
              </>
            );
          })()}
        </Card>
      )}

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
          <Dropdown
            menu={{
              items: [
                { key: 'pdf', label: 'PDF 저장', icon: <FilePdfOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('저장할 항목을 선택해주세요.'); return; }
                  const selected = filteredBalances.find(b => b.id === selectedRowKeys[0]);
                  if (selected) { loadTransactionDetails(selected); setAutoSaveType('pdf'); setPrintModalVisible(true); }
                }},
                { key: 'png', label: 'PNG 저장', icon: <FileImageOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('저장할 항목을 선택해주세요.'); return; }
                  const selected = filteredBalances.find(b => b.id === selectedRowKeys[0]);
                  if (selected) { loadTransactionDetails(selected); setAutoSaveType('png'); setPrintModalVisible(true); }
                }},
                { key: 'jpg', label: 'JPG 저장', icon: <FileImageOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('저장할 항목을 선택해주세요.'); return; }
                  const selected = filteredBalances.find(b => b.id === selectedRowKeys[0]);
                  if (selected) { loadTransactionDetails(selected); setAutoSaveType('jpg'); setPrintModalVisible(true); }
                }},
                { key: 'clipboard', label: '클립보드 복사', icon: <CopyOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('복사할 항목을 선택해주세요.'); return; }
                  const selected = filteredBalances.find(b => b.id === selectedRowKeys[0]);
                  if (selected) { loadTransactionDetails(selected); setAutoSaveType('clipboard'); setPrintModalVisible(true); }
                }},
              ]
            }}
          >
            <Button icon={<DownloadOutlined />}>저장</Button>
          </Dropdown>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => {
              if (selectedRowKeys.length === 0) {
                message.warning('인쇄할 항목을 선택해주세요.');
                return;
              }
              const selected = filteredBalances.find(b => b.id === selectedRowKeys[0]);
              if (selected) {
                loadTransactionDetails(selected);
                setAutoSaveType(null);
                setPrintModalVisible(true);
              }
            }}
          >
            인쇄
          </Button>
          <Popconfirm
            title="미수금 안내 일괄 전송"
            description={
              <div style={{ maxWidth: 300 }}>
                <div>
                  선택한 <strong>{noticeTargets.length}개 거래처</strong>에 카카오 알림톡을 보냅니다.
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                  각 거래처에 등록된 전화번호로 발송되며, 미수금이 없거나 번호가 없는 거래처는 자동 제외됩니다.
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#fa8c16' }}>
                  전송 후에는 취소할 수 없습니다.
                </div>
              </div>
            }
            okText={`${noticeTargets.length}건 전송`}
            cancelText="취소"
            onConfirm={handleSendNoticesBulk}
            disabled={noticeTargets.length === 0}
          >
            <Button
              icon={bulkSending ? undefined : <KakaoIcon size={18} />}
              loading={bulkSending}
              disabled={noticeTargets.length === 0}
            >
              미수금 안내 {noticeTargets.length > 0 ? `(${noticeTargets.length})` : ''}
            </Button>
          </Popconfirm>
        </Space>
      </Card>

      {/* 테이블 */}
      <Card size="small">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        {isMobile ? (
          renderBalanceCards()
        ) : (
        <>
        <Table
          columns={resizableColumns}
          components={resizableComponents}
          dataSource={pagedBalances}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          onRow={(record) => ({
            onClick: (e) => {
              const target = e.target as HTMLElement;
              if (target.closest('button') || target.closest('a') || target.closest('.ant-checkbox-wrapper')) return;
              const key = record.id;
              setSelectedRowKeys(prev =>
                prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
              );
            },
            style: { cursor: 'pointer' }
          })}
          pagination={false}
          scroll={isMobile ? { x: 700 } : undefined}
          size={isMobile ? 'small' : 'middle'}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: isDark ? '#1f1f1f' : '#fafafa' }}>
                <Table.Summary.Cell index={0} />
                <Table.Summary.Cell index={1} colSpan={2}>
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
        <TrackPagination
          current={cbPage}
          pageSize={cbPageSize}
          total={filteredBalances.length}
          showSizeChanger={!isMobile}
          onChange={(page, size) => { setCbPage(page); setCbPageSize(size); }}
          extra={`총 ${filteredBalances.length}건`}
        />
        </>
        )}
      </Card>

      {/* 상세보기 모달 */}
      <Modal
        title={`거래처 잔액 상세 - ${selectedCustomer?.name}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => setPrintModalVisible(true)}>인쇄</Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>닫기</Button>,
        ]}
        width={isMobile ? '100%' : 800}
        style={isMobile ? { top: 0, maxWidth: '100vw', margin: 0, paddingBottom: 0 } : undefined}
        styles={isMobile ? { body: { maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' } } : undefined}
      >
        {selectedCustomer && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic title="총 매출" value={selectedCustomer.totalSales} formatter={(v) => formatCurrency(v as number)} valueStyle={{ fontSize: 16 }} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic title="총 수금" value={selectedCustomer.totalReceipts} formatter={(v) => formatCurrency(v as number)} valueStyle={{ fontSize: 16, color: '#52c41a' }} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic title="미수금 잔액" value={selectedCustomer.receivableBalance} formatter={(v) => formatCurrency(v as number)} valueStyle={{ fontSize: 16, color: '#cf1322' }} />
                </Card>
              </Col>
            </Row>

            <Title level={5}>거래 내역</Title>
            {isMobile ? (
              /* 모바일: 카드 리스트 (테이블은 금액이 숫자 중간에서 줄바꿈되어 조잡함) */
              <div>
                {transactionDetails.map((t: any) => {
                  const typeLabel = t.type === 'sales' ? '매출' : t.type === 'receipt' ? '수금' : t.type === 'purchase' ? '매입' : '지급';
                  const isReceiptOrPayment = t.type === 'receipt' || t.type === 'payment';
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 0',
                        borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Tag color={isReceiptOrPayment ? 'green' : 'blue'} style={{ marginRight: 0 }}>{typeLabel}</Tag>
                          <Text style={{ fontSize: 12, color: '#8c8c8c' }}>{t.date}</Text>
                        </div>
                        <div style={{ fontSize: 13, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          <Text type={t.amount > 0 ? 'danger' : 'success'} style={{ fontSize: 13 }}>
                            {formatCurrency(Math.abs(t.amount))}
                          </Text>
                        </div>
                        <div style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>잔액 </Text>
                          <Text strong style={{ fontSize: 12 }}>{formatCurrency(t.balance)}</Text>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
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
                    <Text type={val > 0 ? 'danger' : 'success'} style={{ whiteSpace: 'nowrap' }}>{formatCurrency(Math.abs(val))}</Text>
                  ),
                },
                {
                  title: '잔액',
                  dataIndex: 'balance',
                  key: 'balance',
                  width: 130,
                  align: 'right',
                  render: (val: number) => <Text strong style={{ whiteSpace: 'nowrap' }}>{formatCurrency(val)}</Text>,
                },
              ]}
              pagination={false}
              size="small"
              rowKey="id"
            />
            )}
          </div>
        )}
      </Modal>

      {/* 인쇄 모달 */}
      <CustomerBalancePrint
        open={printModalVisible}
        onClose={() => { setPrintModalVisible(false); setAutoSaveType(null); }}
        autoSaveType={autoSaveType}
        data={selectedCustomer ? {
          customerCode: selectedCustomer.customerCode,
          name: selectedCustomer.name,
          businessNumber: selectedCustomer.businessNumber,
          totalSales: selectedCustomer.totalSales,
          totalReceipts: selectedCustomer.totalReceipts,
          receivableBalance: selectedCustomer.receivableBalance,
          totalPurchases: selectedCustomer.totalPurchases,
          totalPayments: selectedCustomer.totalPayments,
          payableBalance: selectedCustomer.payableBalance,
          netBalance: selectedCustomer.netBalance,
          transactions: transactionDetails,
          printDate: dayjs().format('YYYY-MM-DD'),
          businessName: currentBusiness?.companyName || '',
        } : null}
      />
    </div>
  );
};

export default CustomerBalanceManagement;
