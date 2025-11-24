import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role?: string; // 'admin', 'sales_viewer'
  businesses: Business[];
  createdAt?: string;
  updatedAt?: string;
  avatar?: string;
}

interface Business {
  id: number;
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

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentBusiness: Business | null;
  isNewUser: boolean;
  loginTime: number | null; // 로그인 시간 (timestamp)
  setAuth: (user: User, token: string, isNewUser?: boolean) => void;
  setCurrentBusiness: (business: Business) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearNewUserFlag: () => void;
  hasRole: (role: string) => boolean;
  canAccessSales: () => boolean;
  refreshToken: () => void; // 토큰 갱신
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      currentBusiness: null,
      isNewUser: false,
      loginTime: null,
      setAuth: (user, token, isNewUser = false) => set({
        user,
        token,
        isAuthenticated: true,
        currentBusiness: user.businesses?.[0] || null,
        isNewUser,
        loginTime: Date.now() // 로그인 시간 저장
      }),
      setCurrentBusiness: (business) => set({ currentBusiness: business }),
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        currentBusiness: null,
        isNewUser: false,
        loginTime: null
      }),
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
      clearNewUserFlag: () => set({ isNewUser: false }),
      hasRole: (role) => {
        const state = useAuthStore.getState();
        return state.user?.role === role;
      },
      canAccessSales: () => {
        const state = useAuthStore.getState();
        return state.user?.role === 'admin' || state.user?.role === 'sales_viewer';
      },
      refreshToken: () => {
        // 토큰 갱신 시 로그인 시간 업데이트
        set({ loginTime: Date.now() });
      }
    }),
    {
      name: 'erp-auth-storage',
    }
  )
);