import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Space, message, Popconfirm, Radio, Row, Col, AutoComplete, Spin, Dropdown, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, FileExcelOutlined, FilePdfOutlined, SearchOutlined, ExportOutlined, ImportOutlined, CloseOutlined } from '@ant-design/icons';
import ExcelUploadModal from '../Common/ExcelUploadModal';
import { createExportMenuItems } from '../../utils/exportUtils';
import ProductPrintModal from '../Print/ProductPrintModal';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { productAPI } from '../../utils/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface Product {
  id: number;
  productCode: string;
  name: string;
  spec?: string;
  unit?: string;
  buyPrice?: number;
  sellPrice?: number;
  category?: string;
  taxType: string;
  memo?: string;
  businessId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [unitOptions, setUnitOptions] = useState<string[]>(['kg', 'ea', 'set', '개', 'box', 'pcs']);
  const [specOptions, setSpecOptions] = useState<string[]>(['box', 'ea', 'pallet', '자루', 'set', 'pack']);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<{value: string}[]>([]);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [excelUploadModalVisible, setExcelUploadModalVisible] = useState(false);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [pageSize, setPageSize] = useState<number>(window.innerWidth <= 768 ? 5 : 10);
  const { currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (currentBusiness) {
      fetchProducts();
    }
  }, [currentBusiness]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === '1') {
        event.preventDefault();
        handleAdd();
      } else if (event.altKey && event.key === '3') {
        event.preventDefault();
        if (selectedRowKeys.length > 0) {
          handleBulkDelete();
        }
      } else if (event.altKey && event.key === '2') {
        event.preventDefault();
        handleSelectAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedRowKeys]);

  useEffect(() => {
    if (!modalVisible) return;

    const handleModalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F4') {
        event.preventDefault();
        if (!editingProduct) {
          form.validateFields().then(values => {
            handleSubmit(values, true);
          }).catch(info => {
            console.log('Validate Failed:', info);
          });
        }
      }
    };

    document.addEventListener('keydown', handleModalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleModalKeyDown);
    };
  }, [modalVisible, editingProduct, form]);

  const fetchProducts = async () => {
    if (!currentBusiness) return [];

    setLoading(true);
    try {
      // 전체 데이터를 가져오기 위해 limit을 크게 설정
      const response = await productAPI.getAll(currentBusiness.id, { page: 1, limit: 10000 });
      const updatedProducts = response.data.data.products || [];
      setProducts(updatedProducts);
      return updatedProducts;
    } catch (error) {
      message.error('품목 목록을 불러오는데 실패했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.productCode?.toLowerCase().includes(searchLower) ||
      product.spec?.toLowerCase().includes(searchLower) ||
      product.unit?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower) ||
      product.memo?.toLowerCase().includes(searchLower)
    );
  });

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const generateAutoCompleteOptions = (keyword: string) => {
    if (keyword.length < 2) {
      setAutoCompleteOptions([]);
      return;
    }

    const searchLower = keyword.toLowerCase();
    const matches = new Set<string>();

    products.forEach(product => {
      if (product.name?.toLowerCase().includes(searchLower)) {
        matches.add(product.name);
      }
      if (product.productCode?.toLowerCase().includes(searchLower)) {
        matches.add(product.productCode);
      }
      if (product.spec?.toLowerCase().includes(searchLower)) {
        matches.add(product.spec);
      }
      if (product.unit?.toLowerCase().includes(searchLower)) {
        matches.add(product.unit);
      }
      if (product.category?.toLowerCase().includes(searchLower)) {
        matches.add(product.category);
      }
      if (product.memo?.toLowerCase().includes(searchLower)) {
        matches.add(product.memo);
      }
    });

    const options = Array.from(matches)
      .slice(0, 10)
      .map(value => ({ value }));

    setAutoCompleteOptions(options);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    generateAutoCompleteOptions(value);
  };

  // 다음 품목코드 생성 함수
  const generateNextProductCode = (productList: Product[] = products) => {
    const maxProductCode = productList
      .filter(product => product.productCode?.startsWith('P'))
      .map(product => {
        const match = product.productCode?.match(/^P(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .reduce((max, num) => Math.max(max, num), 0);

    const nextNumber = maxProductCode + 1;
    return `P${nextNumber.toString().padStart(4, '0')}`;
  };

  const handleAdd = async () => {
    setEditingProduct(null);
    form.resetFields();

    form.setFieldsValue({
      productCode: generateNextProductCode(),
      taxType: 'tax_separate'
    });

    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalVisible(true);
    setTimeout(() => {
      form.setFieldsValue(product);
    }, 100);
  };

  const handleDelete = async (id: number) => {
    if (!currentBusiness) return;

    try {
      await productAPI.delete(currentBusiness.id, id);
      message.success('품목이 삭제되었습니다.', 2);
      fetchProducts();
    } catch (error) {
      message.error('품목 삭제에 실패했습니다.', 2);
    }
  };

  const handleSelectAll = () => {
    const currentData = filteredProducts;
    if (selectedRowKeys.length === currentData.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(currentData.map(product => product.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('삭제할 항목을 선택해주세요.', 2);
      return;
    }

    try {
      await Promise.all(selectedRowKeys.map(id =>
        productAPI.delete(currentBusiness!.id, id as number)
      ));

      message.success(`${selectedRowKeys.length}개의 품목이 삭제되었습니다.`, 2);
      setSelectedRowKeys([]);
      fetchProducts();
    } catch (error) {
      message.error('품목 삭제에 실패했습니다.', 2);
    }
  };

  // 엑셀 업로드 처리
  const handleExcelUpload = async (data: any[]) => {
    if (!currentBusiness || data.length === 0) return;

    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const row of data) {
        try {
          // 세금구분 매핑
          let taxType = 'tax_separate';
          const taxTypeValue = row['세금구분']?.toString().toLowerCase();
          if (taxTypeValue === 'tax_inclusive' || taxTypeValue === '과세') {
            taxType = 'tax_inclusive';
          } else if (taxTypeValue === 'tax_free' || taxTypeValue === '면세') {
            taxType = 'tax_free';
          } else if (taxTypeValue === 'tax_separate' || taxTypeValue === '별도') {
            taxType = 'tax_separate';
          }

          await productAPI.create(currentBusiness.id, {
            productCode: row['품목코드'] || '',
            name: row['품목명'] || '',
            spec: row['규격'] || '',
            unit: row['단위'] || '',
            buyPrice: Number(row['매입단가']) || 0,
            sellPrice: Number(row['매출단가']) || 0,
            category: row['분류'] || '',
            taxType: taxType,
            memo: row['비고'] || ''
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error('Product upload error:', error);
        }
      }

      message.success(`${successCount}건 업로드 완료, ${failCount}건 실패`);
      fetchProducts();
    } catch (error) {
      message.error('엑셀 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    console.log('ProductManagement handleExport called with type:', type);
    const dataToExport = selectedRowKeys.length > 0
      ? products.filter(product => selectedRowKeys.includes(product.id))
      : products;

    const { exportToExcel, exportToPDF, getCommonColumns } = await import('../../utils/exportUtils');

    const options = {
      filename: `품목목록_${dayjs().format('YYYYMMDD')}`,
      title: '품목 관리',
      columns: getCommonColumns().product,
      data: dataToExport,
      selectedRowKeys
    };

    switch (type) {
      case 'excel':
        await exportToExcel(options);
        break;
      case 'pdf':
        await exportToPDF(options);
        break;
    }
  };

  const handleRowClick = (record: Product, event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        target.className.includes('ant-checkbox') ||
        target.closest('.ant-checkbox') ||
        target.closest('button') ||
        target.closest('.ant-btn')) {
      return;
    }

    event.preventDefault();

    if (selectedRowKeys.includes(record.id)) {
      setSelectedRowKeys(prev => prev.filter(key => key !== record.id));
    } else {
      setSelectedRowKeys(prev => [...prev, record.id]);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    preserveSelectedRowKeys: true,
  };

  const handleSubmit = async (values: any, resetAfterSave = false) => {
    if (!currentBusiness) return;

    try {
      const productData = {
        ...values
      };

      if (editingProduct) {
        await productAPI.update(currentBusiness.id, editingProduct.id, productData);
        message.success('품목이 수정되었습니다.', 2);
      } else {
        await productAPI.create(currentBusiness.id, productData);
        message.success('품목이 저장되었습니다.', 2);
      }

      if (resetAfterSave && !editingProduct) {
        // 저장 후 초기화 - 새로 등록할 때만
        form.resetFields();
        const updatedProducts = await fetchProducts(); // 품목 목록을 새로 불러와서 코드 생성에 반영
        const nextCode = generateNextProductCode(updatedProducts);
        form.setFieldsValue({
          productCode: nextCode,
          taxType: 'tax_separate'
        });
        message.info(`다음 품목코드: ${nextCode}`, 1.5);
      } else {
        // 일반 저장
        setModalVisible(false);
        form.resetFields();
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '품목 저장에 실패했습니다.', 2);
    }
  };

  // 엑셀 업로드 관련 함수들
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFileUpload = (_file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 엑셀 데이터를 품목 형식으로 변환
        const productData = jsonData.map((row: any, index: number) => {
          return {
            index: index + 1,
            productCode: row['품목코드'] || row['productCode'] || '',
            name: row['품목명'] || row['name'] || '',
            spec: row['규격'] || row['spec'] || '',
            unit: row['단위'] || row['unit'] || '',
            buyPrice: row['매입단가'] || row['buyPrice'] || 0,
            sellPrice: row['매출단가'] || row['sellPrice'] || 0,
            category: row['분류'] || row['category'] || '',
            taxType: row['세금구분'] || row['taxType'] || 'tax_separate',
            memo: row['비고'] || row['memo'] || ''
          };
        });

        setUploadData(productData);
        setUploadModalVisible(true);
      } catch (error) {
        message.error('엑셀 파일 읽기에 실패했습니다.');
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // 파일 업로드를 막음
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUploadConfirm = async () => {
    if (!currentBusiness || uploadData.length === 0) return;

    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const productData of uploadData) {
        try {
          // 세금구분 변환
          let taxType = productData.taxType;
          if (taxType === '과세 10%별도') taxType = 'tax_separate';
          else if (taxType === '과세 10%포함') taxType = 'tax_inclusive';
          else if (taxType === '면세') taxType = 'tax_free';

          await productAPI.create(currentBusiness.id, {
            productCode: productData.productCode,
            name: productData.name,
            spec: productData.spec,
            unit: productData.unit,
            buyPrice: Number(productData.buyPrice) || 0,
            sellPrice: Number(productData.sellPrice) || 0,
            category: productData.category,
            taxType: taxType,
            memo: productData.memo
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error('Product upload error:', error);
        }
      }

      message.success(`${successCount}건 업로드 완료, ${failCount}건 실패`);
      setUploadModalVisible(false);
      setUploadData([]);
      fetchProducts();
    } catch (error) {
      message.error('엑셀 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const downloadTemplate = () => {
    const template = [
      {
        '품목코드': 'P0001',
        '품목명': '샘플품목',
        '규격': 'box',
        '단위': 'ea',
        '매입단가': 1000,
        '매출단가': 1200,
        '분류': '일반',
        '세금구분': '과세 10%별도',
        '비고': '샘플 데이터'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '품목');
    XLSX.writeFile(workbook, '품목_업로드_템플릿.xlsx');
  };

  const columns = [
    {
      title: '품목코드',
      dataIndex: 'productCode',
      key: 'productCode',
      align: 'center' as const,
      sorter: (a: Product, b: Product) => a.productCode?.localeCompare(b.productCode || '') || 0,
    },
    {
      title: '품목명',
      dataIndex: 'name',
      key: 'name',
      align: 'center' as const,
      sorter: (a: Product, b: Product) => a.name?.localeCompare(b.name || '') || 0,
    },
    {
      title: '규격',
      dataIndex: 'spec',
      key: 'spec',
      align: 'center' as const,
      sorter: (a: Product, b: Product) => (a.spec || '').localeCompare(b.spec || ''),
    },
    {
      title: '단위',
      dataIndex: 'unit',
      key: 'unit',
      align: 'center' as const,
      sorter: (a: Product, b: Product) => (a.unit || '').localeCompare(b.unit || ''),
    },
    {
      title: '매입단가',
      dataIndex: 'buyPrice',
      key: 'buyPrice',
      align: 'center' as const,
      render: (price: number) => (price ? Math.round(price).toLocaleString() : '0') + '원',
      sorter: (a: Product, b: Product) => (a.buyPrice || 0) - (b.buyPrice || 0),
    },
    {
      title: '매출단가',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      align: 'center' as const,
      render: (price: number) => (price ? Math.round(price).toLocaleString() : '0') + '원',
      sorter: (a: Product, b: Product) => (a.sellPrice || 0) - (b.sellPrice || 0),
    },
    {
      title: '분류',
      dataIndex: 'category',
      key: 'category',
      align: 'center' as const,
      sorter: (a: Product, b: Product) => (a.category || '').localeCompare(b.category || ''),
    },
    {
      title: '세금구분',
      dataIndex: 'taxType',
      key: 'taxType',
      align: 'center' as const,
      render: (taxType: string) => {
        switch (taxType) {
          case 'tax_separate': return '과세 10%별도';
          case 'tax_inclusive': return '과세 10%포함';
          case 'tax_free': return '면세';
          default: return '-';
        }
      },
      sorter: (a: Product, b: Product) => (a.taxType || '').localeCompare(b.taxType || ''),
    },
    {
      title: '비고',
      dataIndex: 'memo',
      key: 'memo',
      align: 'center' as const,
      sorter: (a: Product, b: Product) => (a.memo || '').localeCompare(b.memo || ''),
    },
    {
      title: '작업',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: Product) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            수정
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="예"
            cancelText="아니오"
            okButtonProps={{ autoFocus: true }}
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const actionMenuItems = createExportMenuItems(
    products,
    columns,
    '상품_목록',
    'product-table'
  );

  return (
    <div style={{
      padding: window.innerWidth <= 768 ? '16px 8px' : '24px',
      minHeight: 'calc(100vh - 140px)'
    }}>
      <Row align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h2 style={{ margin: 0, color: isDark ? '#ffffff' : '#000000', fontSize: '24px', fontWeight: 'bold' }}>품목 관리</h2>
        </Col>
        <Col style={{ marginLeft: '100px' }}>
          <Space size="middle" wrap>
            <AutoComplete
              options={autoCompleteOptions}
              value={searchText}
              onChange={handleSearchChange}
              onSelect={(value) => setSearchText(value)}
              style={{ width: 300 }}
            >
              <Input.Search
                placeholder="품목명, 품목코드, 규격, 단위, 분류 등으로 검색 (2글자 이상)"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={handleSearch}
              />
            </AutoComplete>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              추가
            </Button>
            <Button
              icon={<ImportOutlined />}
              size="middle"
              onClick={() => setExcelUploadModalVisible(true)}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
            >
              엑셀업로드
            </Button>
            <Dropdown menu={{ items: actionMenuItems }} placement="bottomRight">
              <Button icon={<ExportOutlined />} size="middle" style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}>
                파일저장
              </Button>
            </Dropdown>
            <Button
              onClick={handleSelectAll}
              type="default"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
            >
              {selectedRowKeys.length === filteredProducts.length && filteredProducts.length > 0 ? '전체 해제' : '전체 선택'}
            </Button>
            <Popconfirm
              title={`선택한 ${selectedRowKeys.length}개 항목을 삭제하시겠습니까?`}
              onConfirm={handleBulkDelete}
              okText="예"
              cancelText="아니오"
              disabled={selectedRowKeys.length === 0}
              okButtonProps={{
                autoFocus: true,
                size: 'large',
                style: { minWidth: '80px', height: '40px', fontSize: '16px' }
              }}
              cancelButtonProps={{
                size: 'large',
                style: { minWidth: '80px', height: '40px', fontSize: '16px' }
              }}
              placement="top"
              overlayStyle={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999,
                pointerEvents: 'auto'
              }}
              styles={{
                body: {
                  padding: '20px',
                  fontSize: '18px',
                  fontWeight: '500',
                  minWidth: '350px',
                  textAlign: 'center',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                }
              }}
              transitionName=""
              mouseEnterDelay={0}
              mouseLeaveDelay={0}
            >
              <Button danger disabled={selectedRowKeys.length === 0}>
                선택 삭제 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
            <Button
              onClick={() => handleExport('excel')}
              icon={<FileExcelOutlined />}
              style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}
              size="middle"
            >
              엑셀
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              icon={<FilePdfOutlined />}
              style={{ backgroundColor: '#fa541c', borderColor: '#fa541c', color: 'white' }}
              size="middle"
            >
              PDF
            </Button>
            <Button
              onClick={() => setPrintModalVisible(true)}
              icon={<PrinterOutlined />}
              style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
              size="middle"
            >
              인쇄
            </Button>
          </Space>
        </Col>
      </Row>

      {loading && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
          <Spin size="large" />
        </div>
      )}

      <Table
        id="product-table"
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        loading={false}
        rowSelection={rowSelection}
        showSorterTooltip={false}
        onRow={(record) => ({
          onClick: (e) => handleRowClick(record, e),
          onDoubleClick: () => handleEdit(record),
          style: { cursor: 'pointer' }
        })}
        scroll={{ x: window.innerWidth <= 768 ? 1200 : undefined }}
        size={window.innerWidth <= 768 ? 'small' : 'middle'}
        pagination={{
          pageSize: pageSize,
          pageSizeOptions: window.innerWidth <= 768 ? ['5', '10', '20'] : ['10', '20', '50', '100'],
          showSizeChanger: window.innerWidth > 768,
          showQuickJumper: window.innerWidth > 768,
          simple: window.innerWidth <= 768,
          showTotal: (total, range) => {
            const searchInfo = searchText ? ` (전체 ${products.length}건 중 검색결과)` : '';
            return window.innerWidth <= 768
              ? `${total}건`
              : `${range[0]}-${range[1]} / ${total}건${searchInfo}`;
          },
          onShowSizeChange: (current, size) => {
            setPageSize(size);
          },
        }}
      />

      <Modal
        title={editingProduct ? '품목 수정' : '품목 등록'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingProduct(null);
        }}
        closable={true}
        maskClosable={false}
        keyboard={true}
        destroyOnHidden={true}
        footer={null}
        width={window.innerWidth <= 768 ? '95%' : 1000}
        style={{ top: window.innerWidth <= 768 ? 20 : 50 }}
        getContainer={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ taxType: 'tax_separate' }}
        >
          <Row gutter={window.innerWidth <= 768 ? 8 : 16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="productCode"
                label="품목코드"
                rules={[{ required: true, message: '품목코드를 입력해주세요!' }]}
              >
                <Input
                  placeholder="P0001"
                  disabled={editingProduct ? true : false}
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="품목명"
                rules={[{ required: true, message: '품목명을 입력해주세요!' }]}
              >
                <Input size={window.innerWidth <= 768 ? 'small' : 'middle'} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={window.innerWidth <= 768 ? 8 : 16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="spec"
                label="규격 (선택)"
              >
                <Select
                  showSearch
                  placeholder={window.innerWidth <= 768 ? "규격" : "규격 선택 또는 직접 입력 (예: box, ea, pallet, 자루)"}
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                  allowClear
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                        <Input
                          placeholder="새 규격 추가"
                          size="small"
                          onPressEnter={(e) => {
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value && !specOptions.includes(value)) {
                              setSpecOptions([...specOptions, value]);
                              form.setFieldValue('spec', value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      </div>
                    </>
                  )}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {specOptions.map(spec => (
                    <Select.Option key={spec} value={spec} label={spec}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{spec}</span>
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSpecOptions(specOptions.filter(s => s !== spec));
                            if (form.getFieldValue('spec') === spec) {
                              form.setFieldValue('spec', undefined);
                            }
                          }}
                          style={{ color: '#ff4d4f' }}
                        />
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="unit"
                label="단위 (선택)"
              >
                <Select
                  showSearch
                  placeholder={window.innerWidth <= 768 ? "단위" : "단위 선택 또는 직접 입력 (예: kg, ea, set)"}
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                  allowClear
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                        <Input
                          placeholder="새 단위 추가"
                          size="small"
                          onPressEnter={(e) => {
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value && !unitOptions.includes(value)) {
                              setUnitOptions([...unitOptions, value]);
                              form.setFieldValue('unit', value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      </div>
                    </>
                  )}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {unitOptions.map(unit => (
                    <Select.Option key={unit} value={unit} label={unit}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{unit}</span>
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setUnitOptions(unitOptions.filter(u => u !== unit));
                            if (form.getFieldValue('unit') === unit) {
                              form.setFieldValue('unit', undefined);
                            }
                          }}
                          style={{ color: '#ff4d4f' }}
                        />
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={window.innerWidth <= 768 ? 8 : 16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="buyPrice"
                label="매입단가"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: string | undefined) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  min={0}
                  placeholder="0"
                  addonAfter="원"
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="sellPrice"
                label="매출단가"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: string | undefined) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  min={0}
                  placeholder="0"
                  addonAfter="원"
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={window.innerWidth <= 768 ? 8 : 16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="category"
                label="분류 (선택)"
              >
                <Input
                  placeholder="분류를 입력하세요"
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="taxType"
                label="세금구분"
                rules={[{ required: true, message: '세금구분을 선택해주세요!' }]}
              >
                <Radio.Group size={window.innerWidth <= 768 ? 'small' : 'middle'}>
                  <Radio value="tax_separate">과세 10%별도</Radio>
                  <Radio value="tax_inclusive">과세 10%포함</Radio>
                  <Radio value="tax_free">면세</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="memo"
            label="비고"
          >
            <TextArea
              rows={window.innerWidth <= 768 ? 2 : 3}
              placeholder="비고 사항을 입력하세요"
              size={window.innerWidth <= 768 ? 'small' : 'middle'}
            />
          </Form.Item>

          <div style={{
            textAlign: 'center',
            marginBottom: 0,
            paddingTop: '16px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Space
              size={window.innerWidth <= 768 ? 8 : 16}
              style={{ justifyContent: 'center' }}
              direction={window.innerWidth <= 768 ? 'vertical' : 'horizontal'}
            >
              <Button
                size={window.innerWidth <= 768 ? 'small' : 'middle'}
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setEditingProduct(null);
                }}
                style={{ width: window.innerWidth <= 768 ? '200px' : 'auto' }}
              >
                취소
              </Button>
              <Button
                size={window.innerWidth <= 768 ? 'small' : 'middle'}
                type="primary"
                htmlType="submit"
                style={{ width: window.innerWidth <= 768 ? '200px' : 'auto' }}
              >
                저장
              </Button>
              {!editingProduct && (
                <Button
                  size={window.innerWidth <= 768 ? 'small' : 'middle'}
                  type="default"
                  style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    color: 'white',
                    width: window.innerWidth <= 768 ? '200px' : 'auto'
                  }}
                  onClick={() => {
                    form.validateFields().then(values => {
                      handleSubmit(values, true);
                    }).catch(info => {
                      console.log('Validate Failed:', info);
                    });
                  }}
                >
                  {window.innerWidth <= 768 ? '저장+초기화' : '저장 후 초기화'}
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Modal>

      {/* 엑셀 업로드 모달 */}
      <ExcelUploadModal
        visible={excelUploadModalVisible}
        onCancel={() => setExcelUploadModalVisible(false)}
        onSuccess={handleExcelUpload}
        title="품목 엑셀 업로드"
        templateType="product"
        description="품목 정보를 엑셀 파일로 일괄 업로드할 수 있습니다. 먼저 템플릿을 다운로드하여 양식을 확인하세요."
        requiredFields={['품목명']}
      />

      <ProductPrintModal
        open={printModalVisible}
        onClose={() => setPrintModalVisible(false)}
        products={filteredProducts.filter(product =>
          selectedRowKeys.length > 0
            ? selectedRowKeys.includes(product.id)
            : true
        )}
        title="품목 관리"
      />
    </div>
  );
};

export default ProductManagement;