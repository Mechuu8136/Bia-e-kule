import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from '../buildings/building.entity';
import { MeterReading } from '../meters/meter-reading.entity';
import { SolarProduction } from '../solar/solar-production.entity';
import { UsersModule } from '../users/users.module';
import { MetersModule } from '../meters/meters.module';
import { SolarModule } from '../solar/solar.module';
import { EsgModule } from '../esg/esg.module';
import { DemoDataSeedService } from './demo-data.seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Building, MeterReading, SolarProduction]),
    UsersModule,
    MetersModule,
    SolarModule,
    EsgModule,
  ],
  providers: [DemoDataSeedService],
})
export class SeedModule {}
