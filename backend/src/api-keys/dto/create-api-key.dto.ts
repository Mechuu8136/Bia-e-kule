import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';
import { ApiKeyScope } from '../api-key-scope.enum';

export class CreateApiKeyDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(ApiKeyScope)
  scope!: ApiKeyScope;

  @IsOptional()
  @IsUUID()
  building_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  rate_limit_per_minute?: number;
}
