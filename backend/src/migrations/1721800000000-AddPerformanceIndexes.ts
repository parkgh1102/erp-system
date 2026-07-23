import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 자주 조회되는 외래키/날짜 컬럼에 인덱스를 추가한다.
 *
 * 배경: 25개 엔티티 중 인덱스가 CompanySettings 1개뿐이라, businessId/customerId/날짜로
 * 필터링하는 거의 모든 조회가 PostgreSQL에서 풀스캔이었다(데이터가 쌓일수록 선형으로 느려짐).
 *
 * 안전장치(운영 부팅 시 자동 실행되므로 절대 실패로 서버를 죽이면 안 됨):
 *  - CREATE INDEX IF NOT EXISTS  → 재실행해도 안전(멱등)
 *  - 각 인덱스를 개별 try/catch  → 하나 실패해도 나머지 진행 + 부팅 유지
 *  - DataSource migrationsTransactionMode='none'와 함께 동작(트랜잭션 오염으로 인한
 *    커밋 실패를 방지 — database.ts 참조)
 *
 * 컬럼명 주의: 테이블마다 명명 규칙이 다르다. snake_case(sales/quotations/purchase_orders)와
 * camelCase(purchases/payments/customers/products/*_items)가 섞여 있어, camelCase는
 * PostgreSQL에서 대소문자 보존을 위해 반드시 큰따옴표로 감싼다.
 */
export class AddPerformanceIndexes1721800000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1721800000000';

  private static readonly INDEXES: Array<{ name: string; sql: string }> = [
    // sales — 컬럼: business_id, customer_id, transaction_date (snake_case)
    { name: 'idx_sales_business_date', sql: 'CREATE INDEX IF NOT EXISTS "idx_sales_business_date" ON "sales" ("business_id", "transaction_date")' },
    { name: 'idx_sales_customer', sql: 'CREATE INDEX IF NOT EXISTS "idx_sales_customer" ON "sales" ("customer_id")' },
    // purchases — 컬럼: businessId, customerId, purchaseDate (camelCase)
    { name: 'idx_purchases_business_date', sql: 'CREATE INDEX IF NOT EXISTS "idx_purchases_business_date" ON "purchases" ("businessId", "purchaseDate")' },
    { name: 'idx_purchases_customer', sql: 'CREATE INDEX IF NOT EXISTS "idx_purchases_customer" ON "purchases" ("customerId")' },
    // payments — 컬럼: businessId, customerId, paymentDate (camelCase)
    { name: 'idx_payments_business_date', sql: 'CREATE INDEX IF NOT EXISTS "idx_payments_business_date" ON "payments" ("businessId", "paymentDate")' },
    { name: 'idx_payments_customer', sql: 'CREATE INDEX IF NOT EXISTS "idx_payments_customer" ON "payments" ("customerId")' },
    // customers — 컬럼: businessId (camelCase)
    { name: 'idx_customers_business', sql: 'CREATE INDEX IF NOT EXISTS "idx_customers_business" ON "customers" ("businessId")' },
    // products — 컬럼: businessId (camelCase)
    { name: 'idx_products_business', sql: 'CREATE INDEX IF NOT EXISTS "idx_products_business" ON "products" ("businessId")' },
    // quotations — 컬럼: business_id, customer_id (snake_case)
    { name: 'idx_quotations_business', sql: 'CREATE INDEX IF NOT EXISTS "idx_quotations_business" ON "quotations" ("business_id")' },
    // purchase_orders — 컬럼: business_id (snake_case)
    { name: 'idx_purchase_orders_business', sql: 'CREATE INDEX IF NOT EXISTS "idx_purchase_orders_business" ON "purchase_orders" ("business_id")' },
    // sales_items / purchase_items — 상세 조인 FK (camelCase)
    { name: 'idx_sales_items_sales', sql: 'CREATE INDEX IF NOT EXISTS "idx_sales_items_sales" ON "sales_items" ("salesId")' },
    { name: 'idx_purchase_items_purchase', sql: 'CREATE INDEX IF NOT EXISTS "idx_purchase_items_purchase" ON "purchase_items" ("purchaseId")' },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const idx of AddPerformanceIndexes1721800000000.INDEXES) {
      try {
        await queryRunner.query(idx.sql);
      } catch (e: any) {
        // 컬럼/테이블 불일치 등으로 개별 인덱스가 실패해도 부팅을 막지 않는다.
        console.warn(`[migration] 인덱스 ${idx.name} 생성 건너뜀:`, e?.message || e);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const idx of AddPerformanceIndexes1721800000000.INDEXES) {
      try {
        await queryRunner.query(`DROP INDEX IF EXISTS "${idx.name}"`);
      } catch (e: any) {
        console.warn(`[migration] 인덱스 ${idx.name} 삭제 건너뜀:`, e?.message || e);
      }
    }
  }
}
