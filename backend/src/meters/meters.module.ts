import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meter } from './meter.entity';
import { MeterReading } from './meter-reading.entity';
import { MetersService } from './meters.service';
import { MeterReadingsService } from './meter-readings.service';
import { MetersController } from './meters.controller';
import { MeterReadingsController } from './meter-readings.controller';
import { UserBuilding } from '../users/user-building.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Meter, MeterReading, UserBuilding])],
  providers: [MetersService, MeterReadingsService],
  controllers: [MetersController, MeterReadingsController],
  exports: [MetersService, MeterReadingsService],
})
export class MetersModule {}
