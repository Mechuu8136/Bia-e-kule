import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SolarPanel } from './solar-panel.entity';

@Entity('solar_production')
export class SolarProduction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  panel_id!: string;

  @ManyToOne(() => SolarPanel, (panel) => panel.production, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'panel_id' })
  panel!: SolarPanel;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  energy_produced_kwh!: number;
}
