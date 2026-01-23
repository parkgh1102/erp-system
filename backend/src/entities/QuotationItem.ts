import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Quotation } from './Quotation';
import { Product } from './Product';

@Entity('quotation_items')
export class QuotationItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Quotation, quotation => quotation.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quotation_id' })
  quotation!: Quotation;

  @Column({ name: 'quotation_id' })
  quotationId!: number;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'product_id', nullable: true })
  productId?: number;

  @Column({ name: 'item_name', length: 200, comment: '품목명' })
  itemName!: string;

  @Column({ length: 50, nullable: true, comment: '규격' })
  specification?: string;

  @Column({ length: 20, nullable: true, comment: '단위' })
  unit?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1, comment: '수량' })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 15, scale: 2, comment: '단가' })
  unitPrice!: number;

  @Column({ name: 'supply_amount', type: 'decimal', precision: 15, scale: 2, comment: '공급가액' })
  supplyAmount!: number;

  @Column({ name: 'vat_amount', type: 'decimal', precision: 15, scale: 2, default: 0, comment: '세액' })
  vatAmount!: number;

  @Column({ type: 'text', nullable: true, comment: '비고' })
  remark?: string;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '정렬 순서' })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
