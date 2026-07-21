import axios from 'axios';
import { message } from 'antd';
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
  timeout: 15000,
  withCredentials: true, // 쿠키를 포함하여 요청
  headers: {
    'Content-Type': 'application/json',
  },
});

// 재시도 설정
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// 재시도 가능한 에러인지 확인
const isRetryableError = (error: any): boolean => {
  if (!error.response) {
    // 네트워크 에러 (timeout, 연결 실패)
    return error.code === 'ECONNABORTED' || error.message?.includes('Network Error');
  }
  // 서버 에러 (503, 502, 504)
  return [502, 503, 504].includes(error.response?.status);
};

// ── access token 자동 갱신 (401 시 refresh-token 쿠키로 새 토큰 발급 후 원요청 재시도) ──
// 동시 401이 여러 개 떠도 refresh는 한 번만 수행 (single-flight)
let refreshPromise: Promise<string | null> | null = null;
const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    // api 인스턴스가 아닌 raw axios로 호출해 인터셉터 재귀를 피한다.
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true })
      .then((res) => {
        const newToken: string | null = res.data?.data?.token || null;
        if (newToken) {
          useAuthStore.getState().refreshToken(newToken);
        }
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// 재시도 로직
const retryRequest = async (error: any, retryCount: number = 0): Promise<any> => {
  if (retryCount >= MAX_RETRIES || !isRetryableError(error)) {
    return Promise.reject(error);
  }

  const delay = RETRY_DELAY * Math.pow(2, retryCount); // 지수 백오프
  await new Promise(resolve => setTimeout(resolve, delay));

  const config = { ...error.config, _retryCount: retryCount + 1 };
  return api.request(config);
};

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

// 429 에러 방지용 플래그
let rateLimitErrorShown = false;

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // skipErrorHandler가 설정된 요청은 에러 처리를 건너뜀
    if (error.config?.skipErrorHandler) {
      return Promise.reject(error);
    }

    // 재시도 로직 (네트워크 에러, 서버 에러)
    const retryCount = error.config?._retryCount || 0;
    if (isRetryableError(error) && retryCount < MAX_RETRIES) {
      return retryRequest(error, retryCount);
    }

    // 429 에러 처리 (한 번만 표시)
    if (error.response?.status === 429) {
      if (!rateLimitErrorShown) {
        rateLimitErrorShown = true;
        console.error('Rate limit exceeded. Please wait...');
        setTimeout(() => {
          rateLimitErrorShown = false;
        }, 5000);
      }
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const original = error.config || {};
    const reqUrl: string = typeof original.url === 'string' ? original.url : '';
    // 로그인/토큰갱신 자체의 실패는 갱신 대상이 아님 (무한 루프 방지)
    const isAuthEndpoint =
      reqUrl.includes('/auth/login') || reqUrl.includes('/auth/refresh-token');

    // 401(토큰 만료)이면 한 번만 조용히 refresh 후 원요청 재시도
    if (status === 401 && !original._retriedAuth && !isAuthEndpoint) {
      original._retriedAuth = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
          return api.request(original);
        }
      } catch {
        // refresh 실패 → 아래에서 로그아웃 처리
      }
    }

    // 401(인증 실패)만 로그아웃한다.
    // 403은 '권한 부족'이지 세션 만료가 아니다 — 조회 전용 계정이 쓰기를 시도했을 때
    // 강제 로그아웃되던 문제가 있었다.
    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 전역 에러 알림.
    // 개별 catch가 없는 호출이 조용히 실패해 사용자가 실패 자체를 인지하지 못하던 문제를 막는다.
    // 개별 catch가 이미 메시지를 띄우는 경우와 겹치지 않도록 같은 문구는 3초간 억제한다.
    notifyRequestError(status, error);

    return Promise.reject(error);
  }
);

// 최근에 띄운 에러 문구 (중복 토스트 억제용)
const recentErrorMessages = new Map<string, number>();

function notifyRequestError(status: number | undefined, error: any) {
  let text: string;
  if (status === 403) {
    text = error.response?.data?.message || '이 작업을 수행할 권한이 없습니다.';
  } else if (status && status >= 500) {
    text = error.response?.data?.message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  } else if (!error.response) {
    text = '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.';
  } else {
    // 4xx는 각 화면이 상황에 맞는 문구를 띄우는 편이라 전역에서는 다루지 않는다
    return;
  }

  const now = Date.now();
  const last = recentErrorMessages.get(text);
  if (last && now - last < 3000) return;
  recentErrorMessages.set(text, now);

  message.error(text);
}

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data, {
      // 로그인 실패(401)는 예상되는 응답이므로 인터셉터에서 리다이렉트하지 않도록 함
      skipErrorHandler: true
    } as any),
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
    api.get(`/transaction-ledger/${businessId}/customer/${customerId}/balance`),
  getCustomersBalance: (businessId: number, params?: PaginationQuery) =>
    api.get(`/transaction-ledger/${businessId}/ledger/balances`, { params }),
  getCustomersWithTransactions: (businessId: number, params: { startDate: string; endDate: string }) =>
    api.get(`/transaction-ledger/${businessId}/customers-with-transactions`, { params }),
};

// 대시보드 조회 파라미터 (PaginationQuery엔 기간 필드가 없어 별도 정의)
export interface DashboardQuery {
  period?: 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  limit?: number;
  search?: string;
}

