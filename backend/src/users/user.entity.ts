// backend/src/users/user.entity.ts

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity('users') // nazwa tabeli w bazie danych
export class User {
  @PrimaryGeneratedColumn('uuid') // automatycznie generowane UUID jako klucz główny
  id!: string;

  @Column({ unique: true }) // pole musi być unikalne (nie można mieć dwóch kont z tym samym emailem)
  email!: string;

  @Column()
  password_hash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.GOSC, // domyślna rola przy tworzeniu konta
  })
  role!: UserRole;

  // Klucz obcy do tabeli Buildings (uzupełniany później, gdy Buildings będą gotowe)
  // nullable: true – dla urzędnika i gościa to pole będzie NULL
  @Column({ type: 'uuid', nullable: true })
  assigned_building_id!: string | null;
}