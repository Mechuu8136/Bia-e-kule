import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Meter } from './meter.entity';

@Entity('meter_readings')
export class MeterReading {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  meter_id!: string;

  @ManyToOne(() => Meter, (meter) => meter.readings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meter_id' })
  meter!: Meter;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  value!: number;
}
