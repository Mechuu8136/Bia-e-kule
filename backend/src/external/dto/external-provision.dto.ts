import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BuildingType } from '../../buildings/building-type.enum';
import { MeterType } from '../../meters/meter-type.enum';
import { UserRole } from '../../users/user-role.enum';

export class ProvisionBuildingDto {
  @IsString()
  @MinLength(2)
  externalCode!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  address!: string;

  @IsEnum(BuildingType)
  type!: BuildingType;
}

export class ProvisionMeterDto {
  @IsString()
  @MinLength(2)
  serialNumber!: string;

  @IsString()
  @MinLength(2)
  buildingExternalCode!: string;

  @IsEnum(MeterType)
  type!: MeterType;

  @IsString()
  @MinLength(1)
  unit!: string;
}

export class ProvisionSolarPanelDto {
  @IsString()
  @MinLength(2)
  serialNumber!: string;

  @IsString()
  @MinLength(2)
  buildingExternalCode!: string;

  @IsNumber()
  @Min(0)
  capacityKwp!: number;

  @IsDateString()
  installationDate!: string;
}

const PROVISIONABLE_ROLES = [UserRole.DYREKTOR, UserRole.MIESZKANIEC] as const;

export class ProvisionUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(PROVISIONABLE_ROLES)
  role!: (typeof PROVISIONABLE_ROLES)[number];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedBuildingExternalCodes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteBuildingExternalCodes?: string[];
}

export class ExternalProvisionDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProvisionBuildingDto)
  buildings?: ProvisionBuildingDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProvisionMeterDto)
  meters?: ProvisionMeterDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProvisionSolarPanelDto)
  solarPanels?: ProvisionSolarPanelDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProvisionUserDto)
  users?: ProvisionUserDto[];
}
