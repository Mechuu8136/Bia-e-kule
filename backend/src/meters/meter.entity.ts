import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Building } from '../buildings/building.entity';
import { MeterType } from './meter-type.enum';
import { MeterReading } from './meter-reading.entity';

@Entity('meters')
export class Meter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  building_id!: string;

  @ManyToOne(() => Building, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'building_id' })
  building!: Building;

  @Column({
    type: 'enum',
    enum: MeterType,
  })
  type!: MeterType;

  @Column()
  serial_number!: string;

  @Column()
  unit!: string;

  @OneToMany(() => MeterReading, (reading) => reading.meter)
  readings!: MeterReading[];
}
