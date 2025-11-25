export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
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
export interface JwtPayload {
    userId: number;
    email: string;
    businessId?: number;
    iat?: number;
    exp?: number;
}
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            userId: number;
            email: string;
            businessId: number;
            role?: string;
        };
    }
}
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
export interface ValidationError {
    field: string;
    message: string;
    value?: string | number | boolean | null;
}
export interface ApiError extends Error {
    statusCode: number;
    errors?: ValidationError[];
}
//# sourceMappingURL=index.d.ts.map