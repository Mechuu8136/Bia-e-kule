import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolarPanel } from './solar-panel.entity';
import { SolarProduction } from './solar-production.entity';
import { SolarPanelsService } from './solar-panels.service';
import { SolarProductionService } from './solar-production.service';
import { UserBuilding } from '../users/user-building.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SolarPanel, SolarProduction, UserBuilding])],
  providers: [SolarPanelsService, SolarProductionService],
  exports: [SolarPanelsService, SolarProductionService],
})
export class SolarModule {}
