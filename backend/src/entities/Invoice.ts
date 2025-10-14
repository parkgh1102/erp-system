import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './Business';
import { Transaction } from './Transaction';

export enum InvoiceType {
  TAX_INVOICE = '세금계산서',
  INVOICE = '계산서',
  RECEIPT = '영수증'
}

export enum IssueStatus {
  DRAFT = '작성중',
  ISSUED = '발행완료',
  SENT = '전송완료',
  ERROR = '오류'
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  businessId!: number;

  @Column()
  transactionId!: number;

  @Column({ type: 'varchar', length: 20 })
  invoiceType!: InvoiceType;

  @Column({ unique: true, length: 50, comment: '계산서번호' })
  invoiceNumber!: string;

  @Column({ type: 'date', comment: '발행일자' })
  issueDate!: Date;

  @Column({ length: 12, comment: '공급자 사업자번호' })
  supplierBusinessNumber!: string;

  @Column({ length: 200, comment: '공급자명' })
  supplierName!: string;

  @Column({ length: 12, nullable: true, comment: '공급받는자 사업자번호' })
  buyerBusinessNumber?: string;

  @Column({ length: 200, comment: '공급받는자명' })
  buyerName!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '공급가액' })
  supplyAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '세액' })
  taxAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '합계액' })
  totalAmount!: number;

  @Column({ type: 'varchar', length: 20, default: IssueStatus.DRAFT })
  issueStatus!: IssueStatus;

  @Column({ length: 100, nullable: true, comment: '홈택스 승인번호' })
  hometaxId?: string;

  @Column({ length: 500, nullable: true, comment: 'PDF 파일 경로' })
  pdfPath?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Business, business => business.invoices)
  @JoinColumn({ name: 'businessId' })
  business!: Business;

  @ManyToOne(() => Transaction, transaction => transaction.invoices)
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction;
}