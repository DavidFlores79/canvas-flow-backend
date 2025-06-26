import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('investment_products')
export class InvestmentProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @Column({ name: 'term_days', nullable: false })
  termDays: number;

  @Column({
    name: 'annual_rate',
    nullable: false,
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  annualRate: number;

  @Column({
    name: 'penalty_rate',
    nullable: false,
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  penaltyRate: number;

  @Column({
    name: 'min_amount',
    nullable: false,
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  minAmount: number;

  @Column({
    name: 'max_amount',
    nullable: false,
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  maxAmount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
