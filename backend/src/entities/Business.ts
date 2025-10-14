import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Customer } from './Customer';
import { Product } from './Product';
import { Transaction } from './Transaction';
import { Payment } from './Payment';
import { Invoice } from './Invoice';
import { Note } from './Note';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, user => user.businesses)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: number;

  @Column({ unique: true, length: 12, comment: '사업자번호' })
  businessNumber!: string;

  @Column({ length: 200, comment: '상호명' })
  companyName!: string;

  @Column({ length: 100, comment: '대표자명' })
  representative!: string;

  @Column({ length: 100, nullable: true, comment: '업태' })
  businessType?: string;

  @Column({ length: 100, nullable: true, comment: '종목' })
  businessItem?: string;

  @Column({ length: 500, nullable: true, comment: '주소' })
  address?: string;

  @Column({ length: 20, nullable: true, comment: '전화번호' })
  phone?: string;

  @Column({ length: 20, nullable: true, comment: '팩스번호' })
  fax?: string;

  @Column({ length: 100, nullable: true, comment: '이메일' })
  email?: string;

  @Column({ length: 200, nullable: true, comment: '홈페이지' })
  homepage?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Customer, customer => customer.business)
  customers!: Customer[];

  @OneToMany(() => Product, product => product.business)
  products!: Product[];

  @OneToMany(() => Transaction, transaction => transaction.business)
  transactions!: Transaction[];

  @OneToMany(() => Payment, payment => payment.business)
  payments!: Payment[];

  @OneToMany(() => Invoice, invoice => invoice.business)
  invoices!: Invoice[];

  @OneToMany(() => Note, note => note.business)
  notes!: Note[];
}