import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { AirQualityModule } from '../air-quality/air-quality.module';
import { EsgModule } from '../esg/esg.module';

@Module({
  imports: [AnnouncementsModule, AirQualityModule, EsgModule],
  controllers: [PublicController],
})
export class PublicModule {}
