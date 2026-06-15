import { IsBoolean, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class UpdateEsgReportDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  co2_reduction_kg?: number;

  @IsOptional()
  @IsString()
  @IsUrl()
  document_url?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}
