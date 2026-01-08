import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('otps')
export class OTP {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 6 })
  code!: string;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  verified!: boolean;

  @Column({ type: 'int', default: 1 })
  attemptCount!: number;

  @Column({ type: 'datetime', nullable: true })
  lastAttemptAt!: Date | null;

  @Column({ type: 'int', default: 1 })
  sendCount!: number;

  @Column({ type: 'datetime', nullable: true })
  blockedUntil!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
