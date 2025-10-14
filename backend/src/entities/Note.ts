import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './Business';

export enum NoteType {
  GENERAL = '일반',
  TRANSACTION = '거래관련',
  CUSTOMER = '고객관련'
}

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  businessId!: number;

  @Column({ length: 200, comment: '제목' })
  title!: string;

  @Column({ type: 'text', nullable: true, comment: '내용' })
  content?: string;

  @Column({ type: 'varchar', length: 20, default: NoteType.GENERAL })
  noteType!: NoteType;

  @Column({ nullable: true, comment: '관련 레코드 ID' })
  relatedId?: number;

  @Column({ length: 50, nullable: true, comment: '관련 테이블명' })
  relatedType?: string;

  @Column({ type: 'text', nullable: true, comment: '태그 (JSON)' })
  tags?: string;

  @Column({ nullable: true, comment: '작성자' })
  createdBy?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Business, business => business.notes)
  @JoinColumn({ name: 'businessId' })
  business!: Business;
}