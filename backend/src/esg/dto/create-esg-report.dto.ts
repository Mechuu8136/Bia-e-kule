import { IsBoolean, IsNumber, IsOptional, IsString, IsUrl, IsUUID, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEsgReportDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'ID budynku; puste = raport gminny' })
  @ValidateIf((dto: CreateEsgReportDto) => dto.building_id != null)
  @IsUUID()
  @IsOptional()
  building_id?: string | null;

  @ApiProperty({ description: 'Redukcja CO2 w kg', example: 1250.5 })
  @IsNumber()
  @Min(0)
  co2_reduction_kg!: number;

  @ApiPropertyOptional({ description: 'URL do pliku PDF raportu' })
  @IsOptional()
  @IsString()
  @IsUrl()
  document_url?: string;

  @ApiPropertyOptional({ description: 'Czy raport gminny jest publiczny' })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}
