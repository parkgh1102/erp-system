import { create } from 'zustand';
import { customerAPI, productAPI } from '../utils/api';

/**
 * 거래처·품목 마스터 데이터 캐시.
 *
 * 배경: 매출/매입/견적/발주/결제/거래원장/재고/잔액 등 8개 화면이 진입할 때마다
 * customerAPI.getAll(limit:10000) + productAPI.getAll(limit:10000)로 전건을 다시
 * 내려받아 화면 전환이 느렸다(캐싱 계층 없음). 이 데이터는 세션 내 거의 불변이라
 * businessId별로 캐시하고, TTL 내에는 재조회 없이 재사용한다.
 *
 * 무효화: 거래처 변경은 CustomerManagement, 품목 변경은 ProductManagement에서만
 * 일어나므로(나머지 화면은 읽기 전용), 그 두 곳에서 invalidate를 호출하면
 * 다음 조회 때 최신값을 다시 받는다. 안전장치로 TTL(5분)도 둔다.
 */

const TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  businessId: number;
  data: T[];
  fetchedAt: number;
  // 동시 다발 요청이 각각 fetch하지 않도록 진행 중 프라미스를 공유
  inflight?: Promise<T[]>;
}

interface MasterDataState {
  customers: CacheEntry<any> | null;
  products: CacheEntry<any> | null;
  loadCustomers: (businessId: number, force?: boolean) => Promise<any[]>;
  loadProducts: (businessId: number, force?: boolean) => Promise<any[]>;
  invalidateCustomers: () => void;
  invalidateProducts: () => void;
}

const isFresh = (entry: CacheEntry<any> | null, businessId: number): boolean =>
  !!entry && entry.businessId === businessId && Date.now() - entry.fetchedAt < TTL_MS;

export const useMasterDataStore = create<MasterDataState>((set, get) => ({
  customers: null,
  products: null,

  loadCustomers: async (businessId: number, force = false) => {
    const cached = get().customers;
    if (!force && isFresh(cached, businessId)) return cached!.data;
    // 이미 같은 businessId로 조회 중이면 그 프라미스를 재사용
    if (!force && cached?.inflight && cached.businessId === businessId) return cached.inflight;

    const inflight = (async () => {
      const res = await customerAPI.getAll(businessId, { page: 1, limit: 10000 });
      const data = res.data?.data?.customers || [];
      set({ customers: { businessId, data, fetchedAt: Date.now() } });
      return data;
    })();

    set({ customers: { businessId, data: cached?.data || [], fetchedAt: cached?.fetchedAt || 0, inflight } });
    return inflight;
  },

  loadProducts: async (businessId: number, force = false) => {
    const cached = get().products;
    if (!force && isFresh(cached, businessId)) return cached!.data;
    if (!force && cached?.inflight && cached.businessId === businessId) return cached.inflight;

    const inflight = (async () => {
      const res = await productAPI.getAll(businessId, { page: 1, limit: 10000 });
      const data = res.data?.data?.products || [];
      set({ products: { businessId, data, fetchedAt: Date.now() } });
      return data;
    })();

    set({ products: { businessId, data: cached?.data || [], fetchedAt: cached?.fetchedAt || 0, inflight } });
    return inflight;
  },

  invalidateCustomers: () => set({ customers: null }),
  invalidateProducts: () => set({ products: null }),
}));
