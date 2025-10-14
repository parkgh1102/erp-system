import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, Input, Space, Popconfirm, Card, Row, Col, InputNumber, AutoComplete, Spin, Upload, Typography, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined, SearchOutlined, UploadOutlined, DownloadOutlined, ExportOutlined, ImportOutlined, DownOutlined, PrinterOutlined } from '@ant-design/icons';
import ExcelUploadModal from '../Common/ExcelUploadModal';
import { createExportMenuItems } from '../../utils/exportUtils';
import * as ExcelJS from 'exceljs';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { salesAPI, customerAPI, productAPI } from '../../utils/api';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);
import { PrintPreviewModal } from '../Print/PrintPreviewModal';
import { useMessage } from '../../hooks/useMessage';
import logger from '../../utils/logger';

const { Option } = Select;
const { RangePicker } = DatePicker;
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
}

interface Customer {
  id: number;
  customerCode: string;
  name: string;
  businessNumber?: string;
  customerType: string;
  phone?: string;
  email?: string;
  address?: string;
  representative?: string;
}

interface SaleItem {
  productId: number;
  productCode: string;
  productName: string;
  spec?: string;
  unit?: string;
  taxType?: string;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;  // 공급가액
  vatAmount: number;     // 세액
  totalAmount: number;   // 합계금액
}

interface Sale {
  id: number;
  transactionDate: string;
  saleDate?: string; // Keep for backward compatibility
  customerId?: number;
  customer?: Customer;
  items: SaleItem[];
  totalAmount: number;
  vatAmount: number;
  description?: string;
  businessId: number;
  createdAt: string;
  updatedAt: string;
}

const SalesManagement: React.FC = () => {
  const message = useMessage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [form] = Form.useForm();
  const [saleItems, setSaleItems] = useState<SaleItem[]>([{
    productId: 0,
    productCode: '',
    productName: '',
    spec: '',
    unit: '',
    taxType: '',
    quantity: 1,
    unitPrice: 0,
    supplyAmount: 0,
    vatAmount: 0,
    totalAmount: 0
  }]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<{value: string}[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [excelUploadModalVisible, setExcelUploadModalVisible] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'full' | 'receiver' | 'supplier'>('full');
  const [transactionStatementModalVisible, setTransactionStatementVisible] = useState(false);
  const [selectedSaleForStatement, setSelectedSaleForStatement] = useState<Sale | null>(null);
  const { currentBusiness } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (currentBusiness) {
      fetchData();
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
        if (!editingSale) {
          form.validateFields().then(values => {
            handleSubmit(values, true);
          }).catch(info => {
            logger.debug('Validate Failed:', info);
          });
        }
      }
    };

    document.addEventListener('keydown', handleModalKeyDown);

    return () => {
      document.removeEventListener('keydown', handleModalKeyDown);
    };
  }, [modalVisible, editingSale, form]);

  const fetchData = async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      const [salesRes, customersRes, productsRes] = await Promise.all([
        salesAPI.getAll(currentBusiness.id),
        customerAPI.getAll(currentBusiness.id),
        productAPI.getAll(currentBusiness.id)
      ]);

      setSales(salesRes.data.data.sales || []);
      setCustomers(customersRes.data.data.customers || []);
      setProducts(productsRes.data.data.products || []);

    } catch (error) {
      message.error('데이터를 불러오는데 실패했습니다.', 2);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    // 날짜 필터링
    const saleDate = dayjs(sale.transactionDate || sale.saleDate);
    const [startDate, endDate] = dateRange;
    if (!saleDate.isBetween(startDate, endDate, 'day', '[]')) {
      return false;
    }

    // 검색 텍스트 필터링
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      sale.customer?.name?.toLowerCase().includes(searchLower) ||
      sale.memo?.toLowerCase().includes(searchLower) ||
      sale.items?.some(item => item.productName?.toLowerCase().includes(searchLower)) ||
      sale.totalAmount?.toString().includes(searchText) ||
      sale.vatAmount?.toString().includes(searchText)
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

    sales.forEach(sale => {
      if (sale.customer?.name?.toLowerCase().includes(searchLower)) {
        matches.add(sale.customer.name);
      }
      sale.items?.forEach(item => {
        if (item.productName?.toLowerCase().includes(searchLower)) {
          matches.add(item.productName);
        }
      });
      if (sale.memo?.toLowerCase().includes(searchLower)) {
        matches.add(sale.memo);
      }
      if (sale.totalAmount?.toString().includes(keyword)) {
        matches.add(sale.totalAmount.toString());
      }
      if (sale.vatAmount?.toString().includes(keyword)) {
        matches.add(sale.vatAmount.toString());
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

  const handleAdd = () => {
    setEditingSale(null);
    setSaleItems([{
      productId: 0,
      productCode: '',
      productName: '',
      spec: '',
      unit: '',
      taxType: '',
      quantity: 1,
      unitPrice: 0,
      supplyAmount: 0,
      vatAmount: 0,
      totalAmount: 0
    }]);
    setModalVisible(true);
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        saleDate: dayjs()
      });
    }, 0);
  };

  const handleEdit = (sale: Sale) => {
    logger.debug('📝 Editing sale:', sale);
    setEditingSale(sale);
    // items 데이터를 프론트엔드 형식에 맞게 매핑
    const mappedItems = sale.items.map(item => {
      logger.debug('📦 Item data:', item);
      const product = (item as any).product;
      const productId = item.productId;
      const selectedProduct = products.find(p => p.id === productId);
      const taxType = selectedProduct?.taxType || 'tax_separate';

      // 수량 * 단가
      const amount = item.quantity * item.unitPrice;
      let supplyAmount = amount;
      let vatAmount = 0;
      let totalAmount = amount;

      // 과세 유형에 따른 계산
      if (taxType === 'tax_separate') {
        // 과세별도: 공급가액 = 단가*수량, 세액 = 공급가액*0.1, 합계 = 공급가액+세액
        supplyAmount = amount;
        vatAmount = Math.round(amount * 0.1);
        totalAmount = supplyAmount + vatAmount;
      } else if (taxType === 'tax_inclusive') {
        // 과세포함: 합계금액 = 단가*수량, 공급가액 = 합계/1.1, 세액 = 합계-공급가액
        totalAmount = amount;
        supplyAmount = Math.round(amount / 1.1);
        vatAmount = totalAmount - supplyAmount;
      } else {
        // 면세: 공급가액 = 단가*수량, 세액 = 0, 합계 = 공급가액
        supplyAmount = amount;
        vatAmount = 0;
        totalAmount = supplyAmount;
      }

      return {
        productId: item.productId,
        productCode: item.productCode,
        productName: (item as any).itemName || item.productName,
        spec: item.spec || (item as any).specification || product?.spec || '',
        unit: item.unit || product?.unit || '',
        taxType: taxType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        supplyAmount: supplyAmount,
        vatAmount: vatAmount,
        totalAmount: totalAmount
      };
    });
    logger.debug('✅ Mapped items:', mappedItems);
    setSaleItems(mappedItems);
    setModalVisible(true);
    setTimeout(() => {
      form.setFieldsValue({
        ...sale,
        saleDate: dayjs(sale.transactionDate || sale.saleDate),
      });
    }, 100);
  };

  const handleDelete = async (id: number) => {
    if (!currentBusiness) return;

    try {
      await salesAPI.delete(currentBusiness.id, id);
      fetchData();
      message.success('매출이 삭제되었습니다.', 2);
    } catch (error) {
      message.error('매출 삭제에 실패했습니다.', 2);
    }
  };

  const handleSelectAll = () => {
    const currentData = filteredSales;
    if (selectedRowKeys.length === currentData.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(currentData.map(sale => sale.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('삭제할 항목을 선택해주세요.', 2);
      return;
    }

    try {
      await Promise.all(selectedRowKeys.map(id =>
        salesAPI.delete(currentBusiness!.id, id as number)
      ));

      setSelectedRowKeys([]);
      fetchData();
      message.success(`${selectedRowKeys.length}개의 매출이 삭제되었습니다.`, 2);
    } catch (error) {
      message.error('매출 삭제에 실패했습니다.', 2);
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
          // 거래처 찾기
          const customer = customers.find(c => c.name === row['거래처명']);
          if (!customer) {
            logger.warn(`거래처 '${row['거래처명']}'를 찾을 수 없습니다.`);
            failCount++;
            continue;
          }

          // 상품 찾기
          const product = products.find(p => p.name === row['상품명']);
          if (!product) {
            logger.warn(`상품 '${row['상품명']}'를 찾을 수 없습니다.`);
            failCount++;
            continue;
          }

          await salesAPI.create(currentBusiness.id, {
            customerId: customer.id,
            salesDate: row['매출일자'] || dayjs().format('YYYY-MM-DD'),
            totalAmount: Number(row['금액']) || 0,
            vatAmount: Math.round((Number(row['금액']) || 0) * 0.1),
            memo: row['비고'] || '',
            items: [{
              productId: product.id,
              productCode: product.productCode,
              productName: product.name,
              spec: product.spec || '',
              unit: product.unit || '',
              quantity: Number(row['수량']) || 1,
              unitPrice: Number(row['단가']) || 0,
              amount: Number(row['금액']) || 0
            }]
          });
          successCount++;
        } catch (error) {
          failCount++;
          logger.error('Sales upload error:', error);
        }
      }

      fetchData();
      message.success(`${successCount}건 업로드 완료, ${failCount}건 실패`, 2);
    } catch (error) {
      message.error('엑셀 업로드에 실패했습니다.', 2);
    } finally {
      setLoading(false);
    }
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleRowClick = (record: Sale, event: React.MouseEvent<HTMLElement>) => {
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

  const handleItemChange = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...saleItems];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'productId') {
      const selectedProduct = products.find(product => product.id === value);
      if (selectedProduct) {
        newItems[index].productCode = selectedProduct.productCode;
        newItems[index].productName = selectedProduct.name;
        newItems[index].spec = selectedProduct.spec || '';
        newItems[index].unit = selectedProduct.unit || '';
        newItems[index].taxType = selectedProduct.taxType || 'tax_separate';
        newItems[index].unitPrice = selectedProduct.sellPrice || 0;

        // 공급가액, 세액, 합계금액 계산
        const amount = newItems[index].quantity * (selectedProduct.sellPrice || 0);
        let supplyAmount = amount;
        let vatAmount = 0;
        let totalAmount = amount;

        if (selectedProduct.taxType === 'tax_separate') {
          // 과세별도: 공급가액 = 단가*수량, 세액 = 공급가액*0.1, 합계 = 공급가액+세액
          supplyAmount = amount;
          vatAmount = Math.round(amount * 0.1);
          totalAmount = supplyAmount + vatAmount;
        } else if (selectedProduct.taxType === 'tax_inclusive') {
          // 과세포함: 합계금액 = 단가*수량, 공급가액 = 합계/1.1, 세액 = 합계-공급가액
          totalAmount = amount;
          supplyAmount = Math.round(amount / 1.1);
          vatAmount = totalAmount - supplyAmount;
        } else {
          // 면세: 공급가액 = 단가*수량, 세액 = 0, 합계 = 공급가액
          supplyAmount = amount;
          vatAmount = 0;
          totalAmount = supplyAmount;
        }

        newItems[index].supplyAmount = supplyAmount;
        newItems[index].vatAmount = vatAmount;
        newItems[index].totalAmount = totalAmount;
      }
    }

    if (field === 'quantity' || field === 'unitPrice') {
      const amount = newItems[index].quantity * newItems[index].unitPrice;
      const selectedProduct = products.find(p => p.id === newItems[index].productId);
      const taxType = selectedProduct?.taxType || 'tax_separate';

      let supplyAmount = amount;
      let vatAmount = 0;
      let totalAmount = amount;

      if (taxType === 'tax_separate') {
        // 과세별도: 공급가액 = 단가*수량, 세액 = 공급가액*0.1, 합계 = 공급가액+세액
        supplyAmount = amount;
        vatAmount = Math.round(amount * 0.1);
        totalAmount = supplyAmount + vatAmount;
      } else if (taxType === 'tax_inclusive') {
        // 과세포함: 합계금액 = 단가*수량, 공급가액 = 합계/1.1, 세액 = 합계-공급가액
        totalAmount = amount;
        supplyAmount = Math.round(amount / 1.1);
        vatAmount = totalAmount - supplyAmount;
      } else {
        // 면세: 공급가액 = 단가*수량, 세액 = 0, 합계 = 공급가액
        supplyAmount = amount;
        vatAmount = 0;
        totalAmount = supplyAmount;
      }

      newItems[index].supplyAmount = supplyAmount;
      newItems[index].vatAmount = vatAmount;
      newItems[index].totalAmount = totalAmount;
    }

    setSaleItems(newItems);
  };

  const addItem = () => {
    setSaleItems([...saleItems, {
      productId: 0,
      productCode: '',
      productName: '',
      spec: '',
      unit: '',
      taxType: '',
      quantity: 1,
      unitPrice: 0,
      supplyAmount: 0,
      vatAmount: 0,
      totalAmount: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (saleItems.length > 1) {
      const newItems = saleItems.filter((_, i) => i !== index);
      setSaleItems(newItems);
    }
  };

  const calculateTotals = () => {
    let totalSupplyAmount = 0;
    let totalVatAmount = 0;

    saleItems.forEach(item => {
      if (item.productId > 0) {
        totalSupplyAmount += item.supplyAmount;
        totalVatAmount += item.vatAmount;
      }
    });

    return { totalAmount: totalSupplyAmount, vatAmount: totalVatAmount };
  };

  const handleSubmit = async (values: any, resetAfterSave = false) => {
    if (!currentBusiness) return;

    try {
      const { totalAmount, vatAmount } = calculateTotals();
      const selectedCustomer = customers.find(c => c.id === values.customerId);

      const filteredItems = saleItems
        .filter(item => item.productId > 0 || item.productName)
        .map(item => ({
          ...item,
          amount: item.quantity * item.unitPrice
        }));

      logger.debug('🔍 Sale data before sending:', {
        saleItems,
        filteredItems,
        totalAmount,
        vatAmount
      });

      const saleData = {
        ...values,
        saleDate: values.saleDate.format('YYYY-MM-DD'),
        customer: selectedCustomer ? {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
        } : null,
        items: filteredItems,
        totalAmount: totalAmount || 0,
        vatAmount: vatAmount || 0,
        businessId: currentBusiness.id
      };

      logger.debug('📤 Sending sale data:', JSON.stringify(saleData, null, 2));

      if (editingSale) {
        await salesAPI.update(currentBusiness.id, editingSale.id, saleData);
      } else {
        await salesAPI.create(currentBusiness.id, saleData);
      }

      // 모달 즉시 닫기
      if (resetAfterSave && !editingSale) {
        // 저장 후 초기화 - 새로 등록할 때만
        form.resetFields();
        setSaleItems([{
          productId: 0,
          productCode: '',
          productName: '',
          spec: '',
          unit: '',
          taxType: '',
          quantity: 1,
          unitPrice: 0,
          supplyAmount: 0,
          vatAmount: 0,
          totalAmount: 0
        }]);
        // 오늘 날짜로 설정
        form.setFieldsValue({
          saleDate: dayjs()
        });
      } else {
        // 일반 저장
        setModalVisible(false);
        form.resetFields();
        setEditingSale(null);
        setSaleItems([{
          productId: 0,
          productCode: '',
          productName: '',
          spec: '',
          unit: '',
          taxType: '',
          quantity: 1,
          unitPrice: 0,
          supplyAmount: 0,
          vatAmount: 0,
          totalAmount: 0
        }]);
      }

      // 토스트와 데이터 새로고침은 모달 닫은 후
      message.success(editingSale ? '매출이 수정되었습니다.' : '매출이 저장되었습니다.', 2);
      fetchData(); // await 제거하여 백그라운드에서 실행
    } catch (error) {
      message.error('매출 저장에 실패했습니다.', 2);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingSale(null);
    setSaleItems([{
      productId: 0,
      productCode: '',
      productName: '',
      spec: '',
      unit: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    }]);
  };

  // 엑셀 업로드 관련 함수들
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 엑셀 데이터를 매출 형식으로 변환
        const salesData = jsonData.map((row: any, index: number) => {
          return {
            index: index + 1,
            saleDate: row['매출일'] || row['saleDate'] || new Date().toISOString().split('T')[0],
            customerName: row['거래처명'] || row['customerName'] || '',
            productName: row['품목명'] || row['productName'] || '',
            quantity: Number(row['수량'] || row['quantity']) || 1,
            unitPrice: Number(row['단가'] || row['unitPrice']) || 0,
            totalAmount: Number(row['공급가액'] || row['totalAmount']) || 0,
            vatAmount: Number(row['부가세'] || row['vatAmount']) || 0,
            memo: row['비고'] || row['memo'] || ''
          };
        });

        setUploadData(salesData);
        setUploadModalVisible(true);
      } catch (error) {
        message.error('엑셀 파일 읽기에 실패했습니다.', 2);
        logger.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // 파일 업로드를 막음
  };

  const handleUploadConfirm = async () => {
    if (!currentBusiness || uploadData.length === 0) return;

    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const salesData of uploadData) {
        try {
          // 거래처와 품목 찾기
          const customer = customers.find(c => c.name === salesData.customerName);
          const product = products.find(p => p.name === salesData.productName);

          if (!customer || !product) {
            failCount++;
            continue;
          }

          // 매출 데이터 생성
          await salesAPI.create(currentBusiness.id, {
            saleDate: salesData.saleDate,
            customerId: customer.id,
            customer: {
              id: customer.id,
              name: customer.name,
            },
            items: [{
              productId: product.id,
              productCode: product.productCode,
              productName: product.name,
              spec: product.spec || '',
              unit: product.unit || '',
              quantity: salesData.quantity,
              unitPrice: salesData.unitPrice,
              amount: salesData.quantity * salesData.unitPrice
            }],
            totalAmount: salesData.totalAmount,
            vatAmount: salesData.vatAmount,
            memo: salesData.memo,
            businessId: currentBusiness.id
          });
          successCount++;
        } catch (error) {
          failCount++;
          logger.error('Sales upload error:', error);
        }
      }

      message.success(`${successCount}건 업로드 완료, ${failCount}건 실패`);
      setUploadModalVisible(false);
      setUploadData([]);
      fetchData();
    } catch (error) {
      message.error('엑셀 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        '매출일': '2024-01-01',
        '거래처명': '샘플거래처',
        '품목명': '샘플품목',
        '수량': 10,
        '단가': 1000,
        '공급가액': 10000,
        '부가세': 1000,
        '비고': '샘플 데이터'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '매출');
    XLSX.writeFile(workbook, '매출_업로드_템플릿.xlsx');
  };

  const columns = [
    {
      title: 'No.',
      key: 'index',
      width: '8%',
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '일자',
      key: 'transactionDate',
      width: '12%',
      align: 'center' as const,
      render: (record: Sale) => {
        const date = record.transactionDate || record.saleDate;
        return date ? dayjs(date).format('YYYY-MM-DD') : '';
      },
      sorter: (a: Sale, b: Sale) => {
        const dateA = a.transactionDate || a.saleDate || '';
        const dateB = b.transactionDate || b.saleDate || '';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      },
    },
    {
      title: '거래처',
      key: 'customerName',
      width: '15%',
      align: 'center' as const,
      render: (record: Sale) => record.customer?.name || '-',
      sorter: (a: Sale, b: Sale) => (a.customer?.name || '').localeCompare(b.customer?.name || ''),
    },
    {
      title: '품목명',
      dataIndex: 'items',
      key: 'productName',
      width: '15%',
      align: 'center' as const,
      render: (items: SaleItem[]) => {
        if (!items || items.length === 0) return '-';

        const firstItem = items[0];
        if (items.length === 1) {
          return firstItem.itemName || '-';
        } else {
          return `${firstItem.itemName || '품목'} 외1`;
        }
      },
      sorter: (a: Sale, b: Sale) => {
        const aFirstItem = (a.items && a.items[0]?.itemName) || '';
        const bFirstItem = (b.items && b.items[0]?.itemName) || '';
        return aFirstItem.localeCompare(bFirstItem);
      },
    },
    {
      title: '공급가액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: '12%',
      align: 'right' as const,
      render: (amount: number) => (amount || 0).toLocaleString() + '원',
      sorter: (a: Sale, b: Sale) => (a.totalAmount || 0) - (b.totalAmount || 0),
    },
    {
      title: '부가세',
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: '12%',
      align: 'right' as const,
      render: (amount: number) => (amount || 0).toLocaleString() + '원',
      sorter: (a: Sale, b: Sale) => (a.vatAmount || 0) - (b.vatAmount || 0),
    },
    {
      title: '합계',
      key: 'grandTotal',
      width: '12%',
      align: 'right' as const,
      render: (record: Sale) => {
        const total = (record.totalAmount || 0) + (record.vatAmount || 0);
        return total.toLocaleString() + '원';
      },
      sorter: (a: Sale, b: Sale) => ((a.totalAmount || 0) + (a.vatAmount || 0)) - ((b.totalAmount || 0) + (b.vatAmount || 0)),
    },
    {
      title: '비고',
      dataIndex: 'memo',
      key: 'memo',
      width: '10%',
      align: 'center' as const,
      render: (memo: string) => memo || '-',
    },
    {
      title: '작업',
      key: 'action',
      width: '14%',
      align: 'center' as const,
      render: (_: any, record: Sale) => (
        <Space size="small">
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
    sales,
    columns,
    '매출_목록',
    'sales-table'
  );

  const { totalAmount, vatAmount } = calculateTotals();

  return (
    <div style={{
      padding: window.innerWidth <= 768 ? '16px 8px' : '24px',
      minHeight: 'calc(100vh - 140px)'
    }}>
      <Row align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h2 style={{ margin: 0, color: isDark ? '#ffffff' : '#000000', fontSize: '24px', fontWeight: 'bold' }}>매출 관리</h2>
        </Col>
        <Col style={{ marginLeft: '100px' }}>
          <Space size="middle" wrap>
            <AutoComplete
              options={autoCompleteOptions}
              value={searchText}
              onChange={handleSearchChange}
              onSelect={(value) => setSearchText(value)}
              style={{ width: window.innerWidth <= 768 ? 250 : 300 }}
            >
              <Input.Search
                placeholder="거래처, 품목명, 금액, 메모 등으로 검색 (2글자 이상)"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={handleSearch}
              />
            </AutoComplete>
            <RangePicker
              style={{ width: 300 }}
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="YYYY-MM-DD"
            />
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
              {selectedRowKeys.length === filteredSales.length && filteredSales.length > 0 ? '전체 해제' : '전체 선택'}
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
              onOpenChange={(visible) => {
                if (visible) {
                  setTimeout(() => {
                    const okButton = document.querySelector('.ant-popconfirm .ant-btn-primary') as HTMLButtonElement;
                    if (okButton) {
                      okButton.focus();
                    }
                  }, 0);
                }
              }}
            >
              <Button danger disabled={selectedRowKeys.length === 0}>
                선택 삭제 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'full',
                    label: '전체 인쇄',
                    onClick: () => {
                      if (selectedRowKeys.length === 0) {
                        message.warning('목록을 선택후 인쇄버튼을 누르세요', 2);
                        return;
                      }
                      const selectedSale = sales.find(s => s.id === selectedRowKeys[0]);
                      if (selectedSale) {
                        setSelectedSaleForStatement(selectedSale);
                        setPrintMode('full');
                        setPrintPreviewOpen(true);
                      }
                    }
                  },
                  {
                    key: 'receiver',
                    label: '공급받는자 보관용',
                    onClick: () => {
                      if (selectedRowKeys.length === 0) {
                        message.warning('목록을 선택후 인쇄버튼을 누르세요', 2);
                        return;
                      }
                      const selectedSale = sales.find(s => s.id === selectedRowKeys[0]);
                      if (selectedSale) {
                        setSelectedSaleForStatement(selectedSale);
                        setPrintMode('receiver');
                        setPrintPreviewOpen(true);
                      }
                    }
                  },
                  {
                    key: 'supplier',
                    label: '공급자 보관용',
                    onClick: () => {
                      if (selectedRowKeys.length === 0) {
                        message.warning('목록을 선택후 인쇄버튼을 누르세요', 2);
                        return;
                      }
                      const selectedSale = sales.find(s => s.id === selectedRowKeys[0]);
                      if (selectedSale) {
                        setSelectedSaleForStatement(selectedSale);
                        setPrintMode('supplier');
                        setPrintPreviewOpen(true);
                      }
                    }
                  }
                ]
              }}
            >
              <Button
                icon={<PrinterOutlined />}
                size="middle"
                style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
              >
                인쇄 <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </Col>
      </Row>

      {loading && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
          <Spin size="large" />
        </div>
      )}

      <Table
        id="sales-table"
        columns={columns}
        dataSource={filteredSales}
        rowKey="id"
        loading={false}
        rowSelection={rowSelection}
        showSorterTooltip={false}
        onRow={(record) => ({
          onClick: (e) => handleRowClick(record, e),
          onDoubleClick: () => handleEdit(record),
          style: { cursor: 'pointer' }
        })}
        scroll={{ x: 1200 }}
        size={window.innerWidth <= 768 ? "small" : "middle"}
        pagination={{
          pageSize: window.innerWidth <= 768 ? 5 : 10,
          pageSizeOptions: ['5', '10', '20', '50'],
          showSizeChanger: true,
          showQuickJumper: window.innerWidth > 768,
          showTotal: (total, range) => {
            const searchInfo = searchText ? ` (전체 ${sales.length}건 중 검색결과)` : '';
            return window.innerWidth <= 768
              ? `${total}건`
              : `${range[0]}-${range[1]} / ${total}건${searchInfo}`;
          },
        }}
      />

      <Modal
        title={editingSale ? '매출 수정' : '매출 등록'}
        open={modalVisible}
        onCancel={closeModal}
        closable={true}
        maskClosable={false}
        keyboard={true}
        destroyOnHidden={true}
        footer={null}
        width={window.innerWidth <= 768 ? '95%' : 1400}
        style={{ top: window.innerWidth <= 768 ? 20 : 30 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
              <Form.Item
                name="customerId"
                label="거래처"
                rules={[{ required: true, message: '거래처를 선택해주세요!' }]}
              >
                <Select
                  placeholder="거래처 선택"
                  showSearch
                  allowClear
                  loading={loading}
                  optionFilterProp="children"
                  size={window.innerWidth <= 768 ? "small" : "middle"}
                  filterOption={(input, option) =>
                    (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {customers
                    .filter(customer => customer.customerType === '매출처' || customer.customerType === '기타')
                    .map(customer => (
                      <Option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.customerCode})
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
              <Form.Item
                name="saleDate"
                label="매출일자"
                rules={[{ required: true, message: '매출일자를 선택해주세요!' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  size={window.innerWidth <= 768 ? "small" : "middle"}
                />
              </Form.Item>
            </Col>
          </Row>

          <Card title="매출 품목" style={{ marginBottom: 16 }}>
            <Row gutter={8} style={{ marginBottom: 8, fontWeight: 'bold' }}>
              <Col span={4}>품목명</Col>
              <Col span={2}>규격</Col>
              <Col span={2}>단위</Col>
              <Col span={2}>과세</Col>
              <Col span={2}>수량</Col>
              <Col span={2}>단가</Col>
              <Col span={3}>공급가액</Col>
              <Col span={2}>세액</Col>
              <Col span={3}>합계금액</Col>
              <Col span={2}>작업</Col>
            </Row>
            {saleItems.map((item, index) => (
              <Row key={index} gutter={8} style={{ marginBottom: 8 }}>
                <Col span={4}>
                  <Select
                    placeholder="품목 선택"
                    value={item.productId || undefined}
                    onChange={(value) => handleItemChange(index, 'productId', value)}
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {products.map(product => (
                      <Option key={product.id} value={product.id}>
                        {product.name} ({product.productCode})
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={2}>
                  <Select
                    value={item.spec || undefined}
                    onChange={(value) => handleItemChange(index, 'spec', value)}
                    placeholder="규격"
                    allowClear
                    showSearch
                    style={{ width: '100%' }}
                  >
                    <Option value="box">box</Option>
                    <Option value="ea">ea</Option>
                    <Option value="pallet">pallet</Option>
                    <Option value="자루">자루</Option>
                    <Option value="set">set</Option>
                    <Option value="pack">pack</Option>
                  </Select>
                </Col>
                <Col span={2}>
                  <Select
                    value={item.unit || undefined}
                    onChange={(value) => handleItemChange(index, 'unit', value)}
                    placeholder="단위"
                    allowClear
                    showSearch
                    style={{ width: '100%' }}
                  >
                    <Option value="EA">EA</Option>
                    <Option value="BOX">BOX</Option>
                    <Option value="KG">KG</Option>
                    <Option value="M">M</Option>
                    <Option value="SET">SET</Option>
                    <Option value="kg">kg</Option>
                    <Option value="ea">ea</Option>
                    <Option value="box">box</Option>
                    <Option value="set">set</Option>
                    <Option value="pcs">pcs</Option>
                    <Option value="개">개</Option>
                  </Select>
                </Col>
                <Col span={2}>
                  <div style={{
                    padding: '4px 8px',
                    height: '32px',
                    lineHeight: '24px',
                    backgroundColor: item.productId ?
                      (() => {
                        const taxType = products.find(p => p.id === item.productId)?.taxType;
                        if (isDark) {
                          switch (taxType) {
                            case 'tax_separate': return '#1f4e79';
                            case 'tax_inclusive': return '#2d5016';
                            case 'tax_free': return '#5c3317';
                            default: return '#2f2f2f';
                          }
                        } else {
                          switch (taxType) {
                            case 'tax_separate': return '#e6f7ff';
                            case 'tax_inclusive': return '#f6ffed';
                            case 'tax_free': return '#fff2e8';
                            default: return '#f5f5f5';
                          }
                        }
                      })() : (isDark ? '#2f2f2f' : '#f5f5f5'),
                    border: `1px solid ${isDark ? '#424242' : '#d9d9d9'}`,
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '12px',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.productId ?
                      (() => {
                        const taxType = products.find(p => p.id === item.productId)?.taxType;
                        switch (taxType) {
                          case 'tax_separate': return '과세';
                          case 'tax_inclusive': return '포함';
                          case 'tax_free': return '면세';
                          default: return '-';
                        }
                      })() : '-'}
                  </div>
                </Col>
                <Col span={2}>
                  <InputNumber
                    placeholder="수량"
                    value={item.quantity}
                    onChange={(value) => handleItemChange(index, 'quantity', value || 0)}
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={2}>
                  <InputNumber
                    placeholder="단가"
                    value={item.unitPrice}
                    onChange={(value) => handleItemChange(index, 'unitPrice', value || 0)}
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value: string | undefined) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  />
                </Col>
                <Col span={3}>
                  <InputNumber
                    placeholder="공급가액"
                    value={item.supplyAmount}
                    disabled
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Col>
                <Col span={2}>
                  <InputNumber
                    placeholder="세액"
                    value={item.vatAmount}
                    disabled
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Col>
                <Col span={3}>
                  <InputNumber
                    placeholder="합계금액"
                    value={item.totalAmount}
                    disabled
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Col>
                <Col span={2}>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={addItem}
                    htmlType="button"
                    style={{ marginRight: 4 }}
                  />
                  {saleItems.length > 1 && (
                    <Button
                      type="primary"
                      danger
                      icon={<MinusCircleOutlined />}
                      size="small"
                      onClick={() => removeItem(index)}
                      htmlType="button"
                    />
                  )}
                </Col>
              </Row>
            ))}
          </Card>

          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <strong>공급가액: {(totalAmount || 0).toLocaleString()}원</strong>
              </Col>
              <Col span={8}>
                <strong>부가세: {(vatAmount || 0).toLocaleString()}원</strong>
              </Col>
              <Col span={8}>
                <strong style={{ fontSize: '16px' }}>
                  총 금액: {((totalAmount || 0) + (vatAmount || 0)).toLocaleString()}원
                </strong>
              </Col>
            </Row>
          </Card>

          <Form.Item
            name="memo"
            label="메모"
          >
            <TextArea rows={3} placeholder="메모를 입력하세요" />
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: 0, paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Space size="middle" style={{ justifyContent: 'center' }}>
              <Button size="middle" onClick={closeModal}>
                취소
              </Button>
              <Button size="middle" type="primary" htmlType="submit">
                저장
              </Button>
              {!editingSale && (
                <Button
                  size="middle"
                  type="default"
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                  onClick={() => {
                    form.validateFields().then(values => {
                      handleSubmit(values, true);
                    }).catch(info => {
                      logger.debug('Validate Failed:', info);
                    });
                  }}
                >
                  저장 후 초기화
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Modal>

      {/* 엑셀 업로드 미리보기 모달 */}
      <Modal
        title="엑셀 업로드 미리보기"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setUploadData([]);
        }}
        onOk={handleUploadConfirm}
        width={window.innerWidth <= 768 ? '95%' : 1200}
        okText="업로드 실행"
        cancelText="취소"
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">
            총 {uploadData.length}건의 데이터가 업로드됩니다. 확인 후 '업로드 실행' 버튼을 클릭하세요.
          </Typography.Text>
        </div>
        <Table
          dataSource={uploadData}
          scroll={{ x: window.innerWidth <= 768 ? 800 : 1000, y: 400 }}
          pagination={{ pageSize: window.innerWidth <= 768 ? 5 : 10 }}
          rowKey="index"
          size="small"
          columns={[
            { title: 'No', dataIndex: 'index', width: 50 },
            { title: '매출일', dataIndex: 'saleDate', width: 100 },
            { title: '거래처명', dataIndex: 'customerName', width: 120 },
            { title: '품목명', dataIndex: 'productName', width: 120 },
            { title: '수량', dataIndex: 'quantity', width: 80 },
            {
              title: '단가',
              dataIndex: 'unitPrice',
              width: 100,
              render: (price: number) => price ? price.toLocaleString() + '원' : '0원'
            },
            {
              title: '공급가액',
              dataIndex: 'totalAmount',
              width: 100,
              render: (amount: number) => amount ? amount.toLocaleString() + '원' : '0원'
            },
            {
              title: '부가세',
              dataIndex: 'vatAmount',
              width: 100,
              render: (amount: number) => amount ? amount.toLocaleString() + '원' : '0원'
            },
            { title: '비고', dataIndex: 'memo', width: 150, ellipsis: true }
          ]}
        />
      </Modal>

      {/* 엑셀 업로드 모달 */}
      <ExcelUploadModal
        visible={excelUploadModalVisible}
        onCancel={() => setExcelUploadModalVisible(false)}
        onSuccess={handleExcelUpload}
        title="매출 엑셀 업로드"
        templateType="sales"
        description="매출 정보를 엑셀 파일로 일괄 업로드할 수 있습니다. 먼저 템플릿을 다운로드하여 양식을 확인하세요."
        requiredFields={['거래처명', '상품명']}
      />

      <PrintPreviewModal
        open={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        transactionData={selectedSaleForStatement ? {
          id: selectedSaleForStatement.id || 0,
          date: selectedSaleForStatement.transactionDate || selectedSaleForStatement.saleDate || '',
          companyName: selectedSaleForStatement.customer?.name || '',
          companyAddress: selectedSaleForStatement.customer?.address || '',
          companyPhone: selectedSaleForStatement.customer?.phone || '',
          companyRegistrationNumber: selectedSaleForStatement.customer?.businessNumber || '',
          ceoName: selectedSaleForStatement.customer?.representative || '',
          items: selectedSaleForStatement.items?.map((item: any) => {
            const taxType = item.product?.taxType || item.taxType || 'tax_separate';
            const isTaxFree = taxType === 'tax_free';
            const isTaxInclusive = taxType === 'tax_inclusive';

            return {
              itemName: item.itemName || item.productName || item.product?.name || '',
              specification: item.spec || item.specification || item.product?.spec || '',
              spec: item.spec || item.specification || item.product?.spec || '',
              unit: item.unit || item.product?.unit || 'EA',
              quantity: item.quantity || 0,
              unitPrice: item.unitPrice || 0,
              amount: item.amount || (item.quantity * item.unitPrice) || 0,
              supplyAmount: item.supplyAmount,
              vatAmount: item.vatAmount,
              totalAmount: item.totalAmount,
              taxExempt: isTaxFree,
              taxType: taxType,
              taxInclusive: isTaxInclusive
            };
          }) || [],
          totalAmount: selectedSaleForStatement.totalAmount || 0,
          tax: selectedSaleForStatement.vatAmount || 0,
          grandTotal: (selectedSaleForStatement.totalAmount || 0) + (selectedSaleForStatement.vatAmount || 0),
          balanceAmount: 0,
          memo: '',
          notice: ''
        } : null}
        type="sales"
        printMode={printMode}
      />

      {transactionStatementModalVisible && selectedSaleForStatement && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => {
          setTransactionStatementVisible(false);
          setSelectedSaleForStatement(null);
        }}>
          <div onClick={(e) => e.stopPropagation()}>
            <TransactionStatement
              data={selectedSaleForStatement}
              type="sales"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesManagement;