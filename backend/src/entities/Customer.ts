import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Business } from './Business';
import { Transaction } from './Transaction';
import { Payment } from './Payment';

export enum CustomerType {
  SALES = '매출처',
  PURCHASE = '매입처',
  OTHER = '기타'
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  businessId!: number;

  @Column({ unique: true, length: 20, comment: '거래처코드' })
  customerCode!: string;

  @Column({ length: 200, comment: '거래처명' })
  name!: string;

  @Column({ length: 12, nullable: true, comment: '사업자번호' })
  businessNumber?: string;

  @Column({ length: 100, nullable: true, comment: '대표자' })
  representative?: string;

  @Column({ length: 500, nullable: true, comment: '주소' })
  address?: string;

  @Column({ length: 20, nullable: true, comment: '전화번호' })
  phone?: string;
  
  @Column({ length: 20, nullable: true, comment: '팩스번호' })
  fax?: string;

  @Column({ length: 100, nullable: true, comment: '이메일' })
  email?: string;
  
  @Column({ length: 20, nullable: true, comment: '담당자 연락처' })
  managerContact?: string;
  
  @Column({ length: 100, nullable: true, comment: '업태' })
  businessType?: string;
  
  @Column({ length: 100, nullable: true, comment: '종목' })
  businessItem?: string;

  @Column({ type: 'varchar', length: 20, default: CustomerType.OTHER })
  customerType!: CustomerType;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Business, business => business.customers)
  @JoinColumn({ name: 'businessId' })
  business!: Business;

  @OneToMany(() => Transaction, transaction => transaction.customer)
  transactions!: Transaction[];

  @OneToMany(() => Payment, payment => payment.customer)
  payments!: Payment[];
}