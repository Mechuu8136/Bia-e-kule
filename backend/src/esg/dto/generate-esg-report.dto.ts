import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class GenerateEsgReportDto {
  @ApiPropertyOptional({
    description: 'ID budynku; puste = raport gminny',
    format: 'uuid',
  })
  @ValidateIf((dto: GenerateEsgReportDto) => dto.building_id != null)
  @IsUUID()
  @IsOptional()
  building_id?: string | null;

  @ApiProperty({
    description: 'Początek okresu raportowania (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDateString()
  start_date!: string;

  @ApiProperty({
    description: 'Koniec okresu raportowania (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsDateString()
  end_date!: string;

  @ApiPropertyOptional({
    description: 'Czy raport gminny ma być publiczny na panelu gościa',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}
