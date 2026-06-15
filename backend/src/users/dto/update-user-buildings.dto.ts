import { IsArray, IsUUID } from 'class-validator';

export class UpdateUserBuildingsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  building_ids!: string[];
}
