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
  Statistic,
  Popconfirm,
  Divider,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
  PrinterOutlined,
  SolutionOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { quotationAPI } from '../../utils/api';
import dayjs from 'dayjs';
import { useMessage } from '../../hooks/useMessage';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import QuotationPrint from '../Print/QuotationPrint';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  taxType: 'exempt' | 'vat_included' | 'vat_separate';
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
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([
    { productId: 0, productCode: '', productName: '', spec: '', unit: '', quantity: 1, unitPrice: 0, supplyAmount: 0, vatAmount: 0, totalAmount: 0, taxType: 'vat_separate' }
  ]);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [autoSaveType, setAutoSaveType] = useState<'pdf' | 'png' | 'jpg' | 'clipboard' | null>(null);
  const [nextNumber, setNextNumber] = useState('');

  // 데이터 로드
  const fetchData = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const quotationRes = await quotationAPI.getAll(currentBusiness.id);
      if (quotationRes.data.success) {
        const data = quotationRes.data.data;
        setQuotations(Array.isArray(data) ? data.map((q: any) => ({
          ...q,
          items: (q.items || []).map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productCode: item.product?.productCode || '',
            productName: item.itemName,
            spec: item.specification,
            unit: item.unit,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            supplyAmount: Number(item.supplyAmount),
            vatAmount: Number(item.vatAmount),
            totalAmount: Number(item.supplyAmount) + Number(item.vatAmount),
            memo: item.remark,
            taxType: 'vat_separate' as const,
          })),
        })) : []);
      }
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

  // 통계
  const stats = useMemo(() => {
    return {
      total: quotations.length,
      totalAmount: quotations.reduce((sum, q) => sum + Number(q.totalAmount), 0),
    };
  }, [quotations]);

  // 필터링된 데이터
  const filteredQuotations = useMemo(() => {
    let result = [...quotations];
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(q =>
        q.quotationNumber.toLowerCase().includes(search)
      );
    }
    return result;
  }, [quotations, searchText]);

  // 품목 금액 계산
  const calculateItemAmount = (index: number, field: string, value: number | string) => {
    const newItems = [...quotationItems];
    const item = newItems[index];

    if (field === 'quantity') item.quantity = value as number;
    if (field === 'unitPrice') item.unitPrice = value as number;
    if (field === 'taxType') item.taxType = value as 'exempt' | 'vat_included' | 'vat_separate';

    const totalPrice = item.quantity * item.unitPrice;
    if (item.taxType === 'exempt') {
      item.supplyAmount = totalPrice;
      item.vatAmount = 0;
    } else if (item.taxType === 'vat_included') {
      item.supplyAmount = Math.round(totalPrice / 1.1);
      item.vatAmount = totalPrice - item.supplyAmount;
    } else {
      item.supplyAmount = totalPrice;
      item.vatAmount = Math.round(totalPrice * 0.1);
    }
    item.totalAmount = item.supplyAmount + item.vatAmount;

    setQuotationItems(newItems);
  };

  // 품목 추가
  const addItem = () => {
    setQuotationItems([...quotationItems, {
      productId: 0, productCode: '', productName: '', spec: '', unit: '',
      quantity: 1, unitPrice: 0, supplyAmount: 0, vatAmount: 0, totalAmount: 0, taxType: 'vat_separate'
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
  const openModal = async (quotation?: Quotation) => {
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
      // 새 견적번호 조회
      if (currentBusiness) {
        try {
          const res = await quotationAPI.getNextNumber(currentBusiness.id);
          if (res.data.success) {
            setNextNumber(res.data.data.quotationNumber);
          }
        } catch (e) {
          console.error('견적번호 조회 오류:', e);
        }
      }
      form.setFieldsValue({
        quotationDate: dayjs(),
        validUntil: dayjs().add(1, 'month'),
        status: 'draft',
      });
      setQuotationItems([{ productId: 0, productCode: '', productName: '', spec: '', unit: '', quantity: 1, unitPrice: 0, supplyAmount: 0, vatAmount: 0, totalAmount: 0, taxType: 'vat_separate' }]);
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
    if (!currentBusiness) return;
    try {
      const values = await form.validateFields();
      const payload = {
        quotationNumber: editingQuotation ? editingQuotation.quotationNumber : nextNumber,
        quotationDate: values.quotationDate.format('YYYY-MM-DD'),
        validUntil: values.validUntil.format('YYYY-MM-DD'),
        customerId: null,
        supplyAmount: totals.supplyAmount,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        memo: values.memo || '',
        paymentTerms: values.paymentTerms || '',
        deliveryTerms: values.deliveryTerms || '',
        status: 'draft',
        items: quotationItems.filter(item => item.productId || item.productName).map(item => ({
          productId: item.productId || null,
          itemName: item.productName,
          specification: item.spec || '',
          unit: item.unit || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          supplyAmount: item.supplyAmount,
          vatAmount: item.vatAmount,
          remark: item.memo || '',
        })),
      };
      if (editingQuotation) {
        await quotationAPI.update(currentBusiness.id, editingQuotation.id, payload);
        message.success('견적서가 수정되었습니다.');
      } else {
        await quotationAPI.create(currentBusiness.id, payload);
        message.success('견적서가 생성되었습니다.');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('저장 오류:', error);
      message.error('저장에 실패했습니다.');
    }
  };

  // 삭제
  const handleDelete = async (id: number) => {
    if (!currentBusiness) return;
    try {
      await quotationAPI.delete(currentBusiness.id, id);
      message.success('견적서가 삭제되었습니다.');
      fetchData();
    } catch (error) {
      console.error('삭제 오류:', error);
      message.error('삭제에 실패했습니다.');
    }
  };

  // 금액 포맷
  const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원';


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
        <Col xs={12} sm={12}>
          <Card size="small">
            <Statistic title="전체" value={stats.total} suffix="건" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12}>
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
          <Dropdown
            menu={{
              items: [
                { key: 'pdf', label: 'PDF 저장', icon: <FilePdfOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('저장할 항목을 선택해주세요.'); return; }
                  const selected = filteredQuotations.find(q => q.id === selectedRowKeys[0]);
                  if (selected) { setSelectedQuotation(selected); setAutoSaveType('pdf'); setPrintModalVisible(true); }
                }},
                { key: 'png', label: 'PNG 저장', icon: <FileImageOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('저장할 항목을 선택해주세요.'); return; }
                  const selected = filteredQuotations.find(q => q.id === selectedRowKeys[0]);
                  if (selected) { setSelectedQuotation(selected); setAutoSaveType('png'); setPrintModalVisible(true); }
                }},
                { key: 'jpg', label: 'JPG 저장', icon: <FileImageOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('저장할 항목을 선택해주세요.'); return; }
                  const selected = filteredQuotations.find(q => q.id === selectedRowKeys[0]);
                  if (selected) { setSelectedQuotation(selected); setAutoSaveType('jpg'); setPrintModalVisible(true); }
                }},
                { key: 'clipboard', label: '클립보드 복사', icon: <CopyOutlined />, onClick: () => {
                  if (selectedRowKeys.length === 0) { message.warning('복사할 항목을 선택해주세요.'); return; }
                  const selected = filteredQuotations.find(q => q.id === selectedRowKeys[0]);
                  if (selected) { setSelectedQuotation(selected); setAutoSaveType('clipboard'); setPrintModalVisible(true); }
                }},
              ]
            }}
          >
            <Button icon={<DownloadOutlined />}>저장</Button>
          </Dropdown>
          <Popconfirm
            title={<span style={{ fontSize: 16, fontWeight: 600 }}>선택한 항목을 삭제하시겠습니까?</span>}
            description={<span style={{ fontSize: 14 }}>{selectedRowKeys.length}건의 견적서가 삭제됩니다.</span>}
            onConfirm={async () => {
              if (selectedRowKeys.length === 0) {
                message.warning('삭제할 항목을 선택해주세요.');
                return;
              }
              if (!currentBusiness) return;
              try {
                await Promise.all(selectedRowKeys.map(id => quotationAPI.delete(currentBusiness.id, id as number)));
                message.success(`${selectedRowKeys.length}건의 견적서가 삭제되었습니다.`);
                setSelectedRowKeys([]);
                fetchData();
              } catch (error) {
                console.error('삭제 오류:', error);
                message.error('삭제에 실패했습니다.');
              }
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
            icon={<EditOutlined />}
            disabled={selectedRowKeys.length !== 1}
            onClick={() => {
              if (selectedRowKeys.length !== 1) {
                message.warning('수정할 항목을 1개 선택해주세요.');
                return;
              }
              const selected = filteredQuotations.find(q => q.id === selectedRowKeys[0]);
              if (selected) {
                openModal(selected);
              }
            }}
          >
            수정
          </Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={() => {
              if (selectedRowKeys.length === 0) {
                message.warning('인쇄할 항목을 선택해주세요.');
                return;
              }
              const selected = filteredQuotations.find(q => q.id === selectedRowKeys[0]);
              if (selected) {
                setSelectedQuotation(selected);
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
        <Table
          columns={columns}
          dataSource={filteredQuotations}
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
            onDoubleClick: () => {
              openModal(record);
            },
            style: { cursor: 'pointer' }
          })}
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
              <Form.Item name="customerName" label="거래처">
                <Input placeholder="거래처명 입력" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>품목 목록</Divider>

          {/* 헤더 */}
          <Row gutter={4} style={{ marginBottom: 8, fontWeight: 'bold', fontSize: 12, color: isDark ? '#aaa' : '#666' }}>
            <Col span={4}>품목</Col>
            <Col span={2}>규격</Col>
            <Col span={2}>단위</Col>
            <Col span={2}>수량</Col>
            <Col span={3}>단가</Col>
            <Col span={3}>공급가액</Col>
            <Col span={2}>세액</Col>
            <Col span={3}>합계</Col>
            <Col span={2}>면과세</Col>
            <Col span={1}></Col>
          </Row>
          {(quotationItems || []).map((item, index) => (
            <Row gutter={4} key={index} style={{ marginBottom: 8 }}>
              <Col span={4}>
                <Input
                  placeholder="품목명"
                  value={item.productName}
                  onChange={(e) => {
                    const newItems = [...quotationItems];
                    newItems[index].productName = e.target.value;
                    setQuotationItems(newItems);
                  }}
                  size="small"
                />
              </Col>
              <Col span={2}>
                <Input
                  value={item.spec}
                  placeholder="규격"
                  onChange={(e) => {
                    const newItems = [...quotationItems];
                    newItems[index].spec = e.target.value;
                    setQuotationItems(newItems);
                  }}
                  size="small"
                />
              </Col>
              <Col span={2}>
                <Input
                  value={item.unit}
                  placeholder="단위"
                  onChange={(e) => {
                    const newItems = [...quotationItems];
                    newItems[index].unit = e.target.value;
                    setQuotationItems(newItems);
                  }}
                  size="small"
                />
              </Col>
              <Col span={2}>
                <InputNumber
                  value={item.quantity}
                  onChange={(val) => calculateItemAmount(index, 'quantity', val || 0)}
                  min={1}
                  style={{ width: '100%' }}
                  size="small"
                />
              </Col>
              <Col span={3}>
                <InputNumber
                  value={item.unitPrice}
                  onChange={(val) => calculateItemAmount(index, 'unitPrice', val || 0)}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v?.replace(/,/g, '') as any}
                  style={{ width: '100%' }}
                  size="small"
                />
              </Col>
              <Col span={3}>
                <InputNumber value={item.supplyAmount} readOnly style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} size="small" />
              </Col>
              <Col span={2}>
                <InputNumber value={item.vatAmount} readOnly style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} size="small" />
              </Col>
              <Col span={3}>
                <InputNumber value={item.totalAmount} readOnly style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} size="small" />
              </Col>
              <Col span={2}>
                <Select
                  value={item.taxType}
                  onChange={(val) => calculateItemAmount(index, 'taxType', val)}
                  style={{ width: '100%' }}
                  size="small"
                  popupMatchSelectWidth={false}
                >
                  <Option value="exempt">면세</Option>
                  <Option value="vat_included">과세(포함)</Option>
                  <Option value="vat_separate">과세(별도)</Option>
                </Select>
              </Col>
              <Col span={1}>
                <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => removeItem(index)} disabled={quotationItems.length === 1} size="small" />
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
              <Col span={24}><Text type="secondary">거래처</Text><div><Text strong>{selectedQuotation.customer?.name || '-'}</Text></div></Col>
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
        onClose={() => { setPrintModalVisible(false); setAutoSaveType(null); }}
        autoSaveType={autoSaveType}
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
            sealImage: currentBusiness?.sealImage,
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
