import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('municipality_settings')
export class MunicipalitySettings {
  @PrimaryColumn({ type: 'int', default: 1 })
  id!: number;

  @Column({ default: '' })
  municipality_name!: string;

  @Column({ default: '' })
  tagline!: string;

  @Column({ default: 'Stacja pomiarowa — centrum gminy' })
  air_quality_station_name!: string;

  @Column({ default: false })
  is_configured!: boolean;
}
