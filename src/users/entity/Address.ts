import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

@Entity({ name: 'addresses' })
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  street: string;

  @Column({ type: 'varchar', length: 50 })
  externalNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  internalNumber?: string;

  @Column({ type: 'varchar', length: 150 })
  city: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  suburb?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  county?: string;

  @Column({ type: 'varchar', length: 150 })
  state: string;

  @Column({ type: 'varchar', length: 20 })
  zipCode: string;

  @Column({ type: 'varchar', length: 150 })
  country: string;

  @ManyToOne(() => User, (user) => user.addresses, {
    onDelete: 'CASCADE',
  })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
