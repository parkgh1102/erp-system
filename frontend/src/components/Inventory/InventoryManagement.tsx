import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message, Card, Row, Col, Statistic, Tag, Dropdown } from 'antd';
import { SearchOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons';
import { createExportMenuItems } from '../../utils/exportUtils';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { productAPI } from '../../utils/api';

interface Product {
  id: number;
  productCode: string;
  name: string;
  spec?: string;
  unit?: string;
  buyPrice?: number;
  sellPrice?: number;
  currentStock?: number;
  category?: string;
  taxType: string;
  memo?: string;
  businessId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const InventoryManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(window.innerWidth <= 768 ? 10 : 20);
  const { currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (currentBusiness) {
      fetchProducts();
    }
  }, [currentBusiness]);

  const fetchProducts = async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      const response = await productAPI.getAll(currentBusiness.id, { page: 1, limit: 10000 });
      const productList = response.data.data.products || response.data.data || [];
      setProducts(productList);
    } catch (error) {
      message.error('재고 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 필터링
  const filteredProducts = products.filter(product => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.productCode?.toLowerCase().includes(searchLower) ||
      product.spec?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower)
    );
  });

  // 통계 계산
  const totalProducts = filteredProducts.length;
  const totalStock = filteredProducts.reduce((sum, p) => sum + (p.currentStock || 0), 0);
  const lowStockCount = filteredProducts.filter(p => (p.currentStock || 0) < 10).length;

  const columns = [
    {
      title: '품목코드',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
      sorter: (a: Product, b: Product) => (a.productCode || '').localeCompare(b.productCode || ''),
    },
    {
      title: '품목명',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a: Product, b: Product) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: '규격',
      dataIndex: 'spec',
      key: 'spec',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '단위',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      render: (text: string) => text || 'EA',
    },
    {
      title: '현재고',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      align: 'right' as const,
      sorter: (a: Product, b: Product) => (a.currentStock || 0) - (b.currentStock || 0),
      render: (stock: number) => {
        const value = stock || 0;
        let color = 'default';
        if (value <= 0) color = 'red';
        else if (value < 10) color = 'orange';
        else if (value >= 100) color = 'green';
        return <Tag color={color}>{value.toLocaleString()}</Tag>;
      },
    },
    {
      title: '매입단가',
      dataIndex: 'buyPrice',
      key: 'buyPrice',
      width: 120,
      align: 'right' as const,
      render: (price: number | null | undefined) => {
        if (price === null || price === undefined) return '-';
        return `${Math.floor(price).toLocaleString()}원`;
      },
    },
    {
      title: '매출단가',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      width: 120,
      align: 'right' as const,
      render: (price: number | null | undefined) => {
        if (price === null || price === undefined) return '-';
        return `${Math.floor(price).toLocaleString()}원`;
      },
    },
    {
      title: '재고금액(매입가)',
      key: 'stockValue',
      width: 150,
      align: 'right' as const,
      render: (_: any, record: Product) => {
        // 매입단가가 null/undefined인 경우 재고금액도 계산 불가
        if (record.buyPrice === null || record.buyPrice === undefined) return '-';
        const value = (record.currentStock || 0) * record.buyPrice;
        return `${Math.floor(value).toLocaleString()}원`;
      },
    },
    {
      title: '분류',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '세금구분',
      dataIndex: 'taxType',
      key: 'taxType',
      width: 110,
      render: (taxType: string) => {
        switch (taxType) {
          case 'tax_separate': return '과세 10%별도';
          case 'tax_inclusive': return '과세 10%포함';
          case 'tax_free': return '면세';
          default: return '-';
        }
      },
    },
  ];

  // 파일저장 드롭다운 메뉴
  const actionMenuItems = createExportMenuItems(
    filteredProducts,
    columns,
    '재고현황_목록',
    'inventory-table'
  );

  return (
    <div style={{ padding: window.innerWidth <= 768 ? '12px' : '24px' }}>
      <h2 style={{ marginBottom: 16 }}>재고관리</h2>

      {/* 통계 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="총 품목 수"
              value={totalProducts}
              suffix="개"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="총 재고 수량"
              value={totalStock}
              suffix="개"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="재고 부족 품목"
              value={lowStockCount}
              suffix="개"
              valueStyle={{ color: lowStockCount > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 검색 및 버튼 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="품목명, 품목코드, 규격, 분류 검색"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={16}>
          <Space wrap>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchProducts}
              loading={loading}
            >
              조회
            </Button>
            <Dropdown menu={{ items: actionMenuItems }} placement="bottomRight">
              <Button
                icon={<ExportOutlined />}
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}
              >
                파일저장
              </Button>
            </Dropdown>
          </Space>
        </Col>
      </Row>

      {/* 재고 테이블 */}
      <Table
        id="inventory-table"
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onShowSizeChange: (_, size) => setPageSize(size),
          showTotal: (total) => `총 ${total}개`,
        }}
        scroll={{ x: 1200 }}
        size={window.innerWidth <= 768 ? 'small' : 'middle'}
        style={{
          backgroundColor: isDark ? '#1f1f1f' : '#fff',
        }}
      />
    </div>
  );
};

export default InventoryManagement;
