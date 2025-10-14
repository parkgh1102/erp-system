"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialMigration1704067200000 = void 0;
class InitialMigration1704067200000 {
    constructor() {
        this.name = 'InitialMigration1704067200000';
    }
    async up(queryRunner) {
        // User 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "name" character varying NOT NULL,
                "phone" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_user_email" UNIQUE ("email"),
                CONSTRAINT "PK_user_id" PRIMARY KEY ("id")
            )
        `);
        // Business 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "business" (
                "id" SERIAL NOT NULL,
                "userId" integer NOT NULL,
                "businessNumber" character varying NOT NULL,
                "companyName" character varying NOT NULL,
                "representative" character varying NOT NULL,
                "businessType" character varying,
                "businessItem" character varying,
                "address" character varying,
                "phone" character varying,
                "fax" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_business_businessNumber" UNIQUE ("businessNumber"),
                CONSTRAINT "PK_business_id" PRIMARY KEY ("id")
            )
        `);
        // Customer 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "customer" (
                "id" SERIAL NOT NULL,
                "businessId" integer NOT NULL,
                "name" character varying NOT NULL,
                "businessNumber" character varying,
                "address" character varying,
                "phone" character varying,
                "representative" character varying,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_customer_id" PRIMARY KEY ("id")
            )
        `);
        // Product 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "product" (
                "id" SERIAL NOT NULL,
                "businessId" integer NOT NULL,
                "name" character varying NOT NULL,
                "category" character varying,
                "description" text,
                "unitPrice" decimal(10,2) NOT NULL DEFAULT 0,
                "unit" character varying DEFAULT 'EA',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_id" PRIMARY KEY ("id")
            )
        `);
        // Account 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "account" (
                "id" SERIAL NOT NULL,
                "businessId" integer NOT NULL,
                "code" character varying NOT NULL,
                "name" character varying NOT NULL,
                "type" character varying NOT NULL,
                "parentId" integer,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_account_id" PRIMARY KEY ("id")
            )
        `);
        // Transaction 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "transaction" (
                "id" SERIAL NOT NULL,
                "businessId" integer NOT NULL,
                "customerId" integer,
                "type" character varying NOT NULL,
                "date" date NOT NULL,
                "description" character varying,
                "totalAmount" decimal(15,2) NOT NULL DEFAULT 0,
                "taxAmount" decimal(15,2) NOT NULL DEFAULT 0,
                "status" character varying NOT NULL DEFAULT 'draft',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_transaction_id" PRIMARY KEY ("id")
            )
        `);
        // TransactionItem 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "transaction_item" (
                "id" SERIAL NOT NULL,
                "transactionId" integer NOT NULL,
                "productId" integer,
                "itemName" character varying NOT NULL,
                "specification" character varying,
                "quantity" decimal(10,3) NOT NULL DEFAULT 1,
                "unitPrice" decimal(10,2) NOT NULL DEFAULT 0,
                "amount" decimal(15,2) NOT NULL DEFAULT 0,
                "taxAmount" decimal(15,2) NOT NULL DEFAULT 0,
                "taxExempt" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_transaction_item_id" PRIMARY KEY ("id")
            )
        `);
        // Sales 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "sales" (
                "id" SERIAL NOT NULL,
                "transactionId" integer NOT NULL,
                "invoiceNumber" character varying,
                "dueDate" date,
                "paymentStatus" character varying NOT NULL DEFAULT 'unpaid',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_sales_id" PRIMARY KEY ("id")
            )
        `);
        // Purchase 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "purchase" (
                "id" SERIAL NOT NULL,
                "transactionId" integer NOT NULL,
                "receiptNumber" character varying,
                "receiptDate" date,
                "paymentStatus" character varying NOT NULL DEFAULT 'unpaid',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_purchase_id" PRIMARY KEY ("id")
            )
        `);
        // Payment 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "payment" (
                "id" SERIAL NOT NULL,
                "transactionId" integer NOT NULL,
                "amount" decimal(15,2) NOT NULL,
                "method" character varying NOT NULL,
                "date" date NOT NULL,
                "reference" character varying,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payment_id" PRIMARY KEY ("id")
            )
        `);
        // Invoice 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "invoice" (
                "id" SERIAL NOT NULL,
                "transactionId" integer NOT NULL,
                "invoiceNumber" character varying NOT NULL,
                "issueDate" date NOT NULL,
                "dueDate" date,
                "status" character varying NOT NULL DEFAULT 'draft',
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_invoice_invoiceNumber" UNIQUE ("invoiceNumber"),
                CONSTRAINT "PK_invoice_id" PRIMARY KEY ("id")
            )
        `);
        // Note 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "note" (
                "id" SERIAL NOT NULL,
                "businessId" integer NOT NULL,
                "title" character varying NOT NULL,
                "content" text NOT NULL,
                "type" character varying NOT NULL DEFAULT 'general',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_note_id" PRIMARY KEY ("id")
            )
        `);
        // CompanySettings 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "company_settings" (
                "id" SERIAL NOT NULL,
                "businessId" integer NOT NULL,
                "key" character varying NOT NULL,
                "value" text,
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_company_settings_businessId_key" UNIQUE ("businessId", "key"),
                CONSTRAINT "PK_company_settings_id" PRIMARY KEY ("id")
            )
        `);
        // 외래키 제약조건 추가
        await queryRunner.query(`
            ALTER TABLE "business" ADD CONSTRAINT "FK_business_user"
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "customer" ADD CONSTRAINT "FK_customer_business"
            FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "product" ADD CONSTRAINT "FK_product_business"
            FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "account" ADD CONSTRAINT "FK_account_business"
            FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "account" ADD CONSTRAINT "FK_account_parent"
            FOREIGN KEY ("parentId") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction" ADD CONSTRAINT "FK_transaction_business"
            FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction" ADD CONSTRAINT "FK_transaction_customer"
            FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_item" ADD CONSTRAINT "FK_transaction_item_transaction"
            FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_item" ADD CONSTRAINT "FK_transaction_item_product"
            FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "sales" ADD CONSTRAINT "FK_sales_transaction"
            FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "purchase" ADD CONSTRAINT "FK_purchase_transaction"
            FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payment" ADD CONSTRAINT "FK_payment_transaction"
            FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "invoice" ADD CONSTRAINT "FK_invoice_transaction"
            FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "note" ADD CONSTRAINT "FK_note_business"
            FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "company_settings" ADD CONSTRAINT "FK_company_settings_business"
            FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        // 인덱스 생성
        await queryRunner.query(`CREATE INDEX "IDX_user_email" ON "user" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_business_userId" ON "business" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_business_businessNumber" ON "business" ("businessNumber")`);
        await queryRunner.query(`CREATE INDEX "IDX_customer_businessId" ON "customer" ("businessId")`);
        await queryRunner.query(`CREATE INDEX "IDX_product_businessId" ON "product" ("businessId")`);
        await queryRunner.query(`CREATE INDEX "IDX_account_businessId" ON "account" ("businessId")`);
        await queryRunner.query(`CREATE INDEX "IDX_transaction_businessId" ON "transaction" ("businessId")`);
        await queryRunner.query(`CREATE INDEX "IDX_transaction_date" ON "transaction" ("date")`);
        await queryRunner.query(`CREATE INDEX "IDX_transaction_item_transactionId" ON "transaction_item" ("transactionId")`);
        await queryRunner.query(`CREATE INDEX "IDX_payment_transactionId" ON "payment" ("transactionId")`);
        await queryRunner.query(`CREATE INDEX "IDX_note_businessId" ON "note" ("businessId")`);
        await queryRunner.query(`CREATE INDEX "IDX_company_settings_businessId" ON "company_settings" ("businessId")`);
    }
    async down(queryRunner) {
        // 외래키 제약조건 제거
        await queryRunner.query(`ALTER TABLE "company_settings" DROP CONSTRAINT "FK_company_settings_business"`);
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_note_business"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_invoice_transaction"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_payment_transaction"`);
        await queryRunner.query(`ALTER TABLE "purchase" DROP CONSTRAINT "FK_purchase_transaction"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_sales_transaction"`);
        await queryRunner.query(`ALTER TABLE "transaction_item" DROP CONSTRAINT "FK_transaction_item_product"`);
        await queryRunner.query(`ALTER TABLE "transaction_item" DROP CONSTRAINT "FK_transaction_item_transaction"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_transaction_customer"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_transaction_business"`);
        await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT "FK_account_parent"`);
        await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT "FK_account_business"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_product_business"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP CONSTRAINT "FK_customer_business"`);
        await queryRunner.query(`ALTER TABLE "business" DROP CONSTRAINT "FK_business_user"`);
        // 테이블 삭제
        await queryRunner.query(`DROP TABLE "company_settings"`);
        await queryRunner.query(`DROP TABLE "note"`);
        await queryRunner.query(`DROP TABLE "invoice"`);
        await queryRunner.query(`DROP TABLE "payment"`);
        await queryRunner.query(`DROP TABLE "purchase"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP TABLE "transaction_item"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP TABLE "customer"`);
        await queryRunner.query(`DROP TABLE "business"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }
}
exports.InitialMigration1704067200000 = InitialMigration1704067200000;
//# sourceMappingURL=1704067200000-InitialMigration.js.map