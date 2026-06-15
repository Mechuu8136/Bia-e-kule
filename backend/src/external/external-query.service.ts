import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from '../buildings/building.entity';
import { Meter } from '../meters/meter.entity';
import { MeterReading } from '../meters/meter-reading.entity';
import { SolarPanel } from '../solar/solar-panel.entity';
import { SolarProduction } from '../solar/solar-production.entity';
import { Announcement } from '../announcements/announcement.entity';
import { AirQualityReading } from '../air-quality/air-quality-reading.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class ExternalQueryService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingsRepository: Repository<Building>,
    @InjectRepository(Meter)
    private readonly metersRepository: Repository<Meter>,
    @InjectRepository(MeterReading)
    private readonly readingsRepository: Repository<MeterReading>,
    @InjectRepository(SolarPanel)
    private readonly panelsRepository: Repository<SolarPanel>,
    @InjectRepository(SolarProduction)
    private readonly productionRepository: Repository<SolarProduction>,
    @InjectRepository(Announcement)
    private readonly announcementsRepository: Repository<Announcement>,
    @InjectRepository(AirQualityReading)
    private readonly airQualityRepository: Repository<AirQualityReading>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

  async getStatus() {
    const [
      buildings,
      meters,
      meterReadings,
      solarPanels,
      solarProduction,
      announcements,
      airQualityReadings,
      users,
    ] = await Promise.all([
      this.buildingsRepository.count(),
      this.metersRepository.count(),
      this.readingsRepository.count(),
      this.panelsRepository.count(),
      this.productionRepository.count(),
      this.announcementsRepository.count(),
      this.airQualityRepository.count(),
      this.usersRepository.count(),
    ]);

    return {
      buildings,
      meters,
      meter_readings: meterReadings,
      solar_panels: solarPanels,
      solar_production: solarProduction,
      announcements,
      air_quality_readings: airQualityReadings,
      users,
      checked_at: new Date().toISOString(),
    };
  }

  async listBuildings() {
    const buildings = await this.buildingsRepository.find({
      order: { name: 'ASC' },
    });
    return buildings.map((b) => ({
      id: b.id,
      external_code: b.external_code,
      name: b.name,
      address: b.address,
      type: b.type,
    }));
  }

  async listMeters() {
    const meters = await this.metersRepository.find({ order: { serial_number: 'ASC' } });
    return meters.map((m) => ({
      id: m.id,
      building_id: m.building_id,
      serial_number: m.serial_number,
      type: m.type,
      unit: m.unit,
    }));
  }

  async listUsers() {
    const users = await this.usersService.findAll();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      building_ids: u.building_ids,
    }));
  }
}
