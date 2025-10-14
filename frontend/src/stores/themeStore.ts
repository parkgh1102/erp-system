import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { theme, ThemeConfig } from 'antd';

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
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
          components: {
            Layout: {
              headerBg: isDark ? '#001529' : '#ffffff',
              bodyBg: isDark ? '#141414' : '#f5f5f5',
            },
            Menu: {
              itemBg: isDark ? '#001529' : '#ffffff',
              itemColor: isDark ? '#d1d5db' : '#000000',
              itemHoverColor: isDark ? '#ffffff' : '#1890ff',
              itemSelectedColor: isDark ? '#ffffff' : '#1890ff',
              itemHoverBg: isDark ? '#1f2937' : '#f0f9ff',
              itemSelectedBg: isDark ? 'transparent' : '#e6f7ff',
              horizontalItemSelectedBg: isDark ? 'transparent' : '#e6f7ff',
              colorActiveBarBorderSize: 0,
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