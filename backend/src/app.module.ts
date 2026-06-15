import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { BuildingsModule } from './buildings/buildings.module';
import { AuthModule } from './auth/auth.module';
import { MetersModule } from './meters/meters.module';
import { SolarModule } from './solar/solar.module';
import { EsgModule } from './esg/esg.module';
import { SeedModule } from './seed/seed.module';
import { ResidentModule } from './resident/resident.module';
import { PublicModule } from './public/public.module';
import { User } from './users/user.entity';
import { Building } from './buildings/building.entity';
import { UserBuilding } from './users/user-building.entity';
import { Meter } from './meters/meter.entity';
import { MeterReading } from './meters/meter-reading.entity';
import { SolarPanel } from './solar/solar-panel.entity';
import { SolarProduction } from './solar/solar-production.entity';
import { EsgReport } from './esg/esg-report.entity';
import { Announcement } from './announcements/announcement.entity';
import { AirQualityReading } from './air-quality/air-quality-reading.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Building, UserBuilding, Meter, MeterReading, SolarPanel, SolarProduction, EsgReport, Announcement, AirQualityReading],
        synchronize: true,
        logging: true,
      }),
    }),
    UsersModule,
    BuildingsModule,
    AuthModule,
    MetersModule,
    SolarModule,
    EsgModule,
    SeedModule,
    ResidentModule,
    PublicModule,
  ],
})
export class AppModule { }