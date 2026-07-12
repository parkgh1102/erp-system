import React, { useCallback, useEffect, useState } from 'react';
import {
  DashboardOutlined,
  TeamOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  WalletOutlined,
  SolutionOutlined,
  BankOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';

// 모바일 하단바 / 더보기 메뉴에서 공통으로 쓰는 메뉴 메타.
// 아이콘 색은 지정하지 않음 → 담기는 위치(활성 파랑 / 비활성 회색)의 색을 상속.
export interface NavItemMeta {
  key: string;
  icon: React.ReactNode;
  label: string;
}

export const NAV_ITEMS: Record<string, NavItemMeta> = {
  '/dashboard': { key: '/dashboard', icon: <DashboardOutlined />, label: '대시보드' },
  '/customers': { key: '/customers', icon: <TeamOutlined />, label: '거래처' },
  '/products': { key: '/products', icon: <ShoppingOutlined />, label: '품목' },
  '/sales': { key: '/sales', icon: <ShoppingCartOutlined />, label: '매출' },
  '/purchases': { key: '/purchases', icon: <FileTextOutlined />, label: '매입' },
  '/inventory': { key: '/inventory', icon: <ShoppingOutlined />, label: '재고' },
  '/payments': { key: '/payments', icon: <WalletOutlined />, label: '수금/지급' },
  '/transaction-ledger': { key: '/transaction-ledger', icon: <FileTextOutlined />, label: '거래원장' },
  '/quotations': { key: '/quotations', icon: <SolutionOutlined />, label: '견적서' },
  '/purchase-orders': { key: '/purchase-orders', icon: <FileTextOutlined />, label: '발주서' },
  '/customer-balance': { key: '/customer-balance', icon: <BankOutlined />, label: '잔액' },
  '/settings': { key: '/settings', icon: <SettingOutlined />, label: '설정' },
  '/profile': { key: '/profile', icon: <UserOutlined />, label: '내 정보' },
};

export interface NavArrangement {
  dock: string[];
  drawer: string[];
}

interface RoleNavConfig {
  dockCapacity: number;
  defaultDock: string[];
  defaultDrawer: string[];
}

// 역할별 기본 배치. defaultDrawer 가 비어 있으면 편집(더보기) 미지원.
const ROLE_NAV: Record<string, RoleNavConfig> = {
  admin: {
    dockCapacity: 4,
    defaultDock: ['/dashboard', '/customers', '/sales', '/transaction-ledger'],
    defaultDrawer: [
      '/purchases',
      '/inventory',
      '/products',
      '/payments',
      '/quotations',
      '/purchase-orders',
      '/customer-balance',
      '/settings',
      '/profile',
    ],
  },
  sales_viewer: {
    dockCapacity: 5,
    defaultDock: ['/customers', '/sales', '/transaction-ledger', '/customer-balance', '/profile'],
    defaultDrawer: [],
  },
};

const storageKey = (role: string) => `erp:mobileNav:${role}`;

// dock 를 정확히 dockCapacity 개로 유지. 초과분은 drawer 앞으로, 부족분은 drawer 앞에서 보충.
export function normalizeCapacity(arr: NavArrangement, capacity: number): NavArrangement {
  const dock = [...arr.dock];
  const drawer = [...arr.drawer];
  while (dock.length > capacity) drawer.unshift(dock.pop() as string);
  while (dock.length < capacity && drawer.length > 0) dock.push(drawer.shift() as string);
  return { dock, drawer };
}

function loadArrangement(role: string, cfg: RoleNavConfig): NavArrangement {
  const available = [...cfg.defaultDock, ...cfg.defaultDrawer];
  const fallback: NavArrangement = { dock: [...cfg.defaultDock], drawer: [...cfg.defaultDrawer] };
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(storageKey(role));
  } catch {
    return fallback;
  }
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<NavArrangement>;
    const seen = new Set<string>();
    const clean = (list: unknown): string[] =>
      (Array.isArray(list) ? list : [])
        .filter((k): k is string => typeof k === 'string' && available.includes(k))
        .filter((k) => (seen.has(k) ? false : (seen.add(k), true)));
    let dock = clean(parsed.dock);
    let drawer = clean(parsed.drawer);
    // 저장 이후 새로 추가된 메뉴는 drawer 끝에 보충
    for (const k of available) {
      if (!seen.has(k)) {
        drawer.push(k);
        seen.add(k);
      }
    }
    return normalizeCapacity({ dock, drawer }, cfg.dockCapacity);
  } catch {
    return fallback;
  }
}

export interface UseMobileNavResult {
  dock: string[];
  drawer: string[];
  dockCapacity: number;
  editable: boolean;
  /** 새 배치를 저장(정규화 포함) */
  save: (next: NavArrangement) => void;
  /** 기본값으로 초기화 후 새 배치 반환 */
  reset: () => NavArrangement;
}

/**
 * 모바일 하단바(dock) + 더보기(drawer) 메뉴 순서를 역할별 localStorage 에 저장.
 * 핸드폰 홈화면처럼 편집 모드에서 두 구역 사이로 아이콘을 옮길 수 있게 지원.
 */
export function useMobileNav(role: string | undefined): UseMobileNavResult {
  const resolvedRole = role && ROLE_NAV[role] ? role : 'admin';
  const cfg = ROLE_NAV[resolvedRole];
  const [arr, setArr] = useState<NavArrangement>(() => loadArrangement(resolvedRole, cfg));

  useEffect(() => {
    setArr(loadArrangement(resolvedRole, cfg));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedRole]);

  const save = useCallback(
    (next: NavArrangement) => {
      const norm = normalizeCapacity(next, cfg.dockCapacity);
      setArr(norm);
      try {
        localStorage.setItem(storageKey(resolvedRole), JSON.stringify(norm));
      } catch {
        /* 저장 실패는 무시(무한 저장 방지) */
      }
    },
    [resolvedRole, cfg.dockCapacity]
  );

  const reset = useCallback((): NavArrangement => {
    const def: NavArrangement = { dock: [...cfg.defaultDock], drawer: [...cfg.defaultDrawer] };
    setArr(def);
    try {
      localStorage.removeItem(storageKey(resolvedRole));
    } catch {
      /* 무시 */
    }
    return def;
  }, [resolvedRole, cfg.defaultDock, cfg.defaultDrawer]);

  return {
    dock: arr.dock,
    drawer: arr.drawer,
    dockCapacity: cfg.dockCapacity,
    editable: cfg.defaultDrawer.length > 0,
    save,
    reset,
  };
}

export default useMobileNav;
