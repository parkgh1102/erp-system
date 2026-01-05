import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, Input, Space, Popconfirm, Card, Row, Col, InputNumber, AutoComplete, Spin, Typography, Dropdown, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined, SearchOutlined, ExportOutlined, ImportOutlined, DownOutlined, PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import ExcelUploadModal from '../Common/ExcelUploadModal';
import DateRangeFilter from '../Common/DateRangeFilter';
import { createExportMenuItems } from '../../utils/exportUtils';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import api, { salesAPI, customerAPI, productAPI } from '../../utils/api';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);
import { PrintPreviewModal } from '../Print/PrintPreviewModal';
import { ESignaturePreviewModal } from '../Print/ESignaturePreviewModal';
import TransactionStatement from '../Print/TransactionStatement';
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

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface SaleItem {
  productId: number;
  productCode: string;
  productName: string;
  itemName?: string;     // 백엔드 필드명
  spec?: string;
  specification?: string; // 백엔드 필드명
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
  memo?: string;
  businessId: number;
  createdAt: string;
  updatedAt: string;
  signedBy?: number;
  signedAt?: string;
  signedByUser?: User;
  signatureImage?: string;
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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [excelUploadModalVisible, setExcelUploadModalVisible] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'full' | 'receiver' | 'supplier'>('full');
  const [transactionStatementModalVisible, setTransactionStatementVisible] = useState(false);
  const [selectedSaleForStatement, setSelectedSaleForStatement] = useState<Sale | null>(null);
  const [transactionDataForPrint, setTransactionDataForPrint] = useState<any[]>([]); // 인쇄용 거래 데이터 (잔액 포함)
  const [eSignaturePreviewOpen, setESignaturePreviewOpen] = useState(false);
  const [eSignatureTransactionData, setESignatureTransactionData] = useState<any>(null);
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
  const { currentBusiness, user } = useAuthStore();
  const isSalesViewer = user?.role === 'sales_viewer';
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
        customerAPI.getAll(currentBusiness.id, { page: 1, limit: 10000 }),
        productAPI.getAll(currentBusiness.id, { page: 1, limit: 10000 })
      ]);

      const salesData = salesRes.data.data.sales || [];

      // 서명 정보가 있는 매출 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        const signedSales = salesData.filter((s: Sale) => s.signatureImage);
        console.log('📊 매출 데이터 로드:', {
          전체매출수: salesData.length,
          서명된매출수: signedSales.length
        });
      }

      setSales(salesData);
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

  // 전자서명 준비: 첫 번째 선택된 매출에 대해 전잔금 조회 후 전자서명 프리뷰 열기
  const prepareESignature = async () => {
    if (!currentBusiness) return;

    if (selectedRowKeys.length === 0) {
      message.warning('전자서명할 거래명세표를 선택해주세요', 2);
      return;
    }

    if (selectedRowKeys.length > 1) {
      message.warning('전자서명은 한 건씩만 가능합니다', 2);
      return;
    }

    try {
      setLoading(true);

      const selectedSale = sales.find(s => s.id === selectedRowKeys[0]);
      if (!selectedSale) {
        message.error('선택한 매출을 찾을 수 없습니다', 2);
        setLoading(false);
        return;
      }

      // 서명 정보 디버깅 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 전자서명 모달 열기:', {
          id: selectedSale.id,
          hasSignature: !!selectedSale.signatureImage,
          signedBy: selectedSale.signedBy
        });
      }

      let balanceAmount = 0;

      // 거래처가 있는 경우에만 전잔금 조회
      if (selectedSale.customerId) {
        try {
          const response = await api.get(
            `/transaction-ledger/${currentBusiness.id}/customer/${selectedSale.customerId}/balance`,
            {
              params: {
                beforeDate: selectedSale.transactionDate || selectedSale.saleDate
              }
            }
          );
          if (response.data.success) {
            balanceAmount = response.data.data.balance || 0;
          }
        } catch (error) {
          console.error('❌ 전잔금 조회 실패:', error);
          // 실패해도 0으로 계속 진행
        }
      } else {
        console.log('⚠️ 거래처 ID가 없어 전잔금 조회를 건너뜁니다.');
      }

      // TransactionData 형식으로 변환
      const transactionData = {
        id: selectedSale.id || 0,
        date: selectedSale.transactionDate || selectedSale.saleDate || '',
        companyName: selectedSale.customer?.name || '',
        companyAddress: selectedSale.customer?.address || '',
        companyPhone: selectedSale.customer?.phone || '',
        companyRegistrationNumber: selectedSale.customer?.businessNumber || '',
        ceoName: selectedSale.customer?.representative || '',
        items: selectedSale.items?.map((item: any) => {
          const taxType = item.product?.taxType || item.taxType || 'tax_separate';
          const isTaxFree = taxType === 'tax_free';
          const isTaxInclusive = taxType === 'tax_inclusive';

          // 기본 금액 계산
          const baseAmount = Number(item.amount) || (Number(item.quantity) * Number(item.unitPrice)) || 0;

          // supplyAmount, vatAmount, totalAmount 계산
          let calculatedSupplyAmount: number;
          let calculatedVatAmount: number;
          let calculatedTotalAmount: number;

          if (isTaxFree) {
            calculatedSupplyAmount = baseAmount;
            calculatedVatAmount = 0;
            calculatedTotalAmount = baseAmount;
          } else if (isTaxInclusive) {
            calculatedTotalAmount = baseAmount;
            calculatedSupplyAmount = Math.round(baseAmount / 1.1);
            calculatedVatAmount = calculatedTotalAmount - calculatedSupplyAmount;
          } else {
            calculatedSupplyAmount = baseAmount;
            calculatedVatAmount = Math.round(baseAmount * 0.1);
            calculatedTotalAmount = calculatedSupplyAmount + calculatedVatAmount;
          }

          // 백엔드에서 저장된 값 사용 (백엔드는 taxAmount, 프론트엔드는 vatAmount)
          const savedSupplyAmount = Number(item.supplyAmount) || 0;
          // 면세인 경우 세액은 무조건 0
          const savedVatAmount = isTaxFree ? 0 : (Number(item.vatAmount) || Number(item.taxAmount) || 0);
          const savedTotalAmount = savedSupplyAmount + savedVatAmount;

          return {
            itemName: item.itemName || item.productName || item.product?.name || '',
            specification: item.spec || item.specification || item.product?.spec || '',
            spec: item.spec || item.specification || item.product?.spec || '',
            unit: item.unit || item.product?.unit || 'EA',
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            amount: baseAmount,
            supplyAmount: savedSupplyAmount || calculatedSupplyAmount,
            vatAmount: isTaxFree ? 0 : (savedVatAmount || calculatedVatAmount),
            totalAmount: savedTotalAmount || calculatedTotalAmount,
            taxExempt: isTaxFree,
            taxType: taxType,
            taxInclusive: isTaxInclusive
          };
        }) || [],
        totalAmount: Number(selectedSale.totalAmount) || 0,
        tax: Number(selectedSale.vatAmount) || 0,
        grandTotal: (Number(selectedSale.totalAmount) || 0) + (Number(selectedSale.vatAmount) || 0),
        balanceAmount: balanceAmount,
        signatureImage: selectedSale.signatureImage,
        signedBy: selectedSale.signedBy,
        signedByUser: selectedSale.signedByUser,
        signedAt: selectedSale.signedAt,
        memo: '',
        notice: ''
      };

      setESignatureTransactionData(transactionData);
      setESignaturePreviewOpen(true);
      setLoading(false);

    } catch (error) {
      setLoading(false);
      message.error('전자서명 준비 중 오류가 발생했습니다.', 2);
      console.error('전자서명 준비 오류:', error);
    }
  };

  // 더블클릭시 전자서명 모달 열기
  const openESignatureForRecord = async (record: Sale) => {
    if (!currentBusiness) return;

    try {
      setLoading(true);

      let balanceAmount = 0;

      // 거래처가 있는 경우에만 전잔금 조회
      if (record.customerId) {
        try {
          const response = await api.get(
            `/transaction-ledger/${currentBusiness.id}/customer/${record.customerId}/balance`,
            {
              params: {
                beforeDate: record.transactionDate || record.saleDate
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

      // TransactionData 형식으로 변환
      const transactionData = {
        id: record.id || 0,
        date: record.transactionDate || record.saleDate || '',
        companyName: record.customer?.name || '',
        companyAddress: record.customer?.address || '',
        companyPhone: record.customer?.phone || '',
        companyRegistrationNumber: record.customer?.businessNumber || '',
        ceoName: record.customer?.representative || '',
        items: record.items?.map((item: any) => {
          const taxType = item.product?.taxType || item.taxType || 'tax_separate';
          const isTaxFree = taxType === 'tax_free';
          const isTaxInclusive = taxType === 'tax_inclusive';

          // 기본 금액 계산
          const baseAmount = Number(item.amount) || (Number(item.quantity) * Number(item.unitPrice)) || 0;

          // supplyAmount, vatAmount, totalAmount 계산
          let calculatedSupplyAmount: number;
          let calculatedVatAmount: number;
          let calculatedTotalAmount: number;

          if (isTaxFree) {
            calculatedSupplyAmount = baseAmount;
            calculatedVatAmount = 0;
            calculatedTotalAmount = baseAmount;
          } else if (isTaxInclusive) {
            calculatedTotalAmount = baseAmount;
            calculatedSupplyAmount = Math.round(baseAmount / 1.1);
            calculatedVatAmount = calculatedTotalAmount - calculatedSupplyAmount;
          } else {
            calculatedSupplyAmount = baseAmount;
            calculatedVatAmount = Math.round(baseAmount * 0.1);
            calculatedTotalAmount = calculatedSupplyAmount + calculatedVatAmount;
          }

          // 백엔드에서 저장된 값 사용 (백엔드는 taxAmount, 프론트엔드는 vatAmount)
          const savedSupplyAmount = Number(item.supplyAmount) || 0;
          // 면세인 경우 세액은 무조건 0
          const savedVatAmount = isTaxFree ? 0 : (Number(item.vatAmount) || Number(item.taxAmount) || 0);
          const savedTotalAmount = savedSupplyAmount + savedVatAmount;

          return {
            itemName: item.itemName || item.productName || item.product?.name || '',
            specification: item.spec || item.specification || item.product?.spec || '',
            spec: item.spec || item.specification || item.product?.spec || '',
            unit: item.unit || item.product?.unit || 'EA',
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            amount: baseAmount,
            supplyAmount: savedSupplyAmount || calculatedSupplyAmount,
            vatAmount: isTaxFree ? 0 : (savedVatAmount || calculatedVatAmount),
            totalAmount: savedTotalAmount || calculatedTotalAmount,
            taxExempt: isTaxFree,
            taxType: taxType,
            taxInclusive: isTaxInclusive
          };
        }) || [],
        totalAmount: Number(record.totalAmount) || 0,
        tax: Number(record.vatAmount) || 0,
        grandTotal: (Number(record.totalAmount) || 0) + (Number(record.vatAmount) || 0),
        balanceAmount: balanceAmount,
        signatureImage: record.signatureImage,
        signedBy: record.signedBy,
        signedByUser: record.signedByUser,
        signedAt: record.signedAt,
        memo: '',
        notice: ''
      };

      setESignatureTransactionData(transactionData);
      setESignaturePreviewOpen(true);
      setLoading(false);

    } catch (error) {
      setLoading(false);
      message.error('전자서명 준비 중 오류가 발생했습니다.', 2);
      console.error('전자서명 준비 오류:', error);
    }
  };

  // 인쇄 준비: 전잔금 조회 후 인쇄 프리뷰 열기
  const preparePrintWithBalance = async (selectedSales: Sale[], mode: 'full' | 'receiver' | 'supplier') => {
    if (!currentBusiness) return;

    try {
      setLoading(true);

      // 각 매출에 대해 전잔금 조회
      const transactionDataPromises = selectedSales.map(async (sale) => {
        let balanceAmount = 0;

        // 거래처가 있는 경우에만 전잔금 조회
        if (sale.customerId) {
          try {
            const response = await api.get(
              `/transaction-ledger/${currentBusiness.id}/customer/${sale.customerId}/balance`,
              {
                params: {
                  beforeDate: sale.transactionDate || sale.saleDate
                }
              }
            );
            console.log('💰 전잔금 API 응답:', {
              customerId: sale.customerId,
              beforeDate: sale.transactionDate || sale.saleDate,
              response: response.data
            });
            if (response.data.success) {
              balanceAmount = response.data.data.balance || 0;
              console.log('✅ 전잔금 설정:', balanceAmount);
            }
          } catch (error) {
            console.error('❌ 전잔금 조회 실패:', error);
            // 실패해도 0으로 계속 진행
          }
        } else {
          console.log('⚠️ 거래처 ID가 없어 전잔금 조회를 건너뜁니다.');
        }

        // TransactionData 형식으로 변환
        return {
          id: sale.id || 0,
          date: sale.transactionDate || sale.saleDate || '',
          companyName: sale.customer?.name || '',
          companyAddress: sale.customer?.address || '',
          companyPhone: sale.customer?.phone || '',
          companyRegistrationNumber: sale.customer?.businessNumber || '',
          ceoName: sale.customer?.representative || '',
          items: sale.items?.map((item: any) => {
            const taxType = item.product?.taxType || item.taxType || 'tax_separate';
            const isTaxFree = taxType === 'tax_free';
            const isTaxInclusive = taxType === 'tax_inclusive';

            // 기본 금액 계산
            const baseAmount = Number(item.amount) || (Number(item.quantity) * Number(item.unitPrice)) || 0;

            // supplyAmount, vatAmount, totalAmount 계산
            let calculatedSupplyAmount: number;
            let calculatedVatAmount: number;
            let calculatedTotalAmount: number;

            if (isTaxFree) {
              calculatedSupplyAmount = baseAmount;
              calculatedVatAmount = 0;
              calculatedTotalAmount = baseAmount;
            } else if (isTaxInclusive) {
              calculatedTotalAmount = baseAmount;
              calculatedSupplyAmount = Math.round(baseAmount / 1.1);
              calculatedVatAmount = calculatedTotalAmount - calculatedSupplyAmount;
            } else {
              calculatedSupplyAmount = baseAmount;
              calculatedVatAmount = Math.round(baseAmount * 0.1);
              calculatedTotalAmount = calculatedSupplyAmount + calculatedVatAmount;
            }

            // 백엔드에서 저장된 값 사용 (백엔드는 taxAmount, 프론트엔드는 vatAmount)
            const savedSupplyAmount = Number(item.supplyAmount) || 0;
            // 면세인 경우 세액은 무조건 0
            const savedVatAmount = isTaxFree ? 0 : (Number(item.vatAmount) || Number(item.taxAmount) || 0);
            const savedTotalAmount = savedSupplyAmount + savedVatAmount;

            return {
              itemName: item.itemName || item.productName || item.product?.name || '',
              specification: item.spec || item.specification || item.product?.spec || '',
              spec: item.spec || item.specification || item.product?.spec || '',
              unit: item.unit || item.product?.unit || 'EA',
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unitPrice) || 0,
              amount: baseAmount,
              supplyAmount: savedSupplyAmount || calculatedSupplyAmount,
              vatAmount: isTaxFree ? 0 : (savedVatAmount || calculatedVatAmount),
              totalAmount: savedTotalAmount || calculatedTotalAmount,
              taxExempt: isTaxFree,
              taxType: taxType,
              taxInclusive: isTaxInclusive
            };
          }) || [],
          totalAmount: Number(sale.totalAmount) || 0,
          tax: Number(sale.vatAmount) || 0,
          grandTotal: (Number(sale.totalAmount) || 0) + (Number(sale.vatAmount) || 0),
          balanceAmount: balanceAmount, // 조회한 전잔금
          memo: '',
          notice: ''
        };
      });

      const transactionData = await Promise.all(transactionDataPromises);

      setTransactionDataForPrint(transactionData);
      setPrintMode(mode);
      setPrintPreviewOpen(true);
      setLoading(false);

      message.info(`${selectedSales.length}건의 거래명세서를 인쇄합니다.`, 2);
    } catch (error) {
      setLoading(false);
      message.error('인쇄 준비 중 오류가 발생했습니다.', 2);
      console.error('인쇄 준비 오류:', error);
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
            logger.warn(errorMsg);
            errors.push(errorMsg);
            failCount++;
            continue;
          }

          // 품목 찾기 (선택사항)
          const product = row['품목명'] ? products.find(p => p.name === row['품목명']) : null;

          // 면세 여부 확인 (품목의 taxType 또는 엑셀의 세금구분 컬럼)
          const excelTaxType = row['세금구분'] || '';
          const isTaxFree = product?.taxType === 'tax_free' ||
                           excelTaxType === '면세' ||
                           excelTaxType === 'tax_free';

          // 합계에서 공급가액과 세액 역산
          const totalPrice = Number(row['합계']) || 0;
          let supplyAmount, vatAmount;

          if (isTaxFree) {
            // 면세: 공급가액 = 합계 또는 입력값, 세액 = 0
            supplyAmount = Number(row['공급가액']) || totalPrice;
            vatAmount = 0;
          } else {
            // 과세: 합계에서 역산
            supplyAmount = Number(row['공급가액']) || Math.round(totalPrice / 1.1);
            vatAmount = Number(row['세액']) || (totalPrice - supplyAmount);
          }
          const quantity = Number(row['수량']) || 1;
          const unitPrice = Number(row['단가']) || 0;

          await salesAPI.create(currentBusiness.id, {
            customerId: customer.id,
            saleDate: row['매출일자'] || dayjs().format('YYYY-MM-DD'),
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
          logger.error('Sales upload error:', error);
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

  const handleRowClick = (record: Sale, event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        (typeof target.className === 'string' && target.className.includes('ant-checkbox')) ||
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

    // 합계금액 직접 입력 시 공급가액과 세액 역산
    if (field === 'totalAmount') {
      const selectedProduct = products.find(p => p.id === newItems[index].productId);
      const taxType = selectedProduct?.taxType || newItems[index].taxType || 'tax_separate';
      const totalAmount = value || 0;

      if (taxType === 'tax_free') {
        // 면세: 공급가액 = 합계, 세액 = 0
        newItems[index].supplyAmount = totalAmount;
        newItems[index].vatAmount = 0;
      } else {
        // 과세: 합계에서 공급가액과 세액 역산
        const supplyAmount = Math.round(totalAmount / 1.1);
        const vatAmount = totalAmount - supplyAmount;
        newItems[index].supplyAmount = supplyAmount;
        newItems[index].vatAmount = vatAmount;
      }
    }

    // 공급가액 직접 입력 시 세액과 합계금액 계산
    if (field === 'supplyAmount') {
      const selectedProduct = products.find(p => p.id === newItems[index].productId);
      const taxType = selectedProduct?.taxType || newItems[index].taxType || 'tax_separate';
      const supplyAmount = value || 0;

      if (taxType === 'tax_free') {
        // 면세: 세액 = 0, 합계 = 공급가액
        newItems[index].vatAmount = 0;
        newItems[index].totalAmount = supplyAmount;
      } else {
        // 과세: 세액 = 공급가액 * 0.1, 합계 = 공급가액 + 세액
        const vatAmount = Math.round(supplyAmount * 0.1);
        newItems[index].vatAmount = vatAmount;
        newItems[index].totalAmount = supplyAmount + vatAmount;
      }
    }

    // 세액 직접 입력 시 합계금액 계산
    if (field === 'vatAmount') {
      const supplyAmount = newItems[index].supplyAmount || 0;
      const vatAmount = value || 0;
      newItems[index].totalAmount = supplyAmount + vatAmount;
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
        const currentSaleDate = values.saleDate; // 기존 날짜 유지
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
        // 기존 날짜 유지
        form.setFieldsValue({
          saleDate: currentSaleDate
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

  const allColumns = [
    {
      title: '매출일자',
      key: 'transactionDate',
      width: '10%',
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
      title: '거래처명',
      key: 'customerName',
      width: '12%',
      align: 'center' as const,
      render: (record: Sale) => record.customer?.name || '-',
      sorter: (a: Sale, b: Sale) => (a.customer?.name || '').localeCompare(b.customer?.name || ''),
    },
    {
      title: '품목명',
      dataIndex: 'items',
      key: 'productName',
      width: '12%',
      align: 'center' as const,
      render: (items: SaleItem[]) => {
        if (!items || items.length === 0) return '-';

        const firstItem = items[0];
        if (items.length === 1) {
          return firstItem.itemName || firstItem.productName || '-';
        } else {
          return `${firstItem.itemName || firstItem.productName || '품목'} 외 ${items.length - 1}`;
        }
      },
      sorter: (a: Sale, b: Sale) => {
        const aFirstItem = (a.items && (a.items[0]?.itemName || a.items[0]?.productName)) || '';
        const bFirstItem = (b.items && (b.items[0]?.itemName || b.items[0]?.productName)) || '';
        return aFirstItem.localeCompare(bFirstItem);
      },
    },
    {
      title: '규격',
      dataIndex: 'items',
      key: 'spec',
      width: '8%',
      align: 'center' as const,
      render: (items: SaleItem[]) => {
        if (!items || items.length === 0) return '-';
        // specification 또는 spec 둘 다 확인
        return items[0]?.specification || items[0]?.spec || '-';
      },
    },
    {
      title: '단위',
      dataIndex: 'items',
      key: 'unit',
      width: '6%',
      align: 'center' as const,
      render: (items: SaleItem[]) => {
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
      render: (items: SaleItem[]) => {
        if (!items || items.length === 0) return '-';
        // decimal 타입을 Number()로 변환
        const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        // 소숫점이 있으면 소숫점 2자리까지, 없으면 정수로 표시
        return totalQty % 1 === 0 ? totalQty.toLocaleString() : totalQty.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
      },
    },
    {
      title: '단가',
      dataIndex: 'items',
      key: 'unitPrice',
      width: '9%',
      align: 'right' as const,
      render: (items: SaleItem[]) => {
        if (!items || items.length === 0) return '-';
        return Math.round(Number(items[0]?.unitPrice) || 0).toLocaleString() + '원';
      },
    },
    {
      title: '공급가액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: '10%',
      align: 'right' as const,
      render: (amount: number) => {
        const value = Math.round(Number(amount) || 0);
        return <span style={{ color: value < 0 ? '#ff4d4f' : 'inherit' }}>{value.toLocaleString()}원</span>;
      },
      sorter: (a: Sale, b: Sale) => (Number(a.totalAmount) || 0) - (Number(b.totalAmount) || 0),
    },
    {
      title: '세액',
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: '9%',
      align: 'right' as const,
      render: (amount: number) => {
        const value = Math.round(Number(amount) || 0);
        return <span style={{ color: value < 0 ? '#ff4d4f' : 'inherit' }}>{value.toLocaleString()}원</span>;
      },
      sorter: (a: Sale, b: Sale) => (Number(a.vatAmount) || 0) - (Number(b.vatAmount) || 0),
    },
    {
      title: '합계',
      key: 'total',
      width: '10%',
      align: 'right' as const,
      render: (record: Sale) => {
        const total = Math.round((Number(record.totalAmount) || 0) + (Number(record.vatAmount) || 0));
        return <span style={{ color: total < 0 ? '#ff4d4f' : 'inherit' }}>{total.toLocaleString()}원</span>;
      },
      sorter: (a: Sale, b: Sale) => {
        const totalA = (Number(a.totalAmount) || 0) + (Number(a.vatAmount) || 0);
        const totalB = (Number(b.totalAmount) || 0) + (Number(b.vatAmount) || 0);
        return totalA - totalB;
      },
    },
    {
      title: '비고',
      key: 'memo',
      width: '10%',
      align: 'center' as const,
      render: (record: Sale) => {
        const memo = record.memo || '-';
        // 전자서명이 완료된 경우 V 체크 표시 with Tooltip
        if (record.signedBy && record.signedByUser && record.signedAt) {
          const signedDate = dayjs(record.signedAt).format('YYYY-MM-DD HH:mm:ss');
          const tooltipContent = (
            <div>
              <div>담당자: {record.signedByUser.name}</div>
              <div>날짜: {signedDate}</div>
            </div>
          );
          return (
            <Tooltip title={tooltipContent}>
              <span style={{ color: '#52c41a', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>
                ✓{memo !== '-' ? ` ${memo}` : ''}
              </span>
            </Tooltip>
          );
        }
        return memo;
      },
    },
    {
      title: '작업',
      key: 'action',
      width: '7%',
      align: 'center' as const,
      hidden: isSalesViewer, // sales_viewer는 작업 컬럼 숨김
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

  // sales_viewer인 경우 작업 컬럼 제외
  const columns = allColumns.filter(col => !col.hidden);

  const actionMenuItems = createExportMenuItems(
    filteredSales,
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
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space size={window.innerWidth <= 768 ? 4 : 8} wrap>
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
                  size={window.innerWidth <= 768 ? "small" : "middle"}
                  onSearch={handleSearch}
                />
              </AutoComplete>
              <RangePicker
                style={{ width: 300 }}
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                format="YYYY-MM-DD"
                size={window.innerWidth <= 768 ? "small" : "middle"}
              />
              {!isSalesViewer && (
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size={window.innerWidth <= 768 ? "small" : "middle"}>
                  추가
                </Button>
                <Button
                  icon={<ImportOutlined />}
                  size={window.innerWidth <= 768 ? "small" : "middle"}
                  onClick={() => setExcelUploadModalVisible(true)}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                >
                  엑셀업로드
                </Button>
                <Dropdown menu={{ items: actionMenuItems }} placement="bottomRight">
                  <Button icon={<ExportOutlined />} size={window.innerWidth <= 768 ? "small" : "middle"} style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}>
                    파일저장
                  </Button>
                </Dropdown>
                <Button
                  onClick={handleSelectAll}
                  type="default"
                  size={window.innerWidth <= 768 ? "small" : "middle"}
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
                  <Button danger disabled={selectedRowKeys.length === 0} size={window.innerWidth <= 768 ? "small" : "middle"}>
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
                          // 선택된 모든 매출 가져오기
                          const selectedSales = sales.filter(s => selectedRowKeys.includes(s.id));
                          if (selectedSales.length > 0) {
                            preparePrintWithBalance(selectedSales, 'full');
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
                          // 선택된 모든 매출 가져오기
                          const selectedSales = sales.filter(s => selectedRowKeys.includes(s.id));
                          if (selectedSales.length > 0) {
                            preparePrintWithBalance(selectedSales, 'receiver');
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
                          // 선택된 모든 매출 가져오기
                          const selectedSales = sales.filter(s => selectedRowKeys.includes(s.id));
                          if (selectedSales.length > 0) {
                            preparePrintWithBalance(selectedSales, 'supplier');
                          }
                        }
                      }
                    ]
                  }}
                >
                  <Button
                    icon={<PrinterOutlined />}
                    size={window.innerWidth <= 768 ? "small" : "middle"}
                    style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
                  >
                    인쇄 <DownOutlined />
                  </Button>
                </Dropdown>
              </>
            )}
            <Button
              icon={<EditOutlined />}
              size={window.innerWidth <= 768 ? "small" : "middle"}
              onClick={prepareESignature}
              style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2', color: 'white' }}
            >
              전자서명
            </Button>
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
        id="sales-table"
        columns={columns}
        dataSource={filteredSales}
        rowKey="id"
        loading={false}
        rowSelection={rowSelection}
        showSorterTooltip={false}
        onRow={(record) => ({
          onClick: (e) => handleRowClick(record, e),
          onDoubleClick: () => openESignatureForRecord(record),
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
          total: filteredSales.length,
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
          onKeyDown={(e) => {
            // 엔터키 제출 방지
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
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
                    try {
                      const children = option?.children;
                      if (Array.isArray(children)) {
                        return children.join('').toLowerCase().includes(input.toLowerCase());
                      }
                      return String(children || '').toLowerCase().includes(input.toLowerCase());
                    } catch (error) {
                      return false;
                    }
                  }}
                >
                  {customers
                    .filter(customer => customer.customerType === '매출처' || customer.customerType === '기타')
                    .map(customer => (
                      <Option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.customerCode}) - {customer.customerType}
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
                    id={`sale-product-select-${index}`}
                    placeholder="품목 선택"
                    value={item.productId || undefined}
                    onChange={(value) => handleItemChange(index, 'productId', value)}
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) => {
                      try {
                        const children = option?.children;
                        if (Array.isArray(children)) {
                          return children.join('').toLowerCase().includes(input.toLowerCase());
                        }
                        return String(children || '').toLowerCase().includes(input.toLowerCase());
                      } catch (error) {
                        return false;
                      }
                    }}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        const nextIndex = saleItems.length;
                        addItem();
                        setTimeout(() => {
                          const nextSelect = document.querySelector(`#sale-product-select-${nextIndex}`) as HTMLElement;
                          if (nextSelect) nextSelect.click();
                        }, 150);
                      }
                    }}
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
                    onChange={(value) => handleItemChange(index, 'supplyAmount', value || 0)}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value: string | undefined) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  />
                </Col>
                <Col span={2}>
                  <InputNumber
                    placeholder="세액"
                    value={item.vatAmount}
                    onChange={(value) => handleItemChange(index, 'vatAmount', value || 0)}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value: string | undefined) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  />
                </Col>
                <Col span={3}>
                  <InputNumber
                    placeholder="합계금액"
                    value={item.totalAmount}
                    onChange={(value) => handleItemChange(index, 'totalAmount', value || 0)}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value: string | undefined) => value?.replace(/\$\s?|(,*)/g, '') as any}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        const nextIndex = saleItems.length;
                        addItem();
                        setTimeout(() => {
                          const nextSelect = document.querySelector(`#sale-product-select-${nextIndex}`) as HTMLElement;
                          if (nextSelect) nextSelect.click();
                        }, 150);
                      }
                    }}
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
            총 {uploadData.length}건의 데이터가 업로드됩니다. 확인 후 &quot;업로드 실행&quot; 버튼을 클릭하세요.
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
        requiredFields={['거래처명', '합계']}
      />

      <PrintPreviewModal
        open={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        transactionData={transactionDataForPrint}
        type="sales"
        printMode={printMode}
        supplierInfo={currentBusiness ? {
          companyName: currentBusiness.companyName,
          businessNumber: currentBusiness.businessNumber,
          representative: currentBusiness.representative,
          address: currentBusiness.address,
          phone: currentBusiness.phone
        } : undefined}
      />

      <ESignaturePreviewModal
        open={eSignaturePreviewOpen}
        onClose={() => {
          setESignaturePreviewOpen(false);
          setESignatureTransactionData(null);
        }}
        onSave={fetchData}
        transactionData={eSignatureTransactionData}
        type="sales"
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
              supplierInfo={currentBusiness ? {
                companyName: currentBusiness.companyName,
                businessNumber: currentBusiness.businessNumber,
                representative: currentBusiness.representative,
                address: currentBusiness.address,
                phone: currentBusiness.phone
              } : undefined}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesManagement;