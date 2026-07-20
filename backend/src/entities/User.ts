import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Business } from './Business';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  // select: false — 기본 조회에서 제외한다.
  // User는 Sales.signedByUser 등으로 여러 응답에 조인되는데, 그때 bcrypt 해시가 그대로 노출됐다.
  // 해시가 필요한 곳(로그인·비밀번호 변경)에서는 addSelect/select로 명시적으로 가져온다.
  @Column({ select: false })
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