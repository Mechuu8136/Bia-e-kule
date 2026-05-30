import { UserRole } from '../user-role.enum';

export class CreateUserDto {
  email!: string;
  password!: string;
  role!: UserRole;
  building_ids?: string[]; // Array of building IDs to assign (for DYREKTOR)
}