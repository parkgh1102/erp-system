import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  Space,
  Card,
  Row,
  Col,
  InputNumber,
  Typography,
  Tag,
  Tooltip,
  Tabs,
  Statistic,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
  PrinterOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { salesAPI, customerAPI } from '../../utils/api';
import dayjs from 'dayjs';
import { useMessage } from '../../hooks/useMessage';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

interface Customer {
  id: number;
  customerCode: string;
  name: string;
  businessNumber?: string;
  representative?: string;
  address?: string;
  businessType?: string;
  businessCategory?: string;
  email?: string;
}

interface TaxInvoiceItem {
  id?: number;
  date: string;
  productName: string;
  spec?: string;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;
  vatAmount: number;
  memo?: string;
}

interface TaxInvoice {
  id: number;
  invoiceNumber: string;
  issueDate: string;
  invoiceType: 'sales' | 'purchase';
  status: 'draft' | 'issued' | 'sent' | 'cancelled';
  customerId: number;
  customer?: Customer;
  items: TaxInvoiceItem[];
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  memo?: string;
  createdAt: string;
}

const TaxInvoiceManagement: React.FC = () => {
  const message = useMessage();
  const { isMobile } = useMediaQuery();
  const { currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();

  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<TaxInvoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // 샘플 데이터 (실제로는 API에서 가져옴)
  const [sampleInvoices] = useState<TaxInvoice[]>([
    {
      id: 1,
      invoiceNumber: 'TI-2026-0001',
      issueDate: '2026-01-15',
      invoiceType: 'sales',
      status: 'issued',
      customerId: 1,
      customer: { id: 1, customerCode: 'C001', name: '(주)테스트기업', businessNumber: '123-45-67890', representative: '홍길동', address: '서울시 강남구' },
      items: [
        { date: '2026-01-15', productName: '상품A', spec: 'EA', quantity: 10, unitPrice: 10000, supplyAmount: 100000, vatAmount: 10000 }
      ],
      supplyAmount: 100000,
      vatAmount: 10000,
      totalAmount: 110000,
      createdAt: '2026-01-15',
    },
    {
      id: 2,
      invoiceNumber: 'TI-2026-0002',
      issueDate: '2026-01-18',
      invoiceType: 'sales',
      status: 'draft',
      customerId: 2,
      customer: { id: 2, customerCode: 'C002', name: '삼성전자', businessNumber: '234-56-78901', representative: '이재용', address: '경기도 수원시' },
      items: [
        { date: '2026-01-18', productName: '상품B', spec: 'BOX', quantity: 5, unitPrice: 50000, supplyAmount: 250000, vatAmount: 25000 }
      ],
      supplyAmount: 250000,
      vatAmount: 25000,
      totalAmount: 275000,
      createdAt: '2026-01-18',
    },
  ]);

  // 데이터 로드
  const fetchData = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      // 거래처 데이터 로드
      const customerRes = await customerAPI.getAll(currentBusiness.id);
      if (customerRes.data.success) {
        setCustomers(customerRes.data.data || []);
      }

      // TODO: 실제 세금계산서 API 연동
      setInvoices(sampleInvoices);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, message, sampleInvoices]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 통계 계산
  const stats = useMemo(() => {
    const filtered = invoices.filter(inv => inv.invoiceType === 'sales');
    return {
      total: filtered.length,
      draft: filtered.filter(i => i.status === 'draft').length,
      issued: filtered.filter(i => i.status === 'issued').length,
      totalAmount: filtered.reduce((sum, i) => sum + i.totalAmount, 0),
    };
  }, [invoices]);

  // 필터링된 데이터
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // 탭 필터
    if (activeTab !== 'all') {
      result = result.filter(i => i.status === activeTab);
    }

    // 검색 필터
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(i =>
        i.invoiceNumber.toLowerCase().includes(search) ||
        i.customer?.name.toLowerCase().includes(search) ||
        i.customer?.businessNumber?.includes(search)
      );
    }

    // 날짜 필터
    result = result.filter(i => {
      const date = dayjs(i.issueDate);
      return date.isAfter(dateRange[0].subtract(1, 'day')) && date.isBefore(dateRange[1].add(1, 'day'));
    });

    return result;
  }, [invoices, activeTab, searchText, dateRange]);

  // 모달 열기
  const openModal = (invoice?: TaxInvoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      form.setFieldsValue({
        ...invoice,
        issueDate: dayjs(invoice.issueDate),
      });
    } else {
      setEditingInvoice(null);
      form.resetFields();
      form.setFieldsValue({
        issueDate: dayjs(),
        invoiceType: 'sales',
        status: 'draft',
      });
    }
    setModalVisible(true);
  };

  // 상세보기
  const openDetail = (invoice: TaxInvoice) => {
    setSelectedInvoice(invoice);
    setDetailModalVisible(true);
  };

  // 저장
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // TODO: API 연동
      message.success(editingInvoice ? '세금계산서가 수정되었습니다.' : '세금계산서가 생성되었습니다.');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };

  // 삭제
  const handleDelete = async (id: number) => {
    try {
      // TODO: API 연동
      message.success('세금계산서가 삭제되었습니다.');
      fetchData();
    } catch (error) {
      message.error('삭제에 실패했습니다.');
    }
  };

  // 상태 태그
  const renderStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      draft: { color: 'default', text: '임시저장', icon: <ClockCircleOutlined /> },
      issued: { color: 'blue', text: '발행완료', icon: <CheckCircleOutlined /> },
      sent: { color: 'green', text: '전송완료', icon: <CheckCircleOutlined /> },
      cancelled: { color: 'red', text: '취소', icon: null },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 금액 포맷
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };

  // 테이블 컬럼
  const columns = [
    {
      title: '계산서번호',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140,
      render: (text: string, record: TaxInvoice) => (
        <a onClick={() => openDetail(record)}>{text}</a>
      ),
    },
    {
      title: '발행일',
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '거래처',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
      ellipsis: true,
    },
    {
      title: '사업자번호',
      dataIndex: ['customer', 'businessNumber'],
      key: 'businessNumber',
      width: 130,
      responsive: ['md'] as any,
    },
    {
      title: '공급가액',
      dataIndex: 'supplyAmount',
      key: 'supplyAmount',
      width: 120,
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: '세액',
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: 100,
      align: 'right' as const,
      responsive: ['lg'] as any,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: '합계',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right' as const,
      render: (val: number) => <Text strong>{formatCurrency(val)}</Text>,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: '관리',
      key: 'action',
      width: 120,
      render: (_: any, record: TaxInvoice) => (
        <Space size="small">
          <Tooltip title="상세보기">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Tooltip title="수정">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openModal(record)} />
          </Tooltip>
          <Popconfirm title="삭제하시겠습니까?" onConfirm={() => handleDelete(record.id)} okText="삭제" cancelText="취소">
            <Tooltip title="삭제">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: `전체 (${stats.total})` },
    { key: 'draft', label: `임시저장 (${stats.draft})` },
    { key: 'issued', label: `발행완료 (${stats.issued})` },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: isDark ? '#fff' : undefined }}>
          <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          세금계산서 관리
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          {!isMobile && '세금계산서 발행'}
        </Button>
      </div>

      {/* 통계 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="전체" value={stats.total} suffix="건" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="임시저장" value={stats.draft} suffix="건" valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="발행완료" value={stats.issued} suffix="건" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="총 금액" value={stats.totalAmount} formatter={(val) => formatCurrency(val as number)} valueStyle={{ color: '#1890ff', fontSize: isMobile ? 16 : 20 }} />
          </Card>
        </Col>
      </Row>

      {/* 필터 영역 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            style={{ width: isMobile ? '100%' : 240 }}
          />
          <Input
            placeholder="계산서번호, 거래처명 검색"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: isMobile ? '100%' : 200 }}
            allowClear
          />
          <Button icon={<ExportOutlined />}>내보내기</Button>
        </Space>
      </Card>

      {/* 탭 & 테이블 */}
      <Card size="small">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        <Table
          columns={columns}
          dataSource={filteredInvoices}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredInvoices.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}건`,
          }}
          scroll={{ x: 900 }}
          size={isMobile ? 'small' : 'middle'}
        />
      </Card>

      {/* 발행 모달 */}
      <Modal
        title={editingInvoice ? '세금계산서 수정' : '세금계산서 발행'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        width={800}
        okText="저장"
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="issueDate" label="발행일" rules={[{ required: true, message: '발행일을 선택하세요' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="customerId" label="거래처" rules={[{ required: true, message: '거래처를 선택하세요' }]}>
                <Select placeholder="거래처 선택" showSearch optionFilterProp="children">
                  {customers.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name} {c.businessNumber && `(${c.businessNumber})`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="supplyAmount" label="공급가액">
                <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as any} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="vatAmount" label="세액">
                <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as any} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="memo" label="비고">
                <TextArea rows={2} placeholder="비고 사항" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 상세보기 모달 */}
      <Modal
        title="세금계산서 상세"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />}>인쇄</Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>닫기</Button>,
        ]}
        width={800}
      >
        {selectedInvoice && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">계산서번호</Text>
                <div><Text strong>{selectedInvoice.invoiceNumber}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">발행일</Text>
                <div><Text strong>{dayjs(selectedInvoice.issueDate).format('YYYY-MM-DD')}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">거래처</Text>
                <div><Text strong>{selectedInvoice.customer?.name}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">사업자번호</Text>
                <div><Text strong>{selectedInvoice.customer?.businessNumber}</Text></div>
              </Col>
              <Col span={8}>
                <Text type="secondary">공급가액</Text>
                <div><Text strong>{formatCurrency(selectedInvoice.supplyAmount)}</Text></div>
              </Col>
              <Col span={8}>
                <Text type="secondary">세액</Text>
                <div><Text strong>{formatCurrency(selectedInvoice.vatAmount)}</Text></div>
              </Col>
              <Col span={8}>
                <Text type="secondary">합계금액</Text>
                <div><Text strong style={{ color: '#1890ff', fontSize: 18 }}>{formatCurrency(selectedInvoice.totalAmount)}</Text></div>
              </Col>
              <Col span={24}>
                <Text type="secondary">상태</Text>
                <div>{renderStatusTag(selectedInvoice.status)}</div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaxInvoiceManagement;
