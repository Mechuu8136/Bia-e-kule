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
import { ApiKeyScope } from './api-key-scope.enum';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  key_hash!: string;

  @Column({ length: 16 })
  key_prefix!: string;

  @Column({ type: 'enum', enum: ApiKeyScope, default: ApiKeyScope.ORGANIZATION })
  scope!: ApiKeyScope;

  @Column('uuid', { nullable: true })
  building_id?: string;

  @ManyToOne(() => Building, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'building_id' })
  building?: Building;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'int', default: 100 })
  rate_limit_per_minute!: number;

  @Column('uuid', { nullable: true })
  created_by_id?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  created_by?: User;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at?: Date;

  @CreateDateColumn()
  created_at!: Date;
}
