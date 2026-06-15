import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsUUID('4', { each: true })
  building_ids?: string[];
}
