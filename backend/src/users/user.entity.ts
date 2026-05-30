// backend/src/users/user.entity.ts

import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserRole } from './user-role.enum';
import { UserBuilding } from './user-building.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.GOSC,
  })
  role!: UserRole;

  @OneToMany(() => UserBuilding, (userBuilding) => userBuilding.user)
  buildings!: UserBuilding[];
}