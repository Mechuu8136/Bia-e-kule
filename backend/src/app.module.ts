import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { BuildingsModule } from './buildings/buildings.module';
import { AuthModule } from './auth/auth.module';
import { MetersModule } from './meters/meters.module';
import { SolarModule } from './solar/solar.module';
import { EsgModule } from './esg/esg.module';
import { MunicipalityModule } from './municipality/municipality.module';
import { ResidentModule } from './resident/resident.module';
import { PublicModule } from './public/public.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ExternalModule } from './external/external.module';
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
import { ApiKey } from './api-keys/api-key.entity';
import { MunicipalitySettings } from './municipality/municipality-settings.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => [{ ttl: 60000, limit: 300 }],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [
          User,
          Building,
          UserBuilding,
          Meter,
          MeterReading,
          SolarPanel,
          SolarProduction,
          EsgReport,
          Announcement,
          AirQualityReading,
          ApiKey,
          MunicipalitySettings,
        ],
        synchronize: false,
        migrations: [join(__dirname, 'migrations', '*.{js,ts}')],
        migrationsRun: true,
        logging: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    UsersModule,
    BuildingsModule,
    AuthModule,
    MetersModule,
    SolarModule,
    EsgModule,
    MunicipalityModule,
    ResidentModule,
    PublicModule,
    ApiKeysModule,
    ExternalModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
