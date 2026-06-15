import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from '../buildings/building.entity';
import { Meter } from '../meters/meter.entity';
import { MeterReading } from '../meters/meter-reading.entity';
import { SolarPanel } from '../solar/solar-panel.entity';
import { SolarProduction } from '../solar/solar-production.entity';
import { EsgReport } from '../esg/esg-report.entity';
import { UsersModule } from '../users/users.module';
import { BuildingsModule } from '../buildings/buildings.module';
import { AuthModule } from '../auth/auth.module';
import { BuildingInsightsService } from './building-insights.service';
import { ResidentController } from './resident.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Building,
      Meter,
      MeterReading,
      SolarPanel,
      SolarProduction,
      EsgReport,
    ]),
    UsersModule,
    BuildingsModule,
    AuthModule,
  ],
  providers: [BuildingInsightsService],
  controllers: [ResidentController],
})
export class ResidentModule {}
