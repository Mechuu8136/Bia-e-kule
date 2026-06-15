import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '../user-role.enum';

const CREATABLE_ROLES = [UserRole.DYREKTOR, UserRole.MIESZKANIEC] as const;

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(CREATABLE_ROLES)
  role!: (typeof CREATABLE_ROLES)[number];

  @IsOptional()
  @IsUUID('4', { each: true })
  building_ids?: string[];
}
