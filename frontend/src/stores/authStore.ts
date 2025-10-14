import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  businesses: Business[];
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
  setAuth: (user: User, token: string, isNewUser?: boolean) => void;
  setCurrentBusiness: (business: Business) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearNewUserFlag: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      currentBusiness: null,
      isNewUser: false,
      setAuth: (user, token, isNewUser = false) => set({
        user,
        token,
        isAuthenticated: true,
        currentBusiness: user.businesses?.[0] || null,
        isNewUser
      }),
      setCurrentBusiness: (business) => set({ currentBusiness: business }),
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        currentBusiness: null,
        isNewUser: false
      }),
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
      clearNewUserFlag: () => set({ isNewUser: false })
    }),
    {
      name: 'erp-auth-storage',
    }
  )
);