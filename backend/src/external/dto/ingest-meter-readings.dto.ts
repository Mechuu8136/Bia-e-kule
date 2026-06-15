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

export class ExternalMeterReadingItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber!: string;

  @IsISO8601()
  timestamp!: string;

  @IsNumber()
  @IsPositive()
  value!: number;

  @IsOptional()
  @IsUUID()
  buildingId?: string;
}

export class IngestMeterReadingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(500)
  @Type(() => ExternalMeterReadingItemDto)
  readings!: ExternalMeterReadingItemDto[];
}
