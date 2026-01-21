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
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  PrinterOutlined,
  FileDoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SwapOutlined,
  MinusCircleOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { customerAPI, productAPI } from '../../utils/api';
import dayjs from 'dayjs';
import { useMessage } from '../../hooks/useMessage';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import PurchaseOrderPrint from '../Print/PurchaseOrderPrint';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

interface Customer {
  id: number;
  customerCode: string;
  name: string;
  businessNumber?: string;
  phone?: string;
  email?: string;
}

interface Product {
  id: number;
  productCode: string;
  name: string;
  spec?: string;
  unit?: string;
  buyPrice?: number;
}

interface PurchaseOrderItem {
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
}

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  deliveryDate: string;
  status: 'draft' | 'ordered' | 'partial' | 'completed' | 'cancelled';
  supplierId: number;
  supplier?: Customer;
  items: PurchaseOrderItem[];
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  memo?: string;
  createdAt: string;
}

const PurchaseOrderManagement: React.FC = () => {
  const message = useMessage();
  const { isMobile } = useMediaQuery();
  const { currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([
    { productId: 0, productCode: '', productName: '', spec: '', unit: '', quantity: 1, unitPrice: 0, supplyAmount: 0, vatAmount: 0, totalAmount: 0 }
  ]);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [autoSaveType, setAutoSaveType] = useState<'pdf' | 'png' | 'jpg' | 'clipboard' | null>(null);

  // 샘플 데이터
  const [sampleOrders] = useState<PurchaseOrder[]>([
    {
      id: 1,
      orderNumber: 'PO-2026-0001',
      orderDate: '2026-01-10',
      deliveryDate: '2026-01-20',
      status: 'ordered',
      supplierId: 1,
      supplier: { id: 1, customerCode: 'S001', name: '(주)공급업체A', businessNumber: '111-22-33333' },
      items: [
        { productId: 1, productCode: 'P001', productName: '원자재A', spec: 'KG', unit: 'KG', quantity: 100, unitPrice: 5000, supplyAmount: 500000, vatAmount: 50000, totalAmount: 550000 }
      ],
      supplyAmount: 500000,
      vatAmount: 50000,
      totalAmount: 550000,
      createdAt: '2026-01-10',
    },
    {
      id: 2,
      orderNumber: 'PO-2026-0002',
      orderDate: '2026-01-15',
      deliveryDate: '2026-01-25',
      status: 'completed',
      supplierId: 2,
      supplier: { id: 2, customerCode: 'S002', name: '(주)공급업체B', businessNumber: '222-33-44444' },
      items: [
        { productId: 2, productCode: 'P002', productName: '원자재B', spec: 'BOX', unit: 'BOX', quantity: 50, unitPrice: 20000, supplyAmount: 1000000, vatAmount: 100000, totalAmount: 1100000 }
      ],
      supplyAmount: 1000000,
      vatAmount: 100000,
      totalAmount: 1100000,
      createdAt: '2026-01-15',
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
        setSuppliers(Array.isArray(data) ? data : []);
      }
      if (productRes.data.success) {
        const data = productRes.data.data;
        setProducts(Array.isArray(data) ? data : []);
      }
      setOrders(sampleOrders);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, message, sampleOrders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 통계
  const stats = useMemo(() => {
    return {
      total: orders.length,
      draft: orders.filter(o => o.status === 'draft').length,
      ordered: orders.filter(o => o.status === 'ordered').length,
      completed: orders.filter(o => o.status === 'completed').length,
      totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  }, [orders]);

  // 필터링
  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (activeTab !== 'all') {
      result = result.filter(o => o.status === activeTab);
    }
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(search) ||
        o.supplier?.name.toLowerCase().includes(search)
      );
    }
    return result;
  }, [orders, activeTab, searchText]);

  // 금액 계산
  const calculateItemAmount = (index: number, field: string, value: number) => {
    const newItems = [...orderItems];
    const item = newItems[index];
    if (field === 'quantity') item.quantity = value;
    if (field === 'unitPrice') item.unitPrice = value;
    item.supplyAmount = item.quantity * item.unitPrice;
    item.vatAmount = Math.round(item.supplyAmount * 0.1);
    item.totalAmount = item.supplyAmount + item.vatAmount;
    setOrderItems(newItems);
  };

  // 품목 추가/삭제
  const addItem = () => {
    setOrderItems([...orderItems, { productId: 0, productCode: '', productName: '', spec: '', unit: '', quantity: 1, unitPrice: 0, supplyAmount: 0, vatAmount: 0, totalAmount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  // 품목 선택
  const handleProductSelect = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...orderItems];
      newItems[index] = {
        ...newItems[index],
        productId: product.id,
        productCode: product.productCode,
        productName: product.name,
        spec: product.spec || '',
        unit: product.unit || '',
        unitPrice: product.buyPrice || 0,
      };
      calculateItemAmount(index, 'unitPrice', product.buyPrice || 0);
    }
  };

  // 모달 열기
  const openModal = (order?: PurchaseOrder) => {
    if (order) {
      setEditingOrder(order);
      form.setFieldsValue({
        ...order,
        orderDate: dayjs(order.orderDate),
        deliveryDate: dayjs(order.deliveryDate),
      });
      setOrderItems(order.items);
    } else {
      setEditingOrder(null);
      form.resetFields();
      form.setFieldsValue({
        orderDate: dayjs(),
        deliveryDate: dayjs().add(7, 'day'),
        status: 'draft',
      });
      setOrderItems([{ productId: 0, productCode: '', productName: '', spec: '', unit: '', quantity: 1, unitPrice: 0, supplyAmount: 0, vatAmount: 0, totalAmount: 0 }]);
    }
    setModalVisible(true);
  };

  // 상세보기
  const openDetail = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  // 저장
  const handleSave = async () => {
    try {
      await form.validateFields();
      message.success(editingOrder ? '발주서가 수정되었습니다.' : '발주서가 생성되었습니다.');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };

  // 매입 전환
  const convertToPurchase = async (order: PurchaseOrder) => {
    message.success('발주서가 매입으로 전환되었습니다.');
    fetchData();
  };

  // 삭제
  const handleDelete = async (id: number) => {
    message.success('발주서가 삭제되었습니다.');
    fetchData();
  };

  // 금액 포맷
  const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원';

  // 상태 태그
  const renderStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '임시저장' },
      ordered: { color: 'blue', text: '발주완료' },
      partial: { color: 'orange', text: '부분입고' },
      completed: { color: 'green', text: '입고완료' },
      cancelled: { color: 'red', text: '취소' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 합계
  const totals = useMemo(() => {
    return orderItems.reduce((acc, item) => ({
      supplyAmount: acc.supplyAmount + item.supplyAmount,
      vatAmount: acc.vatAmount + item.vatAmount,
      totalAmount: acc.totalAmount + item.totalAmount,
    }), { supplyAmount: 0, vatAmount: 0, totalAmount: 0 });
  }, [orderItems]);

  // 테이블 컬럼
  const columns = [
    {
      title: '발주번호',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 130,
      render: (text: string, record: PurchaseOrder) => (
        <a onClick={() => openDetail(record)}>{text}</a>
      ),
    },
    {
      title: '발주일',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '납기일',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 110,
      responsive: ['md'] as any,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '공급업체',
      dataIndex: ['supplier', 'name'],
      key: 'supplierName',
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
      width: 150,
      render: (_: any, record: PurchaseOrder) => (
        <Space size="small">
          <Tooltip title="상세보기">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Tooltip title="수정">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openModal(record)} />
          </Tooltip>
          {record.status === 'ordered' && (
            <Tooltip title="매입전환">
              <Button type="text" size="small" icon={<SwapOutlined />} onClick={() => convertToPurchase(record)} style={{ color: '#52c41a' }} />
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
    { key: 'ordered', label: `발주완료 (${stats.ordered})` },
    { key: 'completed', label: `입고완료 (${stats.completed})` },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: isDark ? '#fff' : undefined }}>
          <FileDoneOutlined style={{ marginRight: 8, color: '#ff7a45' }} />
          발주서 관리
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          {!isMobile && '발주서 작성'}
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
            <Statistic title="발주완료" value={stats.ordered} suffix="건" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="입고완료" value={stats.completed} suffix="건" valueStyle={{ color: '#52c41a' }} />
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
            placeholder="발주번호, 공급업체 검색"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: isMobile ? '100%' : 200 }}
            allowClear
          />
          <Dropdown
            menu={{
              items: [
                { key: 'pdf', label: 'PDF 저장', icon: <FilePdfOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('저장할 항목을 선택해주세요.'); return; }
                  const selected = filteredOrders.find(o => o.id === selectedRowKeys[0]);
                  if (selected) { setSelectedOrder(selected); setAutoSaveType('pdf'); setPrintModalVisible(true); }
                }},
                { key: 'png', label: 'PNG 저장', icon: <FileImageOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('저장할 항목을 선택해주세요.'); return; }
                  const selected = filteredOrders.find(o => o.id === selectedRowKeys[0]);
                  if (selected) { setSelectedOrder(selected); setAutoSaveType('png'); setPrintModalVisible(true); }
                }},
                { key: 'jpg', label: 'JPG 저장', icon: <FileImageOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('저장할 항목을 선택해주세요.'); return; }
                  const selected = filteredOrders.find(o => o.id === selectedRowKeys[0]);
                  if (selected) { setSelectedOrder(selected); setAutoSaveType('jpg'); setPrintModalVisible(true); }
                }},
                { key: 'clipboard', label: '클립보드 복사', icon: <CopyOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('복사할 항목을 선택해주세요.'); return; }
                  const selected = filteredOrders.find(o => o.id === selectedRowKeys[0]);
                  if (selected) { setSelectedOrder(selected); setAutoSaveType('clipboard'); setPrintModalVisible(true); }
                }},
              ]
            }}
          >
            <Button icon={<DownloadOutlined />}>저장</Button>
          </Dropdown>
          <Popconfirm
            title={<span style={{ fontSize: 16, fontWeight: 600 }}>선택한 항목을 삭제하시겠습니까?</span>}
            description={<span style={{ fontSize: 14 }}>{selectedRowKeys.length}건의 발주서가 삭제됩니다.</span>}
            onConfirm={() => {
              if (selectedRowKeys.length === 0) {
                message.warning('삭제할 항목을 선택해주세요.');
                return;
              }
              // TODO: 실제 API 연동 시 bulk delete 구현
              message.success(`${selectedRowKeys.length}건의 발주서가 삭제되었습니다.`);
              setSelectedRowKeys([]);
              fetchData();
            }}
            okText="삭제"
            cancelText="취소"
            disabled={selectedRowKeys.length === 0}
            okButtonProps={{ autoFocus: true, size: 'middle' }}
            cancelButtonProps={{ size: 'middle' }}
            overlayStyle={{ minWidth: 280 }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
            >
              선택삭제 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => {
              if (selectedRowKeys.length === 0) {
                message.warning('인쇄할 항목을 선택해주세요.');
                return;
              }
              const selected = filteredOrders.find(o => o.id === selectedRowKeys[0]);
              if (selected) {
                setSelectedOrder(selected);
                setPrintModalVisible(true);
              }
            }}
          >
            인쇄
          </Button>
        </Space>
      </Card>

      {/* 테이블 */}
      <Card size="small">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        <Table
          columns={columns}
          dataSource={filteredOrders}
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
          pagination={{ pageSize: 10, showTotal: (total) => `총 ${total}건` }}
          scroll={{ x: 800 }}
          size={isMobile ? 'small' : 'middle'}
        />
      </Card>

      {/* 발주서 작성 모달 */}
      <Modal
        title={editingOrder ? '발주서 수정' : '발주서 작성'}
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
              <Form.Item name="orderDate" label="발주일" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="deliveryDate" label="납기일" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="supplierId" label="공급업체" rules={[{ required: true }]}>
                <Select placeholder="공급업체 선택" showSearch optionFilterProp="children">
                  {(suppliers || []).map((s) => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>품목 목록</Divider>

          {(orderItems || []).map((item, index) => (
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
                <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => removeItem(index)} disabled={orderItems.length === 1} />
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
        title="발주서 상세"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => setPrintModalVisible(true)}>인쇄</Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>닫기</Button>,
        ]}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}><Text type="secondary">발주번호</Text><div><Text strong>{selectedOrder.orderNumber}</Text></div></Col>
              <Col span={8}><Text type="secondary">발주일</Text><div><Text strong>{dayjs(selectedOrder.orderDate).format('YYYY-MM-DD')}</Text></div></Col>
              <Col span={8}><Text type="secondary">납기일</Text><div><Text strong>{dayjs(selectedOrder.deliveryDate).format('YYYY-MM-DD')}</Text></div></Col>
              <Col span={12}><Text type="secondary">공급업체</Text><div><Text strong>{selectedOrder.supplier?.name}</Text></div></Col>
              <Col span={12}><Text type="secondary">상태</Text><div>{renderStatusTag(selectedOrder.status)}</div></Col>
            </Row>
            <Divider />
            <Table
              dataSource={selectedOrder.items}
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
                <Text style={{ marginRight: 24 }}>공급가액: <Text strong>{formatCurrency(selectedOrder.supplyAmount)}</Text></Text>
                <Text style={{ marginRight: 24 }}>세액: <Text strong>{formatCurrency(selectedOrder.vatAmount)}</Text></Text>
                <Text>합계: <Text strong style={{ color: '#1890ff', fontSize: 20 }}>{formatCurrency(selectedOrder.totalAmount)}</Text></Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* 인쇄 모달 */}
      <PurchaseOrderPrint
        open={printModalVisible}
        onClose={() => { setPrintModalVisible(false); setAutoSaveType(null); }}
        autoSaveType={autoSaveType}
        data={selectedOrder ? {
          orderNumber: selectedOrder.orderNumber,
          orderDate: selectedOrder.orderDate,
          deliveryDate: selectedOrder.deliveryDate,
          buyer: {
            companyName: currentBusiness?.companyName || '',
            businessNumber: currentBusiness?.businessNumber || '',
            representative: currentBusiness?.representative || '',
            address: currentBusiness?.address || '',
            phone: currentBusiness?.phone || '',
            sealImage: currentBusiness?.sealImage,
          },
          supplier: {
            companyName: selectedOrder.supplier?.name || '',
            businessNumber: selectedOrder.supplier?.businessNumber || '',
            phone: selectedOrder.supplier?.phone || '',
          },
          items: (selectedOrder.items || []).map(item => ({
            productName: item.productName,
            spec: item.spec,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            supplyAmount: item.supplyAmount,
            vatAmount: item.vatAmount,
            totalAmount: item.totalAmount,
          })),
          supplyAmount: selectedOrder.supplyAmount,
          vatAmount: selectedOrder.vatAmount,
          totalAmount: selectedOrder.totalAmount,
          memo: selectedOrder.memo,
        } : null}
      />
    </div>
  );
};

export default PurchaseOrderManagement;
