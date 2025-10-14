import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Business } from './Business';
import { Customer } from './Customer';
import { Account } from './Account';
import { Payment } from './Payment';
import { Invoice } from './Invoice';
import { TransactionItem } from './TransactionItem';

export enum TransactionType {
  PURCHASE = '매입',
  SALES = '매출'
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  businessId!: number;

  @Column({ type: 'date', comment: '거래일자' })
  transactionDate!: Date;

  @Column({ type: 'varchar', length: 20 })
  transactionType!: TransactionType;

  @Column({ nullable: true })
  customerId?: number;

  @Column()
  accountId!: number;

  @Column({ length: 500, comment: '적요' })
  description!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '공급가액' })
  supplyAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '세액' })
  taxAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '합계액' })
  totalAmount!: number;

  @Column({ length: 50, nullable: true, comment: '계산서번호' })
  invoiceNumber?: string;

  @Column({ length: 50, nullable: true, comment: '결제방법' })
  paymentMethod?: string;

  @Column({ type: 'text', nullable: true, comment: '메모' })
  memo?: string;

  @Column({ nullable: true, comment: '입력자' })
  createdBy?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Business, business => business.transactions)
  @JoinColumn({ name: 'businessId' })
  business!: Business;

  @ManyToOne(() => Customer, customer => customer.transactions)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @OneToMany(() => Payment, payment => payment.transaction)
  payments!: Payment[];

  @OneToMany(() => Invoice, invoice => invoice.transaction)
  invoices!: Invoice[];

  @OneToMany(() => TransactionItem, item => item.transaction)
  transactionItems!: TransactionItem[];
}