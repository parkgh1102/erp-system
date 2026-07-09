/**
 * 라우트별 lazy 청크 프리로더.
 * 사이드바 메뉴 항목에 마우스를 올리면(hover) 해당 라우트의 코드 청크를 미리 로드해,
 * 클릭 시 [청크 다운로드 → 마운트 → fetch] 중 첫 단계를 앞당겨 전환 체감을 개선한다.
 *
 * 각 import 경로는 App.tsx의 lazy() 경로와 동일한 모듈을 가리키므로,
 * Vite가 동일 청크로 dedupe → 프리로드가 실제 라우트 청크를 데운다.
 */
const loaders: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('../components/Dashboard/Dashboard'),
  '/customers': () => import('../components/Customer/CustomerManagement'),
  '/products': () => import('../components/Product/ProductManagement'),
  '/sales': () => import('../components/Sales/SalesManagement'),
  '/purchases': () => import('../components/Purchase/PurchaseManagement'),
  '/inventory': () => import('../components/Inventory/InventoryManagement'),
  '/payments': () => import('../components/Payment/PaymentManagement'),
  '/transaction-ledger': () => import('../components/TransactionLedger/TransactionLedgerManagement'),
  '/quotations': () => import('../components/Quotation/QuotationManagement'),
  '/purchase-orders': () => import('../components/PurchaseOrder/PurchaseOrderManagement'),
  '/customer-balance': () => import('../components/CustomerBalance/CustomerBalanceManagement'),
  '/settings': () => import('../components/Settings/Settings'),
  '/profile': () => import('../components/Profile/Profile'),
};

// 이미 프리페치한 경로는 재요청하지 않음
const prefetched = new Set<string>();

export function prefetchRoute(path: string): void {
  if (prefetched.has(path)) return;
  const load = loaders[path];
  if (!load) return;
  prefetched.add(path);

  const run = () => {
    load().catch(() => {
      // 실패 시 재시도 가능하도록 표시 해제 (네트워크 일시 오류 등)
      prefetched.delete(path);
    });
  };

  // 유휴 시점에 로드해 사용자의 현재 조작을 방해하지 않음
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void })
    .requestIdleCallback;
  if (typeof ric === 'function') {
    ric(run, { timeout: 500 });
  } else {
    setTimeout(run, 0);
  }
}
