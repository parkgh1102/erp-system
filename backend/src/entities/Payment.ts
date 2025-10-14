import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './Business';
import { Customer } from './Customer';
import { Transaction } from './Transaction';

export enum PaymentType {
  RECEIPT = '수금',
  PAYMENT = '입금'
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  businessId!: number;

  @Column({ type: 'date', comment: '수금/입금일' })
  paymentDate!: Date;

  @Column({ type: 'varchar', length: 20 })
  paymentType!: PaymentType;

  @Column()
  customerId!: number;

  @Column({ nullable: true, comment: '원거래' })
  transactionId?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '금액' })
  amount!: number;

  @Column({ length: 50, nullable: true, comment: '수금/입금방법' })
  paymentMethod?: string;

  @Column({ length: 100, nullable: true, comment: '계좌정보' })
  bankAccount?: string;

  @Column({ length: 500, nullable: true, comment: '적요' })
  description?: string;

  @Column({ type: 'text', nullable: true, comment: '메모' })
  memo?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Business, business => business.payments)
  @JoinColumn({ name: 'businessId' })
  business!: Business;

  @ManyToOne(() => Customer, customer => customer.payments)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @ManyToOne(() => Transaction, transaction => transaction.payments)
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction;
}