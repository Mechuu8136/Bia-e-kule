import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Building } from '../buildings/building.entity';
import { SolarProduction } from './solar-production.entity';

@Entity('solar_panels')
export class SolarPanel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  building_id!: string;

  @ManyToOne(() => Building, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'building_id' })
  building!: Building;

  @Column({ type: 'numeric', precision: 8, scale: 2 })
  capacity_kwp!: number;

  @Column({ type: 'date' })
  installation_date!: Date;

  @Column({ unique: true })
  serial_number!: string;

  @OneToMany(() => SolarProduction, (production) => production.panel)
  production!: SolarProduction[];
}
