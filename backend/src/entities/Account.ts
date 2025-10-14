import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

export enum AccountType {
  ASSET = '자산',
  LIABILITY = '부채',
  EQUITY = '자본',
  REVENUE = '수익',
  EXPENSE = '비용'
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 10, comment: '계정코드' })
  code!: string;

  @Column({ length: 100, comment: '계정명' })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  accountType!: AccountType;

  @Column({ nullable: true, comment: '상위 계정' })
  parentId?: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Account, account => account.children)
  @JoinColumn({ name: 'parentId' })
  parent!: Account;

  @OneToMany(() => Account, account => account.parent)
  children!: Account[];
}