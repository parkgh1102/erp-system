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

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '금액(단가×수량, 과세포함이면 세금 포함액)' })
  amount!: number;

  // 매출(SalesItem)과 동일하게 품목별 공급가액·세액을 저장한다.
  // 과거엔 저장하지 않아 거래원장이 amount로 역산하다 과세포함 품목의 세액을 잘못 계산했음.
  // 구 데이터 호환을 위해 nullable — 값이 없으면 거래원장이 레코드 총액을 안분해 폴백한다.
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, comment: '공급가액' })
  supplyAmount?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, comment: '세액' })
  taxAmount?: number;

  @Column({ type: 'int', default: 0, comment: '정렬 순서' })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
