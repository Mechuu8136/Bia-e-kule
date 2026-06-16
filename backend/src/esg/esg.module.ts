import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EsgReport } from './esg-report.entity';
import { EsgReportsService } from './esg-reports.service';
import { EsgReportGeneratorService } from './esg-report-generator.service';
import { EsgReportsController } from './esg-reports.controller';
import { UserBuilding } from '../users/user-building.entity';
import { Building } from '../buildings/building.entity';
import { Meter } from '../meters/meter.entity';
import { MeterReading } from '../meters/meter-reading.entity';
import { SolarPanel } from '../solar/solar-panel.entity';
import { SolarProduction } from '../solar/solar-production.entity';
import { MunicipalitySettings } from '../municipality/municipality-settings.entity';
import { AuthModule } from '../auth/auth.module';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EsgReport,
      UserBuilding,
      Building,
      Meter,
      MeterReading,
      SolarPanel,
      SolarProduction,
      MunicipalitySettings,
    ]),
    AuthModule,
    AccessModule,
  ],
  providers: [EsgReportsService, EsgReportGeneratorService],
  controllers: [EsgReportsController],
  exports: [EsgReportsService, EsgReportGeneratorService],
})
export class EsgModule {}
