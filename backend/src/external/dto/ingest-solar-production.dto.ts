import {
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExternalSolarProductionItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  panelSerialNumber!: string;

  @IsISO8601()
  timestamp!: string;

  @IsNumber()
  @IsPositive()
  energyProducedKwh!: number;

  @IsOptional()
  @IsUUID()
  buildingId?: string;
}

export class IngestSolarProductionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(500)
  @Type(() => ExternalSolarProductionItemDto)
  production!: ExternalSolarProductionItemDto[];
}
