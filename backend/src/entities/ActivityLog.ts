import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Business } from './Business';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  actionType!: string; // 'login', 'logout', 'create', 'update', 'delete', 'password_change', etc.

  @Column({ type: 'varchar', length: 100 })
  entity!: string; // 'user', 'business', 'customer', 'product', 'sales', 'purchase', etc.

  @Column({ type: 'int', nullable: true })
  entityId?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  browser?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  os?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'int', nullable: true })
  userId?: number;

  @ManyToOne(() => Business, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'businessId' })
  business?: Business;

  @Column({ type: 'int', nullable: true })
  businessId?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
