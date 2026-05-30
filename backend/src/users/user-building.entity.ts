import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Building } from '../buildings/building.entity';

@Entity('user_buildings')
export class UserBuilding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  user_id!: string;

  @ManyToOne(() => User, (user) => user.buildings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column('uuid')
  building_id!: string;

  @ManyToOne(() => Building, (building) => building.managers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'building_id' })
  building!: Building;

  @CreateDateColumn()
  created_at!: Date;
}
