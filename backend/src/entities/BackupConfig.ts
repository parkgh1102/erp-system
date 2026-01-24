import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Business } from './Business';

export type BackupScheduleType = 'daily' | 'weekly' | 'monthly' | 'manual';

@Entity('backup_configs')
export class BackupConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'business_id' })
  businessId!: number;

  @Column({ default: true })
  enabled!: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'daily'
  })
  scheduleType!: BackupScheduleType;

  @Column({ name: 'schedule_time', default: '03:00' })
  scheduleTime!: string; // HH:mm format

  @Column({ name: 'schedule_day', nullable: true })
  scheduleDay?: number; // 1-7 for weekly (1=Monday), 1-31 for monthly

  @Column({ name: 'retention_count', default: 7 })
  retentionCount!: number; // Number of backups to keep

  @Column({ name: 'last_backup_at', nullable: true })
  lastBackupAt?: Date;

  @Column({ name: 'next_backup_at', nullable: true })
  nextBackupAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
