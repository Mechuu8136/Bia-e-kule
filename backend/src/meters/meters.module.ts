import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meter } from './meter.entity';
import { MeterReading } from './meter-reading.entity';
import { MetersService } from './meters.service';
import { MeterReadingsService } from './meter-readings.service';
import { UserBuilding } from '../users/user-building.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Meter, MeterReading, UserBuilding])],
  providers: [MetersService, MeterReadingsService],
  exports: [MetersService, MeterReadingsService],
})
export class MetersModule {}
