// backend/src/buildings/buildings.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './building.entity';
import { BuildingsService } from './buildings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Building]),
  ],
  providers: [BuildingsService],
  exports: [BuildingsService, TypeOrmModule],
})
export class BuildingsModule {}