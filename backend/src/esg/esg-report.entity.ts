import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Building } from '../buildings/building.entity';

@Entity('esg_reports')
export class EsgReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  generated_by_id?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'generated_by_id' })
  generated_by?: User;

  @Column('uuid', { nullable: true })
  building_id?: string;

  @ManyToOne(() => Building, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'building_id' })
  building?: Building;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  co2_reduction_kg!: number;

  @Column({ nullable: true })
  document_url?: string;

  @Column({ default: false })
  is_public!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}
