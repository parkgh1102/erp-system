import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { theme, ThemeConfig } from 'antd';
import { antdSeedToken, brand, radius, shadow } from '../styles/tokens';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  getThemeConfig: () => ThemeConfig;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      getThemeConfig: () => {
        const { isDark } = get();
        return {
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            ...antdSeedToken,
          },
          components: {
            Layout: {
              headerBg: isDark ? '#1f1f1f' : '#ffffff',
              bodyBg: isDark ? '#141414' : '#f5f6f8',
            },
            Menu: {
              itemBg: isDark ? '#1f1f1f' : '#ffffff',
              itemColor: isDark ? '#d1d5db' : '#1f2937',
              itemHoverColor: isDark ? '#ffffff' : brand.primary,
              itemSelectedColor: isDark ? '#ffffff' : brand.primary,
              itemHoverBg: isDark ? '#2a2a2a' : '#eef4fb',
              itemSelectedBg: isDark ? brand.primaryActive : '#e6f0fa',
              horizontalItemSelectedBg: isDark ? 'transparent' : '#e6f0fa',
              itemBorderRadius: radius.sm,
              colorActiveBarBorderSize: 0,
            },
            Card: {
              borderRadiusLG: radius.lg,
              boxShadowTertiary: shadow.card,
            },
            Button: {
              borderRadius: radius.md,
              primaryShadow: 'none',
            },
            Modal: {
              borderRadiusLG: radius.lg,
            },
            Table: {
              borderRadius: radius.md,
              headerBg: isDark ? '#262626' : '#f7f8fa',
              headerColor: isDark ? '#d1d5db' : '#4b5563',
            },
            Input: {
              borderRadius: radius.md,
            },
            Select: {
              borderRadius: radius.md,
            },
          },
        };
      },
    }),
    {
      name: 'erp-theme-storage',
    }
  )
);