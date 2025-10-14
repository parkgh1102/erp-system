import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Transaction } from './Transaction';
import { Product } from './Product';

@Entity('transaction_items')
export class TransactionItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Transaction, transaction => transaction.transactionItems)
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction;

  @Column()
  transactionId!: number;

  @ManyToOne(() => Product, product => product.transactionItems, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ nullable: true })
  productId?: number;

  @Column({ length: 200, comment: '품목명' })
  itemName!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1, comment: '수량' })
  quantity!: number;

  @Column({ length: 20, nullable: true, comment: '단위' })
  unit?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '단가' })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '공급가액' })
  supplyAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '세액' })
  taxAmount!: number;

  @Column({ length: 50, nullable: true, comment: '규격' })
  specification?: string;

  @Column({ type: 'text', nullable: true, comment: '비고' })
  remark?: string;

  @CreateDateColumn()
  createdAt!: Date;
}