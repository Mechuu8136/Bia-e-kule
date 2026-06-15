import { IsBoolean, IsNumber, IsOptional, IsString, IsUrl, IsUUID, Min, ValidateIf } from 'class-validator';

export class CreateEsgReportDto {
  @ValidateIf((dto: CreateEsgReportDto) => dto.building_id != null)
  @IsUUID()
  @IsOptional()
  building_id?: string | null;

  @IsNumber()
  @Min(0)
  co2_reduction_kg!: number;

  @IsOptional()
  @IsString()
  @IsUrl()
  document_url?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}
