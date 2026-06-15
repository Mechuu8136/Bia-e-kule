import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class InitialSetupDto {
  @IsString()
  @MinLength(2)
  municipality_name!: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsEmail()
  admin_email!: string;

  @IsString()
  @MinLength(6)
  admin_password!: string;
}

export class UpdateMunicipalitySettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  municipality_name?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  air_quality_station_name?: string;

  @IsOptional()
  @IsBoolean()
  is_configured?: boolean;
}
