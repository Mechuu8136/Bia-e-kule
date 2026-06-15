import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meter } from '../meters/meter.entity';
import { MeterReading } from '../meters/meter-reading.entity';
import { SolarPanel } from '../solar/solar-panel.entity';
import { SolarProduction } from '../solar/solar-production.entity';
import { Building } from '../buildings/building.entity';
import { Announcement } from '../announcements/announcement.entity';
import { AirQualityReading } from '../air-quality/air-quality-reading.entity';
import { User } from '../users/user.entity';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { BuildingsModule } from '../buildings/buildings.module';
import { MetersModule } from '../meters/meters.module';
import { SolarModule } from '../solar/solar.module';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { UsersModule } from '../users/users.module';
import { ExternalIngestionService } from './external-ingestion.service';
import { ExternalProvisioningService } from './external-provisioning.service';
import { ExternalQueryService } from './external-query.service';
import { ExternalController } from './external.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Meter,
      MeterReading,
      SolarPanel,
      SolarProduction,
      Building,
      Announcement,
      AirQualityReading,
      User,
    ]),
    ApiKeysModule,
    BuildingsModule,
    MetersModule,
    SolarModule,
    AnnouncementsModule,
    UsersModule,
  ],
  providers: [
    ExternalIngestionService,
    ExternalProvisioningService,
    ExternalQueryService,
  ],
  controllers: [ExternalController],
})
export class ExternalModule {}
