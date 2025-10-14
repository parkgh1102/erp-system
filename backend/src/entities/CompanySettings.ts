import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './Business';

@Entity('company_settings')
export class CompanySettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'businessId' })
  business!: Business;

  @Column()
  businessId!: number;

  @Column({ length: 50, comment: '설정 키' })
  settingKey!: string;

  @Column({ type: 'text', comment: '설정 값' })
  settingValue!: string;

  @Column({ length: 200, nullable: true, comment: '설명' })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}