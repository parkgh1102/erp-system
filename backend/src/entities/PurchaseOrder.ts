import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Business } from './Business';
import { Customer } from './Customer';
import { PurchaseOrderItem } from './PurchaseOrderItem';

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'business_id' })
  businessId!: number;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Customer;

  @Column({ name: 'supplier_id', nullable: true, comment: '공급업체 (Customer 중 type이 supplier인 것)' })
  supplierId?: number;

  @Column({ name: 'order_number', length: 50, comment: '발주번호' })
  orderNumber!: string;

  @Column({ name: 'order_date', comment: '발주일자' })
  orderDate!: Date;

  @Column({ name: 'delivery_date', comment: '납기일자' })
  deliveryDate!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '공급가액 합계' })
  supplyAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '세액 합계' })
  vatAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '총액' })
  totalAmount!: number;

  @Column({ type: 'text', nullable: true, comment: '비고' })
  memo?: string;

  @Column({ name: 'delivery_location', length: 300, nullable: true, comment: '납품장소' })
  deliveryLocation?: string;

  @Column({ name: 'payment_terms', length: 200, nullable: true, comment: '결제조건' })
  paymentTerms?: string;

  @Column({ length: 20, default: 'draft', comment: '상태 (draft, sent, confirmed, received, cancelled)' })
  status!: string;

  @OneToMany(() => PurchaseOrderItem, item => item.purchaseOrder, { cascade: true })
  items!: PurchaseOrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
