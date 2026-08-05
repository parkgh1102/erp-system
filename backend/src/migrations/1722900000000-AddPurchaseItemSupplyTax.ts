import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * purchase_items에 공급가액(supplyAmount)·세액(taxAmount) 컬럼을 추가하고,
 * 기존 매입 데이터를 안분해 채운다(백필).
 *
 * 배경: SalesItem은 공급가액/세액을 저장하는데 PurchaseItem은 amount(단가×수량)만 저장해,
 * 거래원장이 amount로 역산하다 과세포함 품목의 세액을 잘못 계산했다(9.09%). 근본 정리로
 * 매출과 동일하게 품목별 값을 저장한다.
 *
 * 안전장치(운영 부팅 시 자동 실행 — 실패해도 서버가 죽으면 안 됨):
 *  - 컬럼 추가/백필을 각각 try/catch. migrationsTransactionMode='none'와 함께 동작.
 *  - 백필은 supplyAmount IS NULL인 행만(멱등). 실패/미완이어도 거래원장이 안분으로 폴백.
 *  - 컬럼명은 camelCase라 PostgreSQL에서 큰따옴표로 감싼다.
 */
export class AddPurchaseItemSupplyTax1722900000000 implements MigrationInterface {
  name = 'AddPurchaseItemSupplyTax1722900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) 컬럼 추가 (이미 있으면 건너뜀)
    for (const col of ['supplyAmount', 'taxAmount']) {
      try {
        await queryRunner.query(
          `ALTER TABLE "purchase_items" ADD COLUMN IF NOT EXISTS "${col}" decimal(15,2)`
        );
      } catch (e: any) {
        // SQLite 등 IF NOT EXISTS 미지원 환경 대비: 재시도(있으면 실패 무시)
        try {
          await queryRunner.query(`ALTER TABLE "purchase_items" ADD COLUMN "${col}" decimal(15,2)`);
        } catch (e2: any) {
          console.warn(`[migration] purchase_items.${col} 추가 건너뜀:`, e2?.message || e2);
        }
      }
    }

    // 2) 기존 데이터 백필 — 매입 건별로 레코드 공급가액/세액을 품목에 안분
    try {
      // supplyAmount가 아직 안 채워진 매입 건 id 목록
      const pending: Array<{ purchaseId: number }> = await queryRunner.query(
        `SELECT DISTINCT "purchaseId" FROM "purchase_items" WHERE "supplyAmount" IS NULL`
      );

      for (const row of pending) {
        const purchaseId = row.purchaseId;
        try {
          const purchaseRows: any[] = await queryRunner.query(
            `SELECT "totalAmount", "vatAmount" FROM "purchases" WHERE "id" = ${Number(purchaseId)}`
          );
          if (!purchaseRows.length) continue;
          const recSupply = Number(purchaseRows[0].totalAmount) || 0; // 세금조정된 공급가액 총합
          const recVat = Number(purchaseRows[0].vatAmount) || 0;

          // 품목 + 해당 product의 taxType(면세 판별용)
          const items: any[] = await queryRunner.query(
            `SELECT pi."id" AS id, pi."amount" AS amount, p."taxType" AS "taxType"
             FROM "purchase_items" pi
             LEFT JOIN "products" p ON p."id" = pi."productId"
             WHERE pi."purchaseId" = ${Number(purchaseId)}
             ORDER BY pi."sortOrder" ASC, pi."id" ASC`
          );
          if (!items.length) continue;

          const isTaxable = (it: any) => (it.taxType || 'tax_separate') !== 'tax_free';
          const taxableBase = items.reduce((s, it) => (isTaxable(it) ? s + (Number(it.amount) || 0) : s), 0);
          const freeSupply = items.reduce((s, it) => (!isTaxable(it) ? s + (Number(it.amount) || 0) : s), 0);
          const taxableSupplyTotal = recSupply - freeSupply;
          let lastTaxableIdx = -1;
          items.forEach((it, i) => { if (isTaxable(it)) lastTaxableIdx = i; });

          let allocatedSupply = 0;
          let allocatedVat = 0;
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            const raw = Number(it.amount) || 0;
            let supply = raw; // 면세 기본값
            let tax = 0;
            if (isTaxable(it) && taxableBase > 0) {
              if (i === lastTaxableIdx) {
                supply = taxableSupplyTotal - allocatedSupply;
                tax = recVat - allocatedVat;
              } else {
                supply = Math.round(taxableSupplyTotal * (raw / taxableBase));
                tax = Math.round(recVat * (raw / taxableBase));
                allocatedSupply += supply;
                allocatedVat += tax;
              }
            }
            await queryRunner.query(
              `UPDATE "purchase_items" SET "supplyAmount" = ${supply}, "taxAmount" = ${tax} WHERE "id" = ${Number(it.id)}`
            );
          }
        } catch (inner: any) {
          console.warn(`[migration] 매입 #${purchaseId} 백필 건너뜀:`, inner?.message || inner);
        }
      }
    } catch (e: any) {
      console.warn('[migration] purchase_items 백필 전체 건너뜀:', e?.message || e);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const col of ['supplyAmount', 'taxAmount']) {
      try {
        await queryRunner.query(`ALTER TABLE "purchase_items" DROP COLUMN IF EXISTS "${col}"`);
      } catch (e: any) {
        console.warn(`[migration] purchase_items.${col} 삭제 건너뜀:`, e?.message || e);
      }
    }
  }
}
