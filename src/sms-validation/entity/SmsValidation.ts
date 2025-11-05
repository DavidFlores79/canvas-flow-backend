import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SmsValidationProvider } from '../enum/SmsValidationProvider';
import { User } from '../../users/entity/User';

@Entity({ name: 'sms_validations' })
export class SmsValidation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index('idx_sms_validation_user_id', ['userId'], { unique: false })
  userId: string;

  @Column({
    name: 'sms_provider',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  smsProvider: SmsValidationProvider;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  @Index('idx_sms_validation_phone', ['phone'], { unique: false })
  phone: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  @Index()
  status: string;

  @Column({
    name: 'sms_service_sid',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  @Index('idx_sms_validation_sms_service_sid', ['smsServiceSid'], {
    unique: false,
  })
  smsServiceSid: string;

  @Column({
    name: 'sms_request_sid',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  @Index('idx_sms_validation_sms_request_sid', ['smsRequestSid'], {
    unique: false,
  })
  smsRequestSid: string;

  @Column({
    name: 'sms_action',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  smsAction: string;

  @Column({
    name: 'sms_status',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  smsStatus: string;

  @Column({
    name: 'sms_request_date',
    type: 'timestamptz',
    nullable: true,
  })
  smsRequestDate: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
