import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Business } from './Business';

export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type BackupType = 'scheduled' | 'manual';

@Entity('backup_histories')
export class BackupHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'business_id' })
  businessId!: number;

  @Column({ name: 'file_name' })
  fileName!: string;

  @Column({ name: 'file_path' })
  filePath!: string;

  @Column({ name: 'file_size', type: 'bigint', default: 0 })
  fileSize!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending'
  })
  status!: BackupStatus;

  @Column({
    name: 'backup_type',
    type: 'varchar',
    length: 20,
    default: 'manual'
  })
  backupType!: BackupType;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'customers_count', default: 0 })
  customersCount!: number;

  @Column({ name: 'products_count', default: 0 })
  productsCount!: number;

  @Column({ name: 'sales_count', default: 0 })
  salesCount!: number;

  @Column({ name: 'purchases_count', default: 0 })
  purchasesCount!: number;

  @Column({ name: 'payments_count', default: 0 })
  paymentsCount!: number;

  @Column({ name: 'completed_at', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
