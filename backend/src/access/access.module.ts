import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBuilding } from '../users/user-building.entity';
import { Meter } from '../meters/meter.entity';
import { SolarPanel } from '../solar/solar-panel.entity';
import { BuildingAccessService } from './building-access.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserBuilding, Meter, SolarPanel])],
  providers: [BuildingAccessService],
  exports: [BuildingAccessService],
})
export class AccessModule {}
