import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import {
  UserCreateData,
  CustomerCreateData,
  ProductCreateData,
  SalesCreateData,
  PurchaseCreateData,
  PaymentCreateData,
  BusinessCreateData,
  PaginationQuery
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 프로덕션 환경에서 HTTPS 강제
if (import.meta.env.PROD && !API_BASE_URL.startsWith('https://') && import.meta.env.VITE_ENFORCE_HTTPS !== 'false') {
  throw new Error('프로덕션 환경에서는 HTTPS를 사용해야 합니다.');
}

// 민감 정보 패턴
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /authorization/i,
  /bearer/i
];

/**
 * 에러 메시지에서 민감 정보 제거
 */
const sanitizeErrorMessage = (message: string): string => {
  if (SENSITIVE_PATTERNS.some(pattern => pattern.test(message))) {
    return '요청 처리 중 오류가 발생했습니다.';
  }
  return message;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 쿠키를 포함하여 요청
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // FormData일 경우 Content-Type을 제거하여 브라우저가 자동으로 설정하도록 함
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // skipErrorHandler가 설정된 요청은 에러 처리를 건너뜀
    if (error.config?.skipErrorHandler) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  signup: (data: UserCreateData & { businessInfo: BusinessCreateData }) =>
    api.post('/auth/signup', data),
  checkEmailAvailability: (email: string) =>
    api.get('/auth/check-email', {
      params: { email },
      // 이메일 체크는 에러 메시지를 직접 처리하므로 인터셉터 스킵
      skipErrorHandler: true
    }),
  getProfile: () =>
    api.get('/auth/profile'),
  updateProfile: (data: Partial<UserCreateData>) =>
    api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const customerAPI = {
  getAll: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/customers`, { params }),
  getById: (businessId: number, id: number) =>
    api.get(`/businesses/${businessId}/customers/${id}`),
  create: (businessId: number, data: CustomerCreateData) =>
    api.post(`/businesses/${businessId}/customers`, data),
  update: (businessId: number, id: number, data: Partial<CustomerCreateData>) =>
    api.put(`/businesses/${businessId}/customers/${id}`, data),
  delete: (businessId: number, id: number) =>
    api.delete(`/businesses/${businessId}/customers/${id}`),
  deleteAll: (businessId: number) =>
    api.delete(`/businesses/${businessId}/customers/all`),
};

export const productAPI = {
  getAll: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/products`, { params }),
  getById: (businessId: number, id: number) =>
    api.get(`/businesses/${businessId}/products/${id}`),
  create: (businessId: number, data: ProductCreateData) =>
    api.post(`/businesses/${businessId}/products`, data),
  update: (businessId: number, id: number, data: Partial<ProductCreateData>) =>
    api.put(`/businesses/${businessId}/products/${id}`, data),
  delete: (businessId: number, id: number) =>
    api.delete(`/businesses/${businessId}/products/${id}`),
};

export const salesAPI = {
  getAll: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/sales`, { params }),
  getById: (businessId: number, id: number) =>
    api.get(`/businesses/${businessId}/sales/${id}`),
  create: (businessId: number, data: SalesCreateData) =>
    api.post(`/businesses/${businessId}/sales`, data),
  update: (businessId: number, id: number, data: Partial<SalesCreateData>) =>
    api.put(`/businesses/${businessId}/sales/${id}`, data),
  delete: (businessId: number, id: number) =>
    api.delete(`/businesses/${businessId}/sales/${id}`),
};

export const purchaseAPI = {
  getAll: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/purchases`, { params }),
  getById: (businessId: number, id: number) =>
    api.get(`/businesses/${businessId}/purchases/${id}`),
  create: (businessId: number, data: PurchaseCreateData) =>
    api.post(`/businesses/${businessId}/purchases`, data),
  update: (businessId: number, id: number, data: Partial<PurchaseCreateData>) =>
    api.put(`/businesses/${businessId}/purchases/${id}`, data),
  delete: (businessId: number, id: number) =>
    api.delete(`/businesses/${businessId}/purchases/${id}`),
};

