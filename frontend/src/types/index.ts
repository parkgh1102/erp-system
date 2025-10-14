// 공통 API 응답 타입
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션 타입
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 사용자 관련 타입
export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthUser {
  user: User;
  business?: Business;
  token: string;
}

// 사업자 관련 타입
export interface Business {
  id: number;
  userId: number;
  businessNumber: string;
  companyName: string;
  representative: string;
  businessType?: string;
  businessItem?: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  homepage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCreateData {
  businessNumber: string;
  companyName: string;
  representative: string;
  businessType?: string;
  businessItem?: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  homepage?: string;
}

// 거래처 관련 타입
export type CustomerType = '매출처' | '매입처' | '기타';

export interface Customer {
  id: number;
  businessId: number;
  customerCode: string;
  name: string;
  customerType: CustomerType;
  businessNumber?: string;
  representative?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreateData {
  customerCode?: string;
  name: string;
  customerType: CustomerType;
  businessNumber?: string;
  representative?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// 품목 관련 타입
export type TaxType = '과세' | '면세' | '영세';

export interface Product {
  id: number;
  businessId: number;
  productCode: string;
  name: string;
  spec?: string;
  unit?: string;
  buyPrice?: number;
  sellPrice?: number;
  category?: string;
  taxType: TaxType;
  memo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateData {
  productCode?: string;
  name: string;
  spec?: string;
  unit?: string;
  buyPrice?: number;
  sellPrice?: number;
  category?: string;
  taxType: TaxType;
  memo?: string;
}

// 거래 관련 타입
export interface TransactionItem {
  id: number;
  transactionId: number;
  productId?: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;
  taxAmount: number;
  unit?: string;
  specification?: string;
  remark?: string;
  product?: Product;
}

export interface TransactionItemData {
  productId?: number;
  productName: string;
  itemName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplyAmount?: number;
  taxAmount?: number;
  vatRate?: number;
  unit?: string;
  specification?: string;
  remark?: string;
}

export interface Transaction {
  id: number;
  businessId: number;
  customerId?: number;
  transactionDate: string;
  transactionType: string;
  description: string;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  invoiceNumber?: string;
  paymentMethod?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  transactionItems?: TransactionItem[];
}

export interface SalesCreateData {
  customerId: number;
  transactionDate: string;
  description?: string;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  items: TransactionItemData[];
}

export interface PurchaseCreateData {
  supplierName?: string;
  transactionDate: string;
  description?: string;
  totalAmount: number;
  vatAmount: number;
  items: TransactionItemData[];
}

// 결제 관련 타입
export type PaymentType = '수금' | '지급' | '입금' | '출금';
export type PaymentMethod = '현금' | '카드' | '계좌이체' | '어음' | '기타';

export interface Payment {
  id: number;
  businessId: number;
  customerId: number;
  paymentDate: string;
  paymentType: PaymentType;
  paymentMethod?: PaymentMethod;
  amount: number;
  description?: string;
  memo?: string;
  bankAccount?: string;
  transactionId?: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
}

export interface PaymentCreateData {
  customerId: number;
  paymentDate: string;
  paymentType: PaymentType;
  paymentMethod?: PaymentMethod;
  amount: number;
  description?: string;
  memo?: string;
  bankAccount?: string;
  transactionId?: number;
}

// 거래원장 관련 타입
export interface LedgerEntry {
  id: number;
  date: string;
  type: 'sales' | 'purchase' | 'receipt' | 'payment';
  description: string;
  customerName: string;
  amount: number;
  balance: number;
  memo?: string;
  itemInfo?: {
    itemCode: string;
    itemName: string;
    spec: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  };
}

// 대시보드 통계 타입
export interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  totalCustomers: number;
  totalProducts: number;
  monthlySales: Array<{
    month: string;
    amount: number;
  }>;
  recentTransactions: Array<{
    id: number;
    date: string;
    type: string;
    amount: number;
    customerName: string;
  }>;
}

// 폼 관련 타입
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

// 테이블 관련 타입
export interface TableColumn<T = unknown> {
  title: string;
  dataIndex: keyof T;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sorter?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
}

// 차트 관련 타입
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

// 에러 타입
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ApiError extends Error {
  statusCode: number;
  errors?: ValidationError[];
}

// Axios 에러 응답 타입
export interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
      errors?: ValidationError[];
    };
    status?: number;
  };
  message: string;
}

// 폼 이벤트 타입
export interface FormValues {
  [key: string]: unknown;
}

// 인증 관련 폼 타입
export interface PasswordChangeFormValues {
  email: string;
  companyName: string;
  businessNumber: string;
  phone: string;
}

export interface PasswordResetFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SignupFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone?: string;
  businessInfo: {
    businessNumber: string;
    companyName: string;
    representative: string;
    businessType?: string;
    businessItem?: string;
    address?: string;
    phone?: string;
    fax?: string;
  };
}

// Excel 업로드 관련 타입
export interface ExcelData {
  [key: string]: unknown;
}

export interface FileUploadProps {
  onUpload: (data: ExcelData[]) => void;
  template?: string;
}

// 앱 설정 타입
export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'ko' | 'en';
  currency: 'KRW' | 'USD';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  numberFormat: 'comma' | 'space';
}