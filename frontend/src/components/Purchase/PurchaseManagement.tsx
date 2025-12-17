import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, Input, Space, Popconfirm, Card, Row, Col, InputNumber, AutoComplete, Spin, Typography, Dropdown, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined, SearchOutlined, ExportOutlined, ImportOutlined, DownOutlined, PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import ExcelUploadModal from '../Common/ExcelUploadModal';
import DateRangeFilter from '../Common/DateRangeFilter';
import { createExportMenuItems } from '../../utils/exportUtils';
import * as ExcelJS from 'exceljs';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import api, { purchaseAPI, customerAPI, productAPI } from '../../utils/api';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { PrintPreviewModal } from '../Print/PrintPreviewModal';

dayjs.extend(isBetween);

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

interface PurchaseItem {
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

interface Purchase {
  id: number;
  purchaseDate: string;
  customerId?: number;
  customer?: Customer;
  items: PurchaseItem[];
  totalAmount: number;
  vatAmount: number;
  memo?: string;
  businessId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PurchaseManagement: React.FC = () => {
  const { message } = App.useApp();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [form] = Form.useForm();
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([{
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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [excelUploadModalVisible, setExcelUploadModalVisible] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'full' | 'receiver' | 'supplier'>('full');
  const [selectedPurchaseForStatement, setSelectedPurchaseForStatement] = useState<Purchase | null>(null);
  const [specOptions, setSpecOptions] = useState<string[]>([
    // 기본 옵션
    'box', 'ea', 'pallet', '자루', 'set', 'pack',
    // 1~200 box
    ...Array.from({ length: 200 }, (_, i) => `${i + 1}box`),
    // 1~100 pallet
    ...Array.from({ length: 100 }, (_, i) => `${i + 1}pallet`),
    // 1~200 ea
    ...Array.from({ length: 200 }, (_, i) => `${i + 1}ea`),
  ]);
  const [unitOptions, setUnitOptions] = useState<string[]>(['EA', 'BOX', 'KG', 'M', 'SET', 'kg', 'ea', 'box', 'set', 'pcs', '개']);
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
        if (!editingPurchase) {
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
  }, [modalVisible, editingPurchase, form]);

  const fetchData = async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      const [purchasesRes, customersRes, productsRes] = await Promise.all([
        purchaseAPI.getAll(currentBusiness.id),
        customerAPI.getAll(currentBusiness.id),
        productAPI.getAll(currentBusiness.id)
      ]);

      setPurchases(purchasesRes.data.data.purchases || []);
      setCustomers(customersRes.data.data.customers || []);
      setProducts(productsRes.data.data.products || []);

    } catch (error) {
      message.error('데이터를 불러오는데 실패했습니다.', 2);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    // 날짜 필터링
    const purchaseDate = dayjs(purchase.purchaseDate);
    const [startDate, endDate] = dateRange;
    if (!purchaseDate.isBetween(startDate, endDate, 'day', '[]')) {
      return false;
    }

    // 검색 텍스트 필터링
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      purchase.customer?.name?.toLowerCase().includes(searchLower) ||
      purchase.memo?.toLowerCase().includes(searchLower) ||
      purchase.items?.some(item => item.productName?.toLowerCase().includes(searchLower)) ||
      purchase.totalAmount?.toString().includes(searchText) ||
      purchase.vatAmount?.toString().includes(searchText)
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

    purchases.forEach(purchase => {
      if (purchase.customer?.name?.toLowerCase().includes(searchLower)) {
        matches.add(purchase.customer.name);
      }
      purchase.items?.forEach(item => {
        if (item.productName?.toLowerCase().includes(searchLower)) {
          matches.add(item.productName);
        }
      });
      if (purchase.memo?.toLowerCase().includes(searchLower)) {
        matches.add(purchase.memo);
      }
      if (purchase.totalAmount?.toString().includes(keyword)) {
        matches.add(purchase.totalAmount.toString());
      }
      if (purchase.vatAmount?.toString().includes(keyword)) {
        matches.add(purchase.vatAmount.toString());
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
    setEditingPurchase(null);
    setPurchaseItems([{
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
        purchaseDate: dayjs()
      });
    }, 0);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    // items 데이터를 프론트엔드 형식에 맞게 매핑
    const mappedItems = purchase.items.map(item => {
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
        productName: item.productName,
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
    setPurchaseItems(mappedItems);
    setModalVisible(true);
    setTimeout(() => {
      form.setFieldsValue({
        ...purchase,
        purchaseDate: dayjs(purchase.purchaseDate),
      });
    }, 100);
  };

  const handleDelete = async (id: number) => {
    if (!currentBusiness) return;

    try {
      await purchaseAPI.delete(currentBusiness.id, id);
      fetchData();
      message.success('매입이 삭제되었습니다.', 2);
    } catch (error) {
      message.error('매입 삭제에 실패했습니다.', 2);
    }
  };

  const handleSelectAll = () => {
    const currentData = filteredPurchases;
    if (selectedRowKeys.length === currentData.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(currentData.map(purchase => purchase.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('삭제할 항목을 선택해주세요.', 2);
      return;
    }

    try {
      await Promise.all(selectedRowKeys.map(id =>
        purchaseAPI.delete(currentBusiness!.id, id as number)
      ));

      setSelectedRowKeys([]);
      fetchData();
      message.success(`${selectedRowKeys.length}개의 매입이 삭제되었습니다.`, 2);
    } catch (error) {
      message.error('매입 삭제에 실패했습니다.', 2);
    }
  };

  // 테이블 변경 핸들러 (페이지네이션, 정렬 등)
  const handleTableChange = (paginationConfig: any, filters: any, sorter: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  // 엑셀 업로드 처리
  const handleExcelUpload = async (data: any[]) => {
    if (!currentBusiness || data.length === 0) return;

    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          // 거래처 찾기
          const customer = customers.find(c => c.name === row['거래처명']);
          if (!customer) {
            const errorMsg = `${i + 1}행: 거래처 '${row['거래처명']}'를 찾을 수 없습니다.`;
            console.warn(errorMsg);
            errors.push(errorMsg);
            failCount++;
            continue;
          }

          // 품목 찾기 (선택사항)
          const product = row['품목명'] ? products.find(p => p.name === row['품목명']) : null;

          // 합계에서 공급가액과 세액 역산
          const totalPrice = Number(row['합계']) || 0;
          const supplyAmount = Number(row['공급가액']) || Math.round(totalPrice / 1.1);
          const vatAmount = Number(row['세액']) || (totalPrice - supplyAmount);
          const quantity = Number(row['수량']) || 1;
          const unitPrice = Number(row['단가']) || 0;

          await purchaseAPI.create(currentBusiness.id, {
            customerId: customer.id,
            purchaseDate: row['매입일자'] || dayjs().format('YYYY-MM-DD'),
            totalAmount: supplyAmount,
            vatAmount: vatAmount,
            memo: row['비고'] || '',
            items: [{
              productId: product?.id || null,
              productCode: product?.productCode || '',
              productName: row['품목명'] || product?.name || '품목 미지정',
              spec: row['규격'] || product?.spec || '',
              unit: row['단위'] || product?.unit || '',
              quantity: quantity,
              unitPrice: unitPrice,
              amount: quantity * unitPrice,
              supplyAmount: supplyAmount,
              vatAmount: vatAmount,
              totalAmount: supplyAmount + vatAmount
            }]
          });
          successCount++;
        } catch (error: any) {
          const errorMsg = `${i + 1}행: ${error.response?.data?.message || error.message || '업로드 실패'}`;
          errors.push(errorMsg);
          failCount++;
          console.error('Purchase upload error:', error);
        }
      }

      fetchData();

      if (failCount > 0) {
        const errorSummary = errors.slice(0, 3).join('\n');
        const moreErrors = errors.length > 3 ? `\n... 외 ${errors.length - 3}건` : '';
        message.warning(`${successCount}건 성공, ${failCount}건 실패\n\n${errorSummary}${moreErrors}`, 5);
      } else {
        message.success(`${successCount}건 업로드 완료`, 2);
      }
    } catch (error) {
      message.error('엑셀 업로드에 실패했습니다.', 2);
    } finally {
      setLoading(false);
    }
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleRowClick = (record: Purchase, event: React.MouseEvent<HTMLElement>) => {
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

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...purchaseItems];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'productId') {
      const selectedProduct = products.find(product => product.id === value);
      if (selectedProduct) {
        newItems[index].productCode = selectedProduct.productCode;
        newItems[index].productName = selectedProduct.name;
        newItems[index].spec = selectedProduct.spec || '';
        newItems[index].unit = selectedProduct.unit || '';
        newItems[index].taxType = selectedProduct.taxType || 'tax_separate';
        newItems[index].unitPrice = selectedProduct.buyPrice || 0;

        // 공급가액, 세액, 합계금액 계산
        const amount = newItems[index].quantity * (selectedProduct.buyPrice || 0);
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

    setPurchaseItems(newItems);
  };

  const addItem = () => {
    setPurchaseItems([...purchaseItems, {
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
    if (purchaseItems.length > 1) {
      const newItems = purchaseItems.filter((_, i) => i !== index);
      setPurchaseItems(newItems);
    }
  };

  const calculateTotals = () => {
    let totalSupplyAmount = 0;
    let totalVatAmount = 0;

    purchaseItems.forEach(item => {
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

      const filteredItems = purchaseItems
        .filter(item => item.productId > 0 || item.productName)
        .map(item => ({
          ...item,
          amount: item.quantity * item.unitPrice
        }));

      const purchaseData = {
        ...values,
        purchaseDate: values.purchaseDate.format('YYYY-MM-DD'),
        customer: selectedCustomer ? {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
        } : null,
        items: filteredItems,
        totalAmount: totalAmount || 0,
        vatAmount: vatAmount || 0,
        businessId: currentBusiness.id
      };

      if (editingPurchase) {
        await purchaseAPI.update(currentBusiness.id, editingPurchase.id, purchaseData);
      } else {
        await purchaseAPI.create(currentBusiness.id, purchaseData);
      }

      // 모달 즉시 닫기
      if (resetAfterSave && !editingPurchase) {
        // 저장 후 초기화 - 새로 등록할 때만
        form.resetFields();
        setPurchaseItems([{
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
          purchaseDate: dayjs()
        });
      } else {
        // 일반 저장
        setModalVisible(false);
        form.resetFields();
        setEditingPurchase(null);
        setPurchaseItems([{
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
      message.success(editingPurchase ? '매입이 수정되었습니다.' : '매입이 저장되었습니다.', 2);
      fetchData(); // await 제거하여 백그라운드에서 실행
    } catch (error) {
      message.error('매입 저장에 실패했습니다.', 2);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingPurchase(null);
    setPurchaseItems([{
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

  // 거래명세서 인쇄 미리보기
  const handlePrintStatement = async (purchase: Purchase, mode: 'full' | 'receiver' | 'supplier') => {
    try {
      // 전잔금 조회
      let balanceAmount = 0;
      if (purchase.customerId && currentBusiness) {
        try {
          const response = await api.get(
            `/transaction-ledger/${currentBusiness.id}/customer/${purchase.customerId}/balance`,
            {
              params: {
                beforeDate: purchase.purchaseDate
              }
            }
          );
          if (response.data.success) {
            balanceAmount = response.data.data.balance || 0;
          }
        } catch (error) {
          console.error('전잔금 조회 실패:', error);
          // 실패해도 0으로 계속 진행
        }
      }

      // 전잔금을 포함한 데이터 설정
      const purchaseWithBalance = {
        ...purchase,
        balanceAmount
      };

      setSelectedPurchaseForStatement(purchaseWithBalance as any);
      setPrintMode(mode);
      setPrintPreviewOpen(true);
    } catch (error) {
      console.error('거래명세서 준비 중 오류:', error);
      message.error('거래명세서를 준비하는 중 오류가 발생했습니다.');
    }
  };

  // 엑셀 업로드 관련 함수들 - 사용하지 않음 (ExcelUploadModal 사용)
  const handleFileUpload = (file: File) => {
    return false;
  };

  const handleUploadConfirm = async () => {
    if (!currentBusiness || uploadData.length === 0) return;

    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const purchaseData of uploadData) {
        try {
          // 거래처와 품목 찾기
          const customer = customers.find(c => c.name === purchaseData.customerName);
          const product = products.find(p => p.name === purchaseData.productName);

          if (!customer || !product) {
            failCount++;
            continue;
          }

          // 매입 데이터 생성
          await purchaseAPI.create(currentBusiness.id, {
            purchaseDate: purchaseData.purchaseDate,
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
              quantity: purchaseData.quantity,
              unitPrice: purchaseData.unitPrice,
              amount: purchaseData.quantity * purchaseData.unitPrice
            }],
            totalAmount: purchaseData.totalAmount,
            vatAmount: purchaseData.vatAmount,
            memo: purchaseData.memo,
            businessId: currentBusiness.id
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error('Purchase upload error:', error);
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
    // ExcelUploadModal에서 처리
  };

  const columns = [
    {
      title: '매입일자',
      key: 'purchaseDate',
      width: '10%',
      align: 'center' as const,
      render: (record: Purchase) => {
        const date = record.purchaseDate;
        return date ? dayjs(date).format('YYYY-MM-DD') : '';
      },
      sorter: (a: Purchase, b: Purchase) => {
        const dateA = a.purchaseDate || '';
        const dateB = b.purchaseDate || '';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      },
    },
    {
      title: '거래처명',
      key: 'customerName',
      width: '12%',
      align: 'center' as const,
      render: (record: Purchase) => record.customer?.name || '-',
      sorter: (a: Purchase, b: Purchase) => (a.customer?.name || '').localeCompare(b.customer?.name || ''),
    },
    {
      title: '품목명',
      dataIndex: 'items',
      key: 'productName',
      width: '12%',
      align: 'center' as const,
      render: (items: PurchaseItem[]) => {
        if (!items || items.length === 0) return '-';

        const firstItem = items[0];
        if (items.length === 1) {
          return firstItem.productName || '-';
        } else {
          return `${firstItem.productName || '품목'} 외 ${items.length - 1}`;
        }
      },
      sorter: (a: Purchase, b: Purchase) => {
        const aFirstItem = (a.items && a.items[0]?.productName) || '';
        const bFirstItem = (b.items && b.items[0]?.productName) || '';
        return aFirstItem.localeCompare(bFirstItem);
      },
    },
    {
      title: '규격',
      dataIndex: 'items',
      key: 'spec',
      width: '8%',
      align: 'center' as const,
      render: (items: PurchaseItem[]) => {
        if (!items || items.length === 0) return '-';
        return items[0]?.spec || '-';
      },
    },
    {
      title: '단위',
      dataIndex: 'items',
      key: 'unit',
      width: '6%',
      align: 'center' as const,
      render: (items: PurchaseItem[]) => {
        if (!items || items.length === 0) return '-';
        return items[0]?.unit || '-';
      },
    },
    {
      title: '수량',
      dataIndex: 'items',
      key: 'quantity',
      width: '7%',
      align: 'right' as const,
      render: (items: PurchaseItem[]) => {
        if (!items || items.length === 0) return '-';
        // decimal 타입을 Number()로 변환
        const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        return Math.round(totalQty).toLocaleString();
      },
    },
    {
      title: '단가',
      dataIndex: 'items',
      key: 'unitPrice',
      width: '9%',
      align: 'right' as const,
      render: (items: PurchaseItem[]) => {
        if (!items || items.length === 0) return '-';
        return Math.round(items[0]?.unitPrice || 0).toLocaleString() + '원';
      },
    },
    {
      title: '공급가액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: '10%',
      align: 'right' as const,
      render: (amount: number) => Math.round(amount || 0).toLocaleString() + '원',
      sorter: (a: Purchase, b: Purchase) => (a.totalAmount || 0) - (b.totalAmount || 0),
    },
    {
      title: '세액',
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: '9%',
      align: 'right' as const,
      render: (amount: number) => Math.round(amount || 0).toLocaleString() + '원',
      sorter: (a: Purchase, b: Purchase) => (a.vatAmount || 0) - (b.vatAmount || 0),
    },
    {
      title: '합계',
      key: 'total',
      width: '10%',
      align: 'right' as const,
      render: (record: Purchase) => {
        const total = (record.totalAmount || 0) + (record.vatAmount || 0);
        return Math.round(total).toLocaleString() + '원';
      },
      sorter: (a: Purchase, b: Purchase) => {
        const totalA = (a.totalAmount || 0) + (a.vatAmount || 0);
        const totalB = (b.totalAmount || 0) + (b.vatAmount || 0);
        return totalA - totalB;
      },
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
      width: '7%',
      align: 'center' as const,
      render: (_: any, record: Purchase) => (
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
    purchases,
    columns,
    '매입_목록',
    'purchase-table'
  );

  const { totalAmount, vatAmount } = calculateTotals();

  return (
    <div style={{
      padding: window.innerWidth <= 768 ? '16px 8px' : '24px',
      minHeight: 'calc(100vh - 140px)'
    }}>
      <Row align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h2 style={{ margin: 0, color: isDark ? '#ffffff' : '#000000', fontSize: '24px', fontWeight: 'bold' }}>매입 관리</h2>
        </Col>
        <Col style={{ marginLeft: '100px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
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
              {selectedRowKeys.length === filteredPurchases.length && filteredPurchases.length > 0 ? '전체 해제' : '전체 선택'}
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
                      const selectedPurchase = purchases.find(p => p.id === selectedRowKeys[0]);
                      if (selectedPurchase) {
                        handlePrintStatement(selectedPurchase, 'full');
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
                      const selectedPurchase = purchases.find(p => p.id === selectedRowKeys[0]);
                      if (selectedPurchase) {
                        handlePrintStatement(selectedPurchase, 'receiver');
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
                      const selectedPurchase = purchases.find(p => p.id === selectedRowKeys[0]);
                      if (selectedPurchase) {
                        handlePrintStatement(selectedPurchase, 'supplier');
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
            <DateRangeFilter
              onDateRangeChange={(startDate, endDate) => {
                setDateRange([dayjs(startDate), dayjs(endDate)]);
              }}
            />
          </Space>
        </Col>
      </Row>

      {loading && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
          <Spin size="large" />
        </div>
      )}

      <Table
        id="purchase-table"
        columns={columns}
        dataSource={filteredPurchases}
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
        onChange={handleTableChange}
        pagination={{
          ...pagination,
          pageSize: window.innerWidth <= 768 ? 5 : pagination.pageSize,
          pageSizeOptions: ['5', '10', '20', '50'],
          showSizeChanger: true,
          showQuickJumper: window.innerWidth > 768,
          total: filteredPurchases.length,
          showTotal: (total, range) => {
            const searchInfo = searchText ? ` (전체 ${purchases.length}건 중 검색결과)` : '';
            return window.innerWidth <= 768
              ? `${total}건`
              : `${range[0]}-${range[1]} / ${total}건${searchInfo}`;
          },
        }}
      />

      <Modal
        title={editingPurchase ? '매입 수정' : '매입 등록'}
        open={modalVisible}
        onCancel={closeModal}
        closable={true}
        maskClosable={false}
        keyboard={true}
        destroyOnHidden={true}
        footer={null}
        width={window.innerWidth <= 768 ? '100%' : 1400}
        style={{
          top: window.innerWidth <= 768 ? 0 : 30,
          maxWidth: window.innerWidth <= 768 ? '100vw' : '1400px',
          paddingBottom: 0,
          margin: window.innerWidth <= 768 ? 0 : 'auto'
        }}
        styles={{
          body: {
            maxHeight: window.innerWidth <= 768 ? 'calc(100vh - 110px)' : 'calc(100vh - 200px)',
            overflowY: 'auto'
          }
        }}
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
                  size={window.innerWidth <= 768 ? "small" : "middle"}
                  filterOption={(input, option) => {
                    const customer = customers.find(c => c.id === option?.value);
                    if (!customer) return false;
                    const searchText = `${customer.name} ${customer.customerCode} ${customer.customerType}`.toLowerCase();
                    return searchText.includes(input.toLowerCase());
                  }}
                >
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customerCode}) - {customer.customerType}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
              <Form.Item
                name="purchaseDate"
                label="매입일자"
                rules={[{ required: true, message: '매입일자를 선택해주세요!' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  size={window.innerWidth <= 768 ? "small" : "middle"}
                />
              </Form.Item>
            </Col>
          </Row>

          <Card title="매입 품목" style={{ marginBottom: 16 }}>
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
            {purchaseItems.map((item, index) => (
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
                                handleItemChange(index, 'spec', value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                        </div>
                      </>
                    )}
                  >
                    {specOptions.map(spec => (
                      <Option key={spec} value={spec}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{spec}</span>
                          <Button
                            type="text"
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSpecOptions(specOptions.filter(s => s !== spec));
                            }}
                            style={{ color: '#ff4d4f', padding: '0 4px' }}
                          />
                        </div>
                      </Option>
                    ))}
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
                                handleItemChange(index, 'unit', value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                        </div>
                      </>
                    )}
                  >
                    {unitOptions.map(unit => (
                      <Option key={unit} value={unit}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{unit}</span>
                          <Button
                            type="text"
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setUnitOptions(unitOptions.filter(u => u !== unit));
                            }}
                            style={{ color: '#ff4d4f', padding: '0 4px' }}
                          />
                        </div>
                      </Option>
                    ))}
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
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={2}>
                  <InputNumber
                    placeholder="단가"
                    value={item.unitPrice}
                    onChange={(value) => handleItemChange(index, 'unitPrice', value || 0)}
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
                  {purchaseItems.length > 1 && (
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
              {!editingPurchase && (
                <Button
                  size="middle"
                  type="default"
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                  onClick={() => {
                    form.validateFields().then(values => {
                      handleSubmit(values, true);
                    }).catch(info => {
                      console.log('Validate Failed:', info);
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
        width={window.innerWidth <= 768 ? '100%' : 1200}
        style={{
          top: window.innerWidth <= 768 ? 0 : 30,
          maxWidth: window.innerWidth <= 768 ? '100vw' : '1200px',
          margin: window.innerWidth <= 768 ? 0 : 'auto'
        }}
        styles={{
          body: {
            maxHeight: window.innerWidth <= 768 ? 'calc(100vh - 150px)' : 'calc(100vh - 200px)',
            overflowY: 'auto'
          }
        }}
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
            { title: '매입일', dataIndex: 'purchaseDate', width: 100 },
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
        title="매입 엑셀 업로드"
        templateType="purchase"
        description="매입 정보를 엑셀 파일로 일괄 업로드할 수 있습니다. 먼저 템플릿을 다운로드하여 양식을 확인하세요."
        requiredFields={['거래처명', '합계']}
      />

      <PrintPreviewModal
        open={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        transactionData={selectedPurchaseForStatement ? {
          id: selectedPurchaseForStatement.id || 0,
          date: selectedPurchaseForStatement.purchaseDate || '',
          companyName: selectedPurchaseForStatement.customer?.name || '',
          companyAddress: selectedPurchaseForStatement.customer?.address || '',
          companyPhone: selectedPurchaseForStatement.customer?.phone || '',
          companyRegistrationNumber: selectedPurchaseForStatement.customer?.businessNumber || '',
          ceoName: selectedPurchaseForStatement.customer?.representative || '',
          items: selectedPurchaseForStatement.items?.map((item: any) => {
            const taxType = item.product?.taxType || item.taxType || 'tax_separate';
            const isTaxFree = taxType === 'tax_free';
            const isTaxInclusive = taxType === 'tax_inclusive';

            return {
              itemName: item.productName || item.product?.name || '',
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
          totalAmount: selectedPurchaseForStatement.totalAmount || 0,
          tax: selectedPurchaseForStatement.vatAmount || 0,
          grandTotal: (selectedPurchaseForStatement.totalAmount || 0) + (selectedPurchaseForStatement.vatAmount || 0),
          balanceAmount: (selectedPurchaseForStatement as any).balanceAmount || 0,
          memo: '',
          notice: ''
        } : null}
        type="purchase"
        printMode={printMode}
      />

    </div>
  );
};

export default PurchaseManagement;
