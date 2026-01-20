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
  Divider,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
  PrinterOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SwapOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { customerAPI, productAPI } from '../../utils/api';
import dayjs from 'dayjs';
import { useMessage } from '../../hooks/useMessage';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import QuotationPrint from '../Print/QuotationPrint';

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
  phone?: string;
  email?: string;
}

interface Product {
  id: number;
  productCode: string;
  name: string;
  spec?: string;
  unit?: string;
  sellPrice?: number;
}

interface QuotationItem {
  id?: number;
  productId: number;
  productCode: string;
  productName: string;
  spec?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  memo?: string;
}

interface Quotation {
  id: number;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  customerId: number;
  customer?: Customer;
  items: QuotationItem[];
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  memo?: string;
  createdAt: string;
}

const QuotationManagement: React.FC = () => {
  const message = useMessage();
  const { isMobile } = useMediaQuery();
  const { currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([
    { productId: 0, productCode: '', productName: '', spec: '', unit: '', quantity: 1, unitPrice: 0, supplyAmount: 0, vatAmount: 0, totalAmount: 0 }
  ]);
  const [printModalVisible, setPrintModalVisible] = useState(false);

  // 샘플 데이터
  const [sampleQuotations] = useState<Quotation[]>([
    {
      id: 1,
      quotationNumber: 'QT-2026-0001',
      quotationDate: '2026-01-15',
      validUntil: '2026-02-15',
      status: 'sent',
      customerId: 1,
      customer: { id: 1, customerCode: 'C001', name: '(주)테스트기업', businessNumber: '123-45-67890' },
      items: [
        { productId: 1, productCode: 'P001', productName: '상품A', spec: 'EA', unit: 'EA', quantity: 10, unitPrice: 10000, supplyAmount: 100000, vatAmount: 10000, totalAmount: 110000 }
      ],
      supplyAmount: 100000,
      vatAmount: 10000,
      totalAmount: 110000,
      createdAt: '2026-01-15',
    },
    {
      id: 2,
      quotationNumber: 'QT-2026-0002',
      quotationDate: '2026-01-18',
      validUntil: '2026-02-18',
      status: 'accepted',
      customerId: 2,
      customer: { id: 2, customerCode: 'C002', name: '삼성전자', businessNumber: '234-56-78901' },
      items: [
        { productId: 2, productCode: 'P002', productName: '상품B', spec: 'BOX', unit: 'BOX', quantity: 5, unitPrice: 50000, supplyAmount: 250000, vatAmount: 25000, totalAmount: 275000 }
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
      const [customerRes, productRes] = await Promise.all([
        customerAPI.getAll(currentBusiness.id),
        productAPI.getAll(currentBusiness.id),
      ]);
      if (customerRes.data.success) {
        const data = customerRes.data.data;
        setCustomers(Array.isArray(data) ? data : []);
      }
      if (productRes.data.success) {
        const data = productRes.data.data;
        setProducts(Array.isArray(data) ? data : []);
      }
      setQuotations(sampleQuotations);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, message, sampleQuotations]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 통계
  const stats = useMemo(() => {
    return {
      total: quotations.length,
      draft: quotations.filter(q => q.status === 'draft').length,
      sent: quotations.filter(q => q.status === 'sent').length,
      accepted: quotations.filter(q => q.status === 'accepted').length,
      totalAmount: quotations.reduce((sum, q) => sum + q.totalAmount, 0),
    };
  }, [quotations]);

  // 필터링된 데이터
  const filteredQuotations = useMemo(() => {
    let result = [...quotations];
    if (activeTab !== 'all') {
      result = result.filter(q => q.status === activeTab);
    }
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(q =>
        q.quotationNumber.toLowerCase().includes(search) ||
        q.customer?.name.toLowerCase().includes(search)
      );
    }
    return result;
  }, [quotations, activeTab, searchText]);

  // 품목 금액 계산
  const calculateItemAmount = (index: number, field: string, value: number) => {
    const newItems = [...quotationItems];
    const item = newItems[index];

    if (field === 'quantity') item.quantity = value;
    if (field === 'unitPrice') item.unitPrice = value;

    item.supplyAmount = item.quantity * item.unitPrice;
    item.vatAmount = Math.round(item.supplyAmount * 0.1);
    item.totalAmount = item.supplyAmount + item.vatAmount;

    setQuotationItems(newItems);
  };

  // 품목 추가
  const addItem = () => {
    setQuotationItems([...quotationItems, {
      productId: 0, productCode: '', productName: '', spec: '', unit: '',
      quantity: 1, unitPrice: 0, supplyAmount: 0, vatAmount: 0, totalAmount: 0
    }]);
  };

  // 품목 삭제
  const removeItem = (index: number) => {
    if (quotationItems.length > 1) {
      setQuotationItems(quotationItems.filter((_, i) => i !== index));
    }
  };

  // 품목 선택
  const handleProductSelect = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...quotationItems];
      newItems[index] = {
        ...newItems[index],
        productId: product.id,
        productCode: product.productCode,
        productName: product.name,
        spec: product.spec || '',
        unit: product.unit || '',
        unitPrice: product.sellPrice || 0,
      };
      calculateItemAmount(index, 'unitPrice', product.sellPrice || 0);
    }
  };

  // 모달 열기
  const openModal = (quotation?: Quotation) => {
    if (quotation) {
      setEditingQuotation(quotation);
      form.setFieldsValue({
        ...quotation,
        quotationDate: dayjs(quotation.quotationDate),
        validUntil: dayjs(quotation.validUntil),
      });
      setQuotationItems(quotation.items);
    } else {
      setEditingQuotation(null);
      form.resetFields();
      form.setFieldsValue({
        quotationDate: dayjs(),
        validUntil: dayjs().add(1, 'month'),
        status: 'draft',
      });
      setQuotationItems([{ productId: 0, productCode: '', productName: '', spec: '', unit: '', quantity: 1, unitPrice: 0, supplyAmount: 0, vatAmount: 0, totalAmount: 0 }]);
    }
    setModalVisible(true);
  };

  // 상세보기
  const openDetail = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setDetailModalVisible(true);
  };

  // 저장
  const handleSave = async () => {
    try {
      await form.validateFields();
      message.success(editingQuotation ? '견적서가 수정되었습니다.' : '견적서가 생성되었습니다.');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };

  // 매출 전환
  const convertToSales = async (quotation: Quotation) => {
    message.success('견적서가 매출로 전환되었습니다.');
    fetchData();
  };

  // 삭제
  const handleDelete = async (id: number) => {
    message.success('견적서가 삭제되었습니다.');
    fetchData();
  };

  // 금액 포맷
  const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원';

  // 상태 태그
  const renderStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '임시저장' },
      sent: { color: 'blue', text: '발송완료' },
      accepted: { color: 'green', text: '승인' },
      rejected: { color: 'red', text: '거절' },
      converted: { color: 'purple', text: '매출전환' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 합계 계산
  const totals = useMemo(() => {
    return quotationItems.reduce((acc, item) => ({
      supplyAmount: acc.supplyAmount + item.supplyAmount,
      vatAmount: acc.vatAmount + item.vatAmount,
      totalAmount: acc.totalAmount + item.totalAmount,
    }), { supplyAmount: 0, vatAmount: 0, totalAmount: 0 });
  }, [quotationItems]);

  // 테이블 컬럼
  const columns = [
    {
      title: '견적번호',
      dataIndex: 'quotationNumber',
      key: 'quotationNumber',
      width: 130,
      render: (text: string, record: Quotation) => (
        <a onClick={() => openDetail(record)}>{text}</a>
      ),
    },
    {
      title: '견적일',
      dataIndex: 'quotationDate',
      key: 'quotationDate',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '유효기간',
      dataIndex: 'validUntil',
      key: 'validUntil',
      width: 110,
      responsive: ['md'] as any,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '거래처',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
      ellipsis: true,
    },
    {
      title: '합계금액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right' as const,
      render: (val: number) => <Text strong>{formatCurrency(val)}</Text>,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: '관리',
      key: 'action',
      width: 180,
      render: (_: any, record: Quotation) => (
        <Space size="small">
          <Tooltip title="상세보기">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Tooltip title="인쇄/저장">
            <Button type="text" size="small" icon={<PrinterOutlined />} onClick={() => { setSelectedQuotation(record); setPrintModalVisible(true); }} />
          </Tooltip>
          <Tooltip title="수정">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openModal(record)} />
          </Tooltip>
          {record.status === 'accepted' && (
            <Tooltip title="매출전환">
              <Button type="text" size="small" icon={<SwapOutlined />} onClick={() => convertToSales(record)} style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
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
    { key: 'sent', label: `발송 (${stats.sent})` },
    { key: 'accepted', label: `승인 (${stats.accepted})` },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: isDark ? '#fff' : undefined }}>
          <SolutionOutlined style={{ marginRight: 8, color: '#9254de' }} />
          견적서 관리
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          {!isMobile && '견적서 작성'}
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
            <Statistic title="발송완료" value={stats.sent} suffix="건" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="승인" value={stats.accepted} suffix="건" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="총 금액" value={stats.totalAmount} formatter={(val) => formatCurrency(val as number)} valueStyle={{ color: '#1890ff', fontSize: isMobile ? 16 : 20 }} />
          </Card>
        </Col>
      </Row>

      {/* 필터 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            style={{ width: isMobile ? '100%' : 240 }}
          />
          <Input
            placeholder="견적번호, 거래처명 검색"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: isMobile ? '100%' : 200 }}
            allowClear
          />
        </Space>
      </Card>

      {/* 테이블 */}
      <Card size="small">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        <Table
          columns={columns}
          dataSource={filteredQuotations}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `총 ${total}건` }}
          scroll={{ x: 800 }}
          size={isMobile ? 'small' : 'middle'}
        />
      </Card>

      {/* 견적서 작성 모달 */}
      <Modal
        title={editingQuotation ? '견적서 수정' : '견적서 작성'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        width={1000}
        okText="저장"
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="quotationDate" label="견적일" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="validUntil" label="유효기간" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="customerId" label="거래처" rules={[{ required: true }]}>
                <Select placeholder="거래처 선택" showSearch optionFilterProp="children">
                  {(customers || []).map((c) => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>품목 목록</Divider>

          {(quotationItems || []).map((item, index) => (
            <Row gutter={8} key={index} style={{ marginBottom: 8 }}>
              <Col xs={24} sm={6}>
                <Select
                  placeholder="품목 선택"
                  value={item.productId || undefined}
                  onChange={(val) => handleProductSelect(index, val)}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                >
                  {(products || []).map((p) => (
                    <Option key={p.id} value={p.id}>{p.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={8} sm={3}>
                <Input value={item.spec} placeholder="규격" readOnly />
              </Col>
              <Col xs={8} sm={3}>
                <InputNumber
                  value={item.quantity}
                  onChange={(val) => calculateItemAmount(index, 'quantity', val || 0)}
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="수량"
                />
              </Col>
              <Col xs={8} sm={4}>
                <InputNumber
                  value={item.unitPrice}
                  onChange={(val) => calculateItemAmount(index, 'unitPrice', val || 0)}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v?.replace(/,/g, '') as any}
                  style={{ width: '100%' }}
                  placeholder="단가"
                />
              </Col>
              <Col xs={12} sm={4}>
                <InputNumber value={item.supplyAmount} readOnly style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Col>
              <Col xs={10} sm={3}>
                <InputNumber value={item.totalAmount} readOnly style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Col>
              <Col xs={2} sm={1}>
                <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => removeItem(index)} disabled={quotationItems.length === 1} />
              </Col>
            </Row>
          ))}

          <Button type="dashed" onClick={addItem} block icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
            품목 추가
          </Button>

          <Row gutter={16} style={{ background: isDark ? '#1f1f1f' : '#fafafa', padding: 16, borderRadius: 8 }}>
            <Col span={8}><Text>공급가액: <Text strong>{formatCurrency(totals.supplyAmount)}</Text></Text></Col>
            <Col span={8}><Text>세액: <Text strong>{formatCurrency(totals.vatAmount)}</Text></Text></Col>
            <Col span={8}><Text>합계: <Text strong style={{ color: '#1890ff', fontSize: 18 }}>{formatCurrency(totals.totalAmount)}</Text></Text></Col>
          </Row>

          <Form.Item name="memo" label="비고" style={{ marginTop: 16 }}>
            <TextArea rows={2} placeholder="비고 사항" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 상세보기 모달 */}
      <Modal
        title="견적서 상세"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => setPrintModalVisible(true)}>인쇄</Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>닫기</Button>,
        ]}
        width={800}
      >
        {selectedQuotation && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}><Text type="secondary">견적번호</Text><div><Text strong>{selectedQuotation.quotationNumber}</Text></div></Col>
              <Col span={8}><Text type="secondary">견적일</Text><div><Text strong>{dayjs(selectedQuotation.quotationDate).format('YYYY-MM-DD')}</Text></div></Col>
              <Col span={8}><Text type="secondary">유효기간</Text><div><Text strong>{dayjs(selectedQuotation.validUntil).format('YYYY-MM-DD')}</Text></div></Col>
              <Col span={12}><Text type="secondary">거래처</Text><div><Text strong>{selectedQuotation.customer?.name}</Text></div></Col>
              <Col span={12}><Text type="secondary">상태</Text><div>{renderStatusTag(selectedQuotation.status)}</div></Col>
            </Row>
            <Divider />
            <Table
              dataSource={selectedQuotation.items}
              columns={[
                { title: '품목명', dataIndex: 'productName', key: 'productName' },
                { title: '규격', dataIndex: 'spec', key: 'spec' },
                { title: '수량', dataIndex: 'quantity', key: 'quantity', align: 'right' },
                { title: '단가', dataIndex: 'unitPrice', key: 'unitPrice', align: 'right', render: (v: number) => formatCurrency(v) },
                { title: '금액', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: (v: number) => formatCurrency(v) },
              ]}
              pagination={false}
              size="small"
              rowKey="productId"
            />
            <Row gutter={16} style={{ marginTop: 16, textAlign: 'right' }}>
              <Col span={24}>
                <Text style={{ marginRight: 24 }}>공급가액: <Text strong>{formatCurrency(selectedQuotation.supplyAmount)}</Text></Text>
                <Text style={{ marginRight: 24 }}>세액: <Text strong>{formatCurrency(selectedQuotation.vatAmount)}</Text></Text>
                <Text>합계: <Text strong style={{ color: '#1890ff', fontSize: 20 }}>{formatCurrency(selectedQuotation.totalAmount)}</Text></Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* 인쇄 모달 */}
      <QuotationPrint
        open={printModalVisible}
        onClose={() => setPrintModalVisible(false)}
        data={selectedQuotation ? {
          quotationNumber: selectedQuotation.quotationNumber,
          quotationDate: selectedQuotation.quotationDate,
          validUntil: selectedQuotation.validUntil,
          supplier: {
            companyName: currentBusiness?.companyName || '',
            businessNumber: currentBusiness?.businessNumber || '',
            representative: currentBusiness?.representative || '',
            address: currentBusiness?.address || '',
            phone: currentBusiness?.phone || '',
          },
          receiver: {
            companyName: selectedQuotation.customer?.name || '',
            representative: selectedQuotation.customer?.representative || '',
            phone: selectedQuotation.customer?.phone || '',
          },
          items: (selectedQuotation.items || []).map(item => ({
            productName: item.productName,
            spec: item.spec,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            supplyAmount: item.supplyAmount,
            vatAmount: item.vatAmount,
            totalAmount: item.totalAmount,
          })),
          supplyAmount: selectedQuotation.supplyAmount,
          vatAmount: selectedQuotation.vatAmount,
          totalAmount: selectedQuotation.totalAmount,
          memo: selectedQuotation.memo,
        } : null}
      />
    </div>
  );
};

export default QuotationManagement;
