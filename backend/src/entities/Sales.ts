import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Business } from './Business';
import { Customer } from './Customer';
import { SalesItem } from './SalesItem';

@Entity('sales')
export class Sales {
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

  @Column({ name: 'transaction_date' })
  transactionDate!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  vatAmount!: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  memo?: string;

  @OneToMany(() => SalesItem, item => item.sales)
  items!: SalesItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}