export const dashboardAPI = {
  getStats: (businessId: number, params?: DashboardQuery) =>
    api.get(`/businesses/${businessId}/dashboard/stats`, { params }),
  getRecentTransactions: (businessId: number, params?: DashboardQuery) =>
    api.get(`/businesses/${businessId}/dashboard/recent-transactions`, { params }),
  getSalesChart: (businessId: number, params?: DashboardQuery) =>
    api.get(`/businesses/${businessId}/dashboard/sales-chart`, { params }),
  getCategoryData: (businessId: number, params?: DashboardQuery) =>
    api.get(`/businesses/${businessId}/dashboard/category-data`, { params }),
  getMonthlyTrend: (businessId: number, params?: DashboardQuery) =>
    api.get(`/businesses/${businessId}/dashboard/monthly-trend`, { params }),
  getTopCustomers: (businessId: number, params?: DashboardQuery) =>
    api.get(`/businesses/${businessId}/dashboard/top-customers`, { params }),
  // 백엔드 라우트는 있었으나 이 메서드가 없어 '전체보기' 모달이 TypeError로 항상 비어 있었음
  getAllTransactions: (businessId: number, params?: DashboardQuery) =>
    api.get(`/businesses/${businessId}/dashboard/all-transactions`, { params }),
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
  uploadSealImage: (businessId: number, file: File) => {
    const formData = new FormData();
    formData.append('seal', file);
    return api.post(`/businesses/${businessId}/seal`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteSealImage: (businessId: number) =>
    api.delete(`/businesses/${businessId}/seal`),
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
  // 사용자(매출조회) 전화번호 기반 비밀번호 재설정 요청 → 본인 전화번호로 OTP 발송
  requestPhoneReset: async (data: { phone: string }) => {
    const response = await api.post('/auth/request-phone-reset', data);
    return response.data;
  },
  confirmPasswordResetOtp: async (data: { email: string; code: string }) => {
    const response = await api.post('/auth/confirm-password-reset-otp', data);
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
  getSecuritySettingsByEmail: (email: string) =>
    api.get(`/settings/security/${encodeURIComponent(email)}`),
  exportCustomers: (businessId: number) =>
    api.get(`/settings/${businessId}/export/customers`, { responseType: 'blob' }),
  exportProducts: (businessId: number) =>
    api.get(`/settings/${businessId}/export/products`, { responseType: 'blob' }),
  exportTransactions: (businessId: number) =>
    api.get(`/settings/${businessId}/export/transactions`, { responseType: 'blob' }),
  exportAll: (businessId: number) =>
    api.get(`/settings/${businessId}/export/all`, { responseType: 'blob' }),
  resetAllData: (businessId: number, confirmText: string) =>
    api.post(`/settings/${businessId}/reset-data`, { confirmText }),
  deleteAccount: (businessId: number, confirmText: string) =>
    api.post(`/settings/${businessId}/delete-account`, { confirmText }),
  backupData: (businessId: number) =>
    api.get(`/settings/${businessId}/backup`, { responseType: 'blob' }),
  restoreData: (businessId: number, backupData: any) =>
    api.post(`/settings/${businessId}/restore`, backupData),
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

export const quotationAPI = {
  getAll: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/quotations`, { params }),
  getById: (businessId: number, id: number) =>
    api.get(`/businesses/${businessId}/quotations/${id}`),
  create: (businessId: number, data: any) =>
    api.post(`/businesses/${businessId}/quotations`, data),
  update: (businessId: number, id: number, data: any) =>
    api.put(`/businesses/${businessId}/quotations/${id}`, data),
  delete: (businessId: number, id: number) =>
    api.delete(`/businesses/${businessId}/quotations/${id}`),
  getNextNumber: (businessId: number) =>
    api.get(`/businesses/${businessId}/quotations/next-number`),
};

export const purchaseOrderAPI = {
  getAll: (businessId: number, params?: PaginationQuery) =>
    api.get(`/businesses/${businessId}/purchase-orders`, { params }),
  getById: (businessId: number, id: number) =>
    api.get(`/businesses/${businessId}/purchase-orders/${id}`),
  create: (businessId: number, data: any) =>
    api.post(`/businesses/${businessId}/purchase-orders`, data),
  update: (businessId: number, id: number, data: any) =>
    api.put(`/businesses/${businessId}/purchase-orders/${id}`, data),
  delete: (businessId: number, id: number) =>
    api.delete(`/businesses/${businessId}/purchase-orders/${id}`),
  getNextNumber: (businessId: number) =>
    api.get(`/businesses/${businessId}/purchase-orders/next-number`),
};

export const backupAPI = {
  getConfig: (businessId: number) =>
    api.get(`/backup/${businessId}/config`),
  updateConfig: (businessId: number, data: {
    enabled?: boolean;
    scheduleType?: string;
    scheduleTime?: string;
    scheduleDay?: number;
    retentionCount?: number;
  }) =>
    api.put(`/backup/${businessId}/config`, data),
  getHistory: (businessId: number, params?: { page?: number; limit?: number }) =>
    api.get(`/backup/${businessId}/history`, { params }),
  createBackup: (businessId: number) =>
    api.post(`/backup/${businessId}/backup`),
  restoreBackup: (businessId: number, historyId: number) =>
    api.post(`/backup/${businessId}/restore/${historyId}`),
  downloadBackup: (businessId: number, historyId: number) =>
    api.get(`/backup/${businessId}/download/${historyId}`, { responseType: 'blob' }),
  deleteBackup: (businessId: number, historyId: number) =>
    api.delete(`/backup/${businessId}/history/${historyId}`),
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