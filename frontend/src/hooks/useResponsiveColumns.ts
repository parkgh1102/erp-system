import { useMemo } from 'react';
import { useMediaQuery } from './useMediaQuery';
import type { ResponsiveColumn } from '../components/Common/ResponsiveTable';

interface ColumnConfig<T> {
  columns: ResponsiveColumn<T>[];
  mobileMaxColumns?: number;
  tabletMaxColumns?: number;
}

export function useResponsiveColumns<T>({
  columns,
  mobileMaxColumns = 3,
  tabletMaxColumns = 6,
}: ColumnConfig<T>) {
  const { isMobile, isTablet } = useMediaQuery();

  const filteredColumns = useMemo(() => {
    if (isMobile) {
      // On mobile, filter by priority and mobileHidden
      return columns
        .filter(col => !col.mobileHidden)
        .sort((a, b) => (a.priority || 99) - (b.priority || 99))
        .slice(0, mobileMaxColumns);
    }

    if (isTablet) {
      // On tablet, show more columns but still filter by priority
      return columns
        .filter(col => !col.mobileHidden)
        .sort((a, b) => (a.priority || 99) - (b.priority || 99))
        .slice(0, tabletMaxColumns);
    }

    // On desktop, show all columns
    return columns;
  }, [columns, isMobile, isTablet, mobileMaxColumns, tabletMaxColumns]);

  const visibleColumnKeys = useMemo(() => {
    return new Set(filteredColumns.map(col => col.key));
  }, [filteredColumns]);

  const isColumnVisible = (key: string) => visibleColumnKeys.has(key);

  return {
    columns: filteredColumns,
    isColumnVisible,
    isMobile,
    isTablet,
    allColumns: columns,
  };
}

// Preset column configurations for common tables
export const salesColumns = {
  date: { priority: 1, mobilePrimary: true },
  customer: { priority: 2, mobileSecondary: true },
  totalAmount: { priority: 3, mobileBadge: true },
  description: { priority: 4 },
  actions: { priority: 1, mobileHidden: false },
};

export const customerColumns = {
  name: { priority: 1, mobilePrimary: true },
  customerCode: { priority: 2, mobileSecondary: true },
  phone: { priority: 3 },
  customerType: { priority: 4, mobileBadge: true },
  address: { priority: 5, mobileHidden: true },
  actions: { priority: 1, mobileHidden: false },
};

export const productColumns = {
  name: { priority: 1, mobilePrimary: true },
  productCode: { priority: 2, mobileSecondary: true },
  sellPrice: { priority: 3, mobileBadge: true },
  category: { priority: 4 },
  spec: { priority: 5, mobileHidden: true },
  unit: { priority: 6, mobileHidden: true },
  actions: { priority: 1, mobileHidden: false },
};

export const paymentColumns = {
  paymentDate: { priority: 1, mobilePrimary: true },
  customer: { priority: 2, mobileSecondary: true },
  amount: { priority: 3, mobileBadge: true },
  paymentType: { priority: 4 },
  description: { priority: 5, mobileHidden: true },
  actions: { priority: 1, mobileHidden: false },
};

export default useResponsiveColumns;
