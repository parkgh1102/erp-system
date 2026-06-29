import { describe, it, expect } from 'vitest';
import {
  calcAmountsFromQuantityPrice,
  calcAmountsFromTotal,
  calcAmountsFromSupply,
  calcTotalFromSupplyAndVat,
} from '../itemCalculation';

describe('calcAmountsFromQuantityPrice', () => {
  it('과세별도: 공급가액=수량×단가, 세액=10%, 합계=공급+세액', () => {
    expect(calcAmountsFromQuantityPrice('tax_separate', 10, 1000)).toEqual({
      supplyAmount: 10000,
      vatAmount: 1000,
      totalAmount: 11000,
    });
  });

  it('과세별도: 세액 반올림 (9999×0.1=999.9 → 1000)', () => {
    expect(calcAmountsFromQuantityPrice('tax_separate', 1, 9999)).toEqual({
      supplyAmount: 9999,
      vatAmount: 1000,
      totalAmount: 10999,
    });
  });

  it('과세포함: 합계=수량×단가, 공급가액=round(합계/1.1), 세액=합계−공급', () => {
    expect(calcAmountsFromQuantityPrice('tax_inclusive', 1, 11000)).toEqual({
      supplyAmount: 10000,
      vatAmount: 1000,
      totalAmount: 11000,
    });
  });

  it('과세포함: 나누어떨어지지 않는 경우 (10000/1.1=9090.9 → 9091, 세액=909)', () => {
    expect(calcAmountsFromQuantityPrice('tax_inclusive', 1, 10000)).toEqual({
      supplyAmount: 9091,
      vatAmount: 909,
      totalAmount: 10000,
    });
  });

  it('면세: 세액 0, 합계=공급가액', () => {
    expect(calcAmountsFromQuantityPrice('tax_free', 5, 2000)).toEqual({
      supplyAmount: 10000,
      vatAmount: 0,
      totalAmount: 10000,
    });
  });

  it('알 수 없는 과세유형은 면세처럼 처리', () => {
    expect(calcAmountsFromQuantityPrice('something_else', 5, 2000)).toEqual({
      supplyAmount: 10000,
      vatAmount: 0,
      totalAmount: 10000,
    });
  });

  it('수량 0이면 모두 0', () => {
    expect(calcAmountsFromQuantityPrice('tax_separate', 0, 9999)).toEqual({
      supplyAmount: 0,
      vatAmount: 0,
      totalAmount: 0,
    });
  });

  it('null/undefined 수량·단가는 0으로 처리', () => {
    expect(calcAmountsFromQuantityPrice('tax_separate', undefined as any, null as any)).toEqual({
      supplyAmount: 0,
      vatAmount: 0,
      totalAmount: 0,
    });
  });

  it('음수(반품) 처리: 과세별도 -10×1000', () => {
    expect(calcAmountsFromQuantityPrice('tax_separate', -10, 1000)).toEqual({
      supplyAmount: -10000,
      vatAmount: -1000,
      totalAmount: -11000,
    });
  });
});

describe('calcAmountsFromTotal (합계 직접 입력 → 역산)', () => {
  it('면세: 공급가액=합계, 세액=0', () => {
    expect(calcAmountsFromTotal('tax_free', 10000)).toEqual({
      supplyAmount: 10000,
      vatAmount: 0,
      totalAmount: 10000,
    });
  });

  it('과세: 공급가액=round(합계/1.1), 세액=합계−공급', () => {
    expect(calcAmountsFromTotal('tax_separate', 11000)).toEqual({
      supplyAmount: 10000,
      vatAmount: 1000,
      totalAmount: 11000,
    });
  });

  it('과세 반올림: 10000 → 공급 9091, 세액 909', () => {
    expect(calcAmountsFromTotal('tax_inclusive', 10000)).toEqual({
      supplyAmount: 9091,
      vatAmount: 909,
      totalAmount: 10000,
    });
  });

  it('합계 0 처리', () => {
    expect(calcAmountsFromTotal('tax_separate', 0)).toEqual({
      supplyAmount: 0,
      vatAmount: 0,
      totalAmount: 0,
    });
  });
});

describe('calcAmountsFromSupply (공급가액 직접 입력)', () => {
  it('면세: 세액 0, 합계=공급가액', () => {
    expect(calcAmountsFromSupply('tax_free', 10000)).toEqual({
      supplyAmount: 10000,
      vatAmount: 0,
      totalAmount: 10000,
    });
  });

  it('과세: 세액=round(공급×0.1), 합계=공급+세액', () => {
    expect(calcAmountsFromSupply('tax_separate', 10000)).toEqual({
      supplyAmount: 10000,
      vatAmount: 1000,
      totalAmount: 11000,
    });
  });

  it('과세 반올림: 공급 9999 → 세액 1000', () => {
    expect(calcAmountsFromSupply('tax_inclusive', 9999)).toEqual({
      supplyAmount: 9999,
      vatAmount: 1000,
      totalAmount: 10999,
    });
  });
});

describe('calcTotalFromSupplyAndVat (세액 직접 입력)', () => {
  it('합계 = 공급가액 + 세액', () => {
    expect(calcTotalFromSupplyAndVat(10000, 1000)).toBe(11000);
  });

  it('null/undefined는 0으로 처리', () => {
    expect(calcTotalFromSupplyAndVat(10000, undefined as any)).toBe(10000);
    expect(calcTotalFromSupplyAndVat(null as any, null as any)).toBe(0);
  });
});
