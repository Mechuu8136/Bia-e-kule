import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExternalAirQualityItemDto {
  @IsString()
  @MinLength(2)
  stationName!: string;

  @IsNumber()
  @Min(0)
  pm25!: number;

  @IsNumber()
  @Min(0)
  pm10!: number;

  @IsDateString()
  timestamp!: string;
}

export class IngestAirQualityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalAirQualityItemDto)
  readings!: ExternalAirQualityItemDto[];
}

export class ExternalAnnouncementItemDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(2)
  body!: string;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;
}

export class IngestAnnouncementsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalAnnouncementItemDto)
  announcements!: ExternalAnnouncementItemDto[];
}
