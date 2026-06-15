import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('air_quality_readings')
export class AirQualityReading {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: 'Stacja pomiarowa — centrum gminy' })
  station_name!: string;

  @Column({ type: 'numeric', precision: 6, scale: 2 })
  pm25!: number;

  @Column({ type: 'numeric', precision: 6, scale: 2 })
  pm10!: number;

  @Column({ type: 'timestamp' })
  timestamp!: Date;
}
