import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Business } from './Business';
import { Customer } from './Customer';
import { PurchaseItem } from './PurchaseItem';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'businessId' })
  business!: Business;

  @Column()
  businessId!: number;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @Column({ nullable: true })
  customerId?: number;

  @OneToMany(() => PurchaseItem, item => item.purchase, { cascade: true })
  items!: PurchaseItem[];

  @Column({ type: 'date', comment: '매입일자' })
  purchaseDate!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '합계금액' })
  totalAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '부가세' })
  vatAmount!: number;

  @Column({ type: 'text', nullable: true, comment: '메모' })
  memo?: string;

  @Column({ default: true, comment: '활성 여부' })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}