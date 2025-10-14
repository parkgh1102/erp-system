import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Purchase } from './Purchase';
import { Product } from './Product';

@Entity('purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Purchase, purchase => purchase.items)
  @JoinColumn({ name: 'purchaseId' })
  purchase!: Purchase;

  @Column()
  purchaseId!: number;

  @ManyToOne(() => Product, product => product.purchaseItems, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ nullable: true })
  productId?: number;

  @Column({ length: 50, nullable: true, comment: '품목코드' })
  productCode?: string;

  @Column({ length: 200, comment: '품목명' })
  productName!: string;

  @Column({ length: 50, nullable: true, comment: '규격' })
  spec?: string;

  @Column({ length: 20, nullable: true, comment: '단위' })
  unit?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1, comment: '수량' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '단가' })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '금액' })
  amount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
