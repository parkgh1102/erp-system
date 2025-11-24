import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Business } from './Business';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  type!: string; // 'sales', 'purchase', 'payment', 'receipt', 'system', 'alert', etc.

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  link?: string; // 클릭시 이동할 경로

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'info' })
  priority!: string; // 'info', 'warning', 'error', 'success'

  @Column({ type: 'json', nullable: true })
  metadata?: any; // 추가 데이터 (금액, 거래처명 등)

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => Business, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business?: Business;

  @Column({ type: 'int', nullable: true })
  businessId?: number;

  @Column({ type: 'int', nullable: true })
  relatedId?: number; // ID of related entity (sales, purchase, etc.)

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedType?: string; // Type of related entity ('sales', 'purchase', etc.)

  @CreateDateColumn()
  createdAt!: Date;
}
