// backend/src/buildings/building.entity.ts

import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BuildingType } from './building-type.enum';
import { UserBuilding } from '../users/user-building.entity';

@Entity('buildings')
export class Building {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  address!: string;

  @Column({
    type: 'enum',
    enum: BuildingType,
    default: BuildingType.INNY,
  })
  type!: BuildingType;

  @Column({ unique: true, nullable: true })
  external_code?: string;

  @OneToMany(() => UserBuilding, (userBuilding) => userBuilding.building)
  managers!: UserBuilding[];
}