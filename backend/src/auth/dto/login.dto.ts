import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'urzednik@gmina.pl' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'haslo123' })
  @IsString()
  @MinLength(1)
  password!: string;
}
