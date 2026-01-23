import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Business } from './Business';
import { Customer } from './Customer';
import { QuotationItem } from './QuotationItem';

@Entity('quotations')
export class Quotation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'business_id' })
  businessId!: number;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @Column({ name: 'customer_id', nullable: true })
  customerId?: number;

  @Column({ name: 'quotation_number', length: 50, comment: '견적번호' })
  quotationNumber!: string;

  @Column({ name: 'quotation_date', comment: '견적일자' })
  quotationDate!: Date;

  @Column({ name: 'valid_until', comment: '유효기간' })
  validUntil!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '공급가액 합계' })
  supplyAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '세액 합계' })
  vatAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '총액' })
  totalAmount!: number;

  @Column({ type: 'text', nullable: true, comment: '비고' })
  memo?: string;

  @Column({ name: 'payment_terms', length: 200, nullable: true, comment: '결제조건' })
  paymentTerms?: string;

  @Column({ name: 'delivery_terms', length: 200, nullable: true, comment: '납품조건' })
  deliveryTerms?: string;

  @Column({ length: 20, default: 'draft', comment: '상태 (draft, sent, accepted, rejected, expired)' })
  status!: string;

  @OneToMany(() => QuotationItem, item => item.quotation, { cascade: true })
  items!: QuotationItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
