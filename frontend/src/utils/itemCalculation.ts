/**
 * 매출/매입 품목 금액 계산 (순수 함수)
 * ------------------------------------------------------------------
 * 과세유형별 공급가액·세액·합계 계산 규칙을 한 곳에 모은다.
 * SalesManagement / PurchaseManagement 의 handleItemChange 가 이 함수들을 사용한다.
 *
 * 과세유형(taxType):
 *  - 'tax_separate'  과세(별도): 공급가액 = 수량×단가, 세액 = 공급가액×10%, 합계 = 공급가액+세액
 *  - 'tax_inclusive' 과세(포함): 합계 = 수량×단가, 공급가액 = round(합계/1.1), 세액 = 합계−공급가액
 *  - 'tax_free'(그 외) 면세:     공급가액 = 수량×단가, 세액 = 0, 합계 = 공급가액
 *
 * 반올림(Math.round)은 기존 컴포넌트 로직과 동일하게 유지한다.
 */

export type TaxType = 'tax_separate' | 'tax_inclusive' | 'tax_free' | string;

export interface ItemAmounts {
  supplyAmount: number; // 공급가액
  vatAmount: number;    // 세액
  totalAmount: number;  // 합계금액
}

const n = (v: number | null | undefined): number => Number(v) || 0;

/** 수량·단가로부터 공급가액/세액/합계 계산 */
export function calcAmountsFromQuantityPrice(
  taxType: TaxType,
  quantity: number,
  unitPrice: number
): ItemAmounts {
  const amount = n(quantity) * n(unitPrice);

  if (taxType === 'tax_separate') {
    const supplyAmount = amount;
    const vatAmount = Math.round(amount * 0.1);
    return { supplyAmount, vatAmount, totalAmount: supplyAmount + vatAmount };
  }

  if (taxType === 'tax_inclusive') {
    const totalAmount = amount;
    const supplyAmount = Math.round(amount / 1.1);
    return { supplyAmount, vatAmount: totalAmount - supplyAmount, totalAmount };
  }

  // 면세(tax_free) 또는 알 수 없는 유형
  return { supplyAmount: amount, vatAmount: 0, totalAmount: amount };
}

/** 합계금액 직접 입력 → 공급가액/세액 역산 (합계는 입력값 유지) */
export function calcAmountsFromTotal(taxType: TaxType, totalAmount: number): ItemAmounts {
  const total = n(totalAmount);

  if (taxType === 'tax_free') {
    return { supplyAmount: total, vatAmount: 0, totalAmount: total };
  }

  // 과세(별도/포함 공통): 합계에서 역산
  const supplyAmount = Math.round(total / 1.1);
  return { supplyAmount, vatAmount: total - supplyAmount, totalAmount: total };
}

/** 공급가액 직접 입력 → 세액/합계 계산 */
export function calcAmountsFromSupply(taxType: TaxType, supplyAmount: number): ItemAmounts {
  const supply = n(supplyAmount);

  if (taxType === 'tax_free') {
    return { supplyAmount: supply, vatAmount: 0, totalAmount: supply };
  }

  const vatAmount = Math.round(supply * 0.1);
  return { supplyAmount: supply, vatAmount, totalAmount: supply + vatAmount };
}

/** 세액 직접 입력 → 합계 계산 (공급가액+세액) */
export function calcTotalFromSupplyAndVat(supplyAmount: number, vatAmount: number): number {
  return n(supplyAmount) + n(vatAmount);
}
