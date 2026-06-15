import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Building } from '../buildings/building.entity';
import { UserBuilding } from '../users/user-building.entity';
import { Meter } from '../meters/meter.entity';
import { MeterReading } from '../meters/meter-reading.entity';
import { SolarPanel } from '../solar/solar-panel.entity';
import { SolarProduction } from '../solar/solar-production.entity';
import { EsgReport } from '../esg/esg-report.entity';
import { Announcement } from '../announcements/announcement.entity';
import { AirQualityReading } from '../air-quality/air-quality-reading.entity';
import { ApiKey } from '../api-keys/api-key.entity';
import { MunicipalitySettings } from '../municipality/municipality-settings.entity';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
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
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
