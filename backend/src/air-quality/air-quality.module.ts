import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AirQualityReading } from './air-quality-reading.entity';
import { AirQualityService } from './air-quality.service';

@Module({
  imports: [TypeOrmModule.forFeature([AirQualityReading])],
  providers: [AirQualityService],
  exports: [AirQualityService],
})
export class AirQualityModule {}
