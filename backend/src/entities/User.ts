import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Business } from './Business';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column()
  phone!: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ default: 'admin' })
  role!: string; // 'admin', 'sales_viewer'

  @Column({ nullable: true })
  businessId?: number; // 소속 사업자 ID (sales_viewer용)

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => Business, business => business.user)
  businesses!: Business[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}