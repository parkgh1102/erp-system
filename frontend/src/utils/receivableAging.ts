import dayjs from 'dayjs';

/**
 * 미수금/미지급 잔액 및 연령분석 계산 유틸.
 *
 * 금액 규칙은 거래원장(transactionLedgerController)과 동일하게 맞춘다:
 *   문서 합계 = 공급가액(totalAmount) + 세액(vatAmount)
 *   미수금 = Σ(매출 합계) − Σ(수금)
 *   미지급 = Σ(매입 합계) − Σ(지급)
 *
 * 연령분석은 수금액을 가장 오래된 매출부터 FIFO로 차감하고,
 * 남은 미수금을 각 매출의 경과일수 구간에 배분한다.
 */

export interface AgingBuckets {
  b0_30: number;   // 0~30일
  b31_60: number;  // 31~60일
  b61_90: number;  // 61~90일
  b90plus: number; // 90일 초과
}

/** 매출/매입 문서에서 합계(공급가액 + 세액)를 안전하게 추출 */
export interface AmountDoc {
  totalAmount?: number | string | null;
  vatAmount?: number | string | null;
}

export const docTotal = (d: AmountDoc): number =>
  (Number(d.totalAmount) || 0) + (Number(d.vatAmount) || 0);

export interface DatedDoc extends AmountDoc {
  transactionDate: string | Date;
}

export interface AgingResult {
  aging: AgingBuckets;
  /** 미수금이 남아있는 가장 오래된 매출의 경과일수 (미수금이 없으면 0) */
  overdueDays: number;
}

const emptyBuckets = (): AgingBuckets => ({ b0_30: 0, b31_60: 0, b61_90: 0, b90plus: 0 });

/**
 * 미수금 연령분석.
 * @param sales         해당 거래처의 매출 문서 목록
 * @param totalReceipts 해당 거래처의 총 수금액
 * @param asOf          기준일 (기본: 오늘). 테스트 재현성을 위해 주입 가능
 */
export function computeAging(
  sales: DatedDoc[],
  totalReceipts: number,
  asOf: dayjs.Dayjs | string | Date = dayjs()
): AgingResult {
  const aging = emptyBuckets();
  const today = dayjs(asOf);

  const totalSales = sales.reduce((sum, s) => sum + docTotal(s), 0);
  const receivable = totalSales - totalReceipts;
  if (receivable <= 0) {
    return { aging, overdueDays: 0 };
  }

  const sorted = [...sales].sort(
    (a, b) => dayjs(a.transactionDate).valueOf() - dayjs(b.transactionDate).valueOf()
  );

  let remainingReceipts = Math.max(0, totalReceipts);
  let oldestUnpaid: dayjs.Dayjs | null = null;

  for (const s of sorted) {
    let unpaid = docTotal(s);
    if (remainingReceipts > 0) {
      const applied = Math.min(remainingReceipts, unpaid);
      unpaid -= applied;
      remainingReceipts -= applied;
    }
    if (unpaid <= 0) continue;

    const saleDate = dayjs(s.transactionDate);
    if (!oldestUnpaid) oldestUnpaid = saleDate;

    const age = today.diff(saleDate, 'day');
    if (age <= 30) aging.b0_30 += unpaid;
    else if (age <= 60) aging.b31_60 += unpaid;
    else if (age <= 90) aging.b61_90 += unpaid;
    else aging.b90plus += unpaid;
  }

  return {
    aging,
    overdueDays: oldestUnpaid ? today.diff(oldestUnpaid, 'day') : 0,
  };
}

/** 여러 거래처의 연령 구간을 합산 */
export function sumAging(list: AgingBuckets[]): AgingBuckets {
  return list.reduce((acc, a) => {
    acc.b0_30 += a.b0_30;
    acc.b31_60 += a.b31_60;
    acc.b61_90 += a.b61_90;
    acc.b90plus += a.b90plus;
    return acc;
  }, emptyBuckets());
}
