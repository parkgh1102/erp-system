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

// 거래 관련 타입
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

// 결제 관련 타입
export type PaymentType = '수금' | '지급' | '입금' | '출금';
export type PaymentMethod = '현금' | '카드' | '계좌이체' | '어음' | '기타';

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

// 사용자 및 사업자 관련 타입
export interface UserCreateData {
  email: string;
  password: string;
  name: string;
  phone?: string;
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

// JWT 토큰 페이로드
export interface JwtPayload {
  userId: number;
  email: string;
  businessId?: number;
  iat?: number;
  exp?: number;
}

// Express Request/Response 확장
declare module 'express-serve-static-core' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  interface Request {
    user?: {
      userId: number;
      email: string;
      businessId: number;
      role?: string;
    };
  }
}

// Express Session 확장
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    businessId?: number;
    email?: string;
    role?: string;
    csrfToken?: string;
    csrfTokenCreatedAt?: number;
    originalIp?: string;
    originalUserAgent?: string;
  }
}

// 에러 타입
export interface ValidationError {
  field: string;
  message: string;
  value?: string | number | boolean | null;
}

export interface ApiError extends Error {
  statusCode: number;
  errors?: ValidationError[];
}