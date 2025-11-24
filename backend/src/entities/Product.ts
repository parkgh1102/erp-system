import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Business } from './Business';
import { TransactionItem } from './TransactionItem';
import { SalesItem } from './SalesItem';
import { PurchaseItem } from './PurchaseItem';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Business, business => business.products)
  @JoinColumn({ name: 'businessId' })
  business!: Business;

  @Column()
  businessId!: number;

  @Column({ length: 100, comment: '품목명' })
  name!: string;

  @Column({ length: 50, comment: '품목코드' })
  productCode!: string;

  @Column({ length: 50, nullable: true, comment: '규격' })
  spec?: string;

  @Column({ length: 255, nullable: true, comment: '사양' })
  specification?: string;

  @Column({ length: 20, nullable: true, comment: '단위' })
  unit?: string;

  @Column({ type: 'int', nullable: true, default: 0, comment: '현재재고' })
  currentStock?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, comment: '매입단가' })
  buyPrice?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, comment: '매출단가' })
  sellPrice?: number;

  @Column({ length: 100, nullable: true, comment: '분류' })
  category?: string;

  @Column({ length: 20, default: 'tax_separate', comment: '세금구분' })
  taxType!: string;

  @Column({ type: 'text', nullable: true, comment: '비고' })
  memo?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => TransactionItem, item => item.product)
  transactionItems!: TransactionItem[];

  @OneToMany(() => SalesItem, item => item.product)
  salesItems!: SalesItem[];

  @OneToMany(() => PurchaseItem, item => item.product)
  purchaseItems!: PurchaseItem[];
}