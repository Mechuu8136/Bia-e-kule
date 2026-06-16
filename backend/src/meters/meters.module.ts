import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meter } from './meter.entity';
import { MeterReading } from './meter-reading.entity';
import { MetersService } from './meters.service';
import { MeterReadingsService } from './meter-readings.service';
import { MetersController } from './meters.controller';
import { MeterReadingsController } from './meter-readings.controller';
import { UserBuilding } from '../users/user-building.entity';
import { AuthModule } from '../auth/auth.module';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meter, MeterReading, UserBuilding]),
    AuthModule,
    AccessModule,
  ],
  providers: [MetersService, MeterReadingsService],
  controllers: [MetersController, MeterReadingsController],
  exports: [MetersService, MeterReadingsService],
})
export class MetersModule {}