export const paymentAPI = {
  getAll: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/payments`, { params }),
  getById: (businessId: number, id: number) =>
    api.get(`/businesses/${businessId}/payments/${id}`),
  create: (businessId: number, data: PaymentCreateData) =>
    api.post(`/businesses/${businessId}/payments`, data),
  update: (businessId: number, id: number, data: Partial<PaymentCreateData>) =>
    api.put(`/businesses/${businessId}/payments/${id}`, data),
  delete: (businessId: number, id: number) =>
    api.delete(`/businesses/${businessId}/payments/${id}`),
};

export const transactionLedgerAPI = {
  getLedger: (businessId: number, params?: PaginationQuery) =>
    api.get(`/transaction-ledger/${businessId}/ledger`, { params }),
  getLedgerDetails: (businessId: number, params?: PaginationQuery) =>
    api.get(`/transaction-ledger/${businessId}/ledger/details`, { params }),
  getLedgerSummary: (businessId: number, params?: PaginationQuery) =>
    api.get(`/transaction-ledger/${businessId}/ledger/summary`, { params }),
  getCustomerBalance: (businessId: number, customerId: number) =>
    api.get(`/transaction-ledger/${businessId}/ledger/balance/${customerId}`),
  getCustomersBalance: (businessId: number, params?: PaginationQuery) =>
    api.get(`/transaction-ledger/${businessId}/ledger/balances`, { params }),
};

export const dashboardAPI = {
  getStats: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/dashboard/stats`, { params }),
  getRecentTransactions: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/dashboard/recent-transactions`, { params }),
  getSalesChart: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/dashboard/sales-chart`, { params }),
  getCategoryData: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/dashboard/category-data`, { params }),
  getMonthlyTrend: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/dashboard/monthly-trend`, { params }),
};

export const businessAPI = {
  getAll: (params?: PaginationQuery) =>
    api.get('/businesses', { params }),
  getById: (id: number) =>
    api.get(`/businesses/${id}`),
  create: (data: BusinessCreateData) =>
    api.post('/businesses', data),
  update: (businessId: number, data: Partial<BusinessCreateData>) =>
    api.put(`/businesses/${businessId}`, data),
  delete: (id: number) =>
    api.delete(`/businesses/${id}`),
  validateBusinessNumber: (businessNumber: string) =>
    api.get(`/businesses/validate/${businessNumber}`),
};

export const passwordResetAPI = {
  findUsername: async (data: { companyName: string; businessNumber: string; phone: string }) => {
    const response = await api.post('/auth/find-username', data);
    return response.data;
  },
  verifyPasswordReset: async (data: { email: string; companyName: string; businessNumber: string; phone: string }) => {
    const response = await api.post('/auth/verify-password-reset', data);
    return response.data;
  },
  resetPassword: async (data: { resetToken: string; newPassword: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
};

export const settingsAPI = {
  getSettings: (businessId: number) =>
    api.get(`/settings/${businessId}`),
  updateSettings: (businessId: number, data: Record<string, any>) =>
    api.put(`/settings/${businessId}`, data),
  exportCustomers: (businessId: number) =>
    api.get(`/settings/${businessId}/export/customers`, { responseType: 'blob' }),
  exportProducts: (businessId: number) =>
    api.get(`/settings/${businessId}/export/products`, { responseType: 'blob' }),
  exportTransactions: (businessId: number) =>
    api.get(`/settings/${businessId}/export/transactions`, { responseType: 'blob' }),
};

export const activityLogAPI = {
  getUserLogs: (params?: { limit?: number; offset?: number }) =>
    api.get('/activity-logs/user', { params }),
  getRecentLogs: () =>
    api.get('/activity-logs/recent'),
  getBusinessLogs: (businessId: number, params?: { limit?: number; offset?: number; actionType?: string; entity?: string }) =>
    api.get(`/activity-logs/business/${businessId}`, { params }),
  createLog: (data: { actionType: string; entity: string; entityId?: number; description: string; metadata?: any }) =>
    api.post('/activity-logs', data),
  deleteLog: (logId: number) =>
    api.delete(`/activity-logs/${logId}`),
};

export const excelAPI = {
  // 템플릿 다운로드
  downloadCustomerTemplate: () =>
    api.get('/excel/template/customers', { responseType: 'blob' }),
  downloadProductTemplate: () =>
    api.get('/excel/template/products', { responseType: 'blob' }),
  downloadSalesTemplate: () =>
    api.get('/excel/template/sales', { responseType: 'blob' }),
  downloadPurchaseTemplate: () =>
    api.get('/excel/template/purchases', { responseType: 'blob' }),

  // 업로드
  uploadCustomers: (businessId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/excel/${businessId}/upload/customers`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadProducts: (businessId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/excel/${businessId}/upload/products`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadSales: (businessId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/excel/${businessId}/upload/sales`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadPurchases: (businessId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/excel/${businessId}/upload/purchases`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default api;