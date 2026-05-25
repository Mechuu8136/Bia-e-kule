// backend/src/buildings/building.entity.ts

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BuildingType } from './building-type.enum';
import { User } from '../users/user.entity';

@Entity('buildings') // nazwa tabeli w bazie danych
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

  // Relacja: każdy budynek ma jednego zarządcę (dyrektora) — powiązanie z tabelą Users
  // nullable: true – nowy budynek może być chwilowo bez przypisanego zarządcy
  @Column({ type: 'uuid', nullable: true })
  manager_id!: string | null;

  // Dekorator relacji – TypeORM zna pełny obiekt User pod tym polem (do joinów w zapytaniach)
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_id' })
  manager!: User | null;
}