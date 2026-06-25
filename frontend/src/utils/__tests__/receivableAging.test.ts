import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { docTotal, computeAging, sumAging, type DatedDoc } from '../receivableAging';

// 기준일을 고정해 경과일수 계산을 재현 가능하게 한다.
const ASOF = dayjs('2026-06-25');
const daysAgo = (n: number) => ASOF.subtract(n, 'day').format('YYYY-MM-DD');

const sale = (total: number, vat: number, date: string): DatedDoc => ({
  totalAmount: total,
  vatAmount: vat,
  transactionDate: date,
});

describe('docTotal', () => {
  it('공급가액 + 세액을 합산한다', () => {
    expect(docTotal({ totalAmount: 1000, vatAmount: 100 })).toBe(1100);
  });

  it('문자열 금액(TypeORM decimal)도 숫자로 처리한다', () => {
    expect(docTotal({ totalAmount: '1000.00', vatAmount: '100.00' })).toBe(1100);
  });

  it('null/undefined는 0으로 처리한다', () => {
    expect(docTotal({ totalAmount: null, vatAmount: undefined })).toBe(0);
    expect(docTotal({})).toBe(0);
  });
});

describe('computeAging', () => {
  it('매출이 없으면 모든 구간이 0이고 연체일도 0이다', () => {
    const { aging, overdueDays } = computeAging([], 0, ASOF);
    expect(aging).toEqual({ b0_30: 0, b31_60: 0, b61_90: 0, b90plus: 0 });
    expect(overdueDays).toBe(0);
  });

  it('전액 수금되면 미수금이 없어 모든 구간이 0이다', () => {
    const sales = [sale(1000, 100, daysAgo(100))];
    const { aging, overdueDays } = computeAging(sales, 1100, ASOF);
    expect(aging).toEqual({ b0_30: 0, b31_60: 0, b61_90: 0, b90plus: 0 });
    expect(overdueDays).toBe(0);
  });

  it('수금이 전혀 없으면 매출 전액이 경과일 구간에 배분된다', () => {
    const sales = [
      sale(1000, 0, daysAgo(10)),   // 0~30
      sale(2000, 0, daysAgo(45)),   // 31~60
      sale(3000, 0, daysAgo(75)),   // 61~90
      sale(4000, 0, daysAgo(120)),  // 90 초과
    ];
    const { aging } = computeAging(sales, 0, ASOF);
    expect(aging).toEqual({ b0_30: 1000, b31_60: 2000, b61_90: 3000, b90plus: 4000 });
  });

  it('수금액을 가장 오래된 매출부터 FIFO로 차감한다', () => {
    const sales = [
      sale(1000, 0, daysAgo(120)), // 가장 오래된 매출 (90 초과)
      sale(1000, 0, daysAgo(10)),  // 최근 매출 (0~30)
    ];
    // 1000 수금 → 오래된 매출이 먼저 상계되어 90초과 구간은 0, 최근 매출만 남음
    const { aging, overdueDays } = computeAging(sales, 1000, ASOF);
    expect(aging.b90plus).toBe(0);
    expect(aging.b0_30).toBe(1000);
    expect(overdueDays).toBe(10); // 남은 미수금의 가장 오래된 매출 = 10일 전
  });

  it('부분 수금 시 일부만 상계되고 나머지는 해당 구간에 남는다', () => {
    const sales = [
      sale(1000, 0, daysAgo(50)), // 31~60
      sale(1000, 0, daysAgo(20)), // 0~30
    ];
    // 500 수금 → 오래된 매출(50일)에서 500 차감, 남은 500은 31~60 구간
    const { aging } = computeAging(sales, 500, ASOF);
    expect(aging.b31_60).toBe(500);
    expect(aging.b0_30).toBe(1000);
  });

  it('경계값: 정확히 30일/60일/90일은 낮은 구간에 포함된다', () => {
    const sales = [
      sale(100, 0, daysAgo(30)), // b0_30
      sale(100, 0, daysAgo(60)), // b31_60
      sale(100, 0, daysAgo(90)), // b61_90
    ];
    const { aging } = computeAging(sales, 0, ASOF);
    expect(aging).toEqual({ b0_30: 100, b31_60: 100, b61_90: 100, b90plus: 0 });
  });

  it('overdueDays는 미수금이 남은 가장 오래된 매출의 경과일수다', () => {
    const sales = [
      sale(1000, 0, daysAgo(80)),
      sale(1000, 0, daysAgo(5)),
    ];
    const { overdueDays } = computeAging(sales, 0, ASOF);
    expect(overdueDays).toBe(80);
  });
});

describe('sumAging', () => {
  it('여러 거래처의 구간별 금액을 합산한다', () => {
    const result = sumAging([
      { b0_30: 100, b31_60: 200, b61_90: 0, b90plus: 50 },
      { b0_30: 300, b31_60: 0, b61_90: 100, b90plus: 50 },
    ]);
    expect(result).toEqual({ b0_30: 400, b31_60: 200, b61_90: 100, b90plus: 100 });
  });

  it('빈 배열은 모두 0을 반환한다', () => {
    expect(sumAging([])).toEqual({ b0_30: 0, b31_60: 0, b61_90: 0, b90plus: 0 });
  });
});
