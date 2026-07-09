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
  sealImage?: string;
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
  refreshToken: (token?: string) => void; // 토큰 갱신 (새 access token 반영)
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
      refreshToken: (token?: string) =>
        // 세션 연장/자동 갱신 시: 서버가 준 새 access token을 반드시 저장해야 한다.
        // (이전엔 loginTime만 갱신하고 token을 안 바꿔서, 연장해도 원본 토큰을 계속 써
        //  로그인+만료시간에 도달하면 요청이 401로 실패하던 버그가 있었음)
        set((state) => ({
          token: token ?? state.token,
          loginTime: Date.now()
        }))
    }),
    {
      name: 'erp-auth-storage',
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);