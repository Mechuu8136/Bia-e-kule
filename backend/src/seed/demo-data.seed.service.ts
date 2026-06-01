import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from '../buildings/building.entity';
import { BuildingType } from '../buildings/building-type.enum';
import { MeterReading } from '../meters/meter-reading.entity';
import { MeterType } from '../meters/meter-type.enum';
import { SolarProduction } from '../solar/solar-production.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';
import { MetersService } from '../meters/meters.service';
import { SolarPanelsService } from '../solar/solar-panels.service';
import { EsgReportsService } from '../esg/esg-reports.service';
import { User } from '../users/user.entity';

const SCHOOL_NAME = 'Szkoła Podstawowa nr 1';

@Injectable()
export class DemoDataSeedService implements OnModuleInit {
  private readonly logger = new Logger(DemoDataSeedService.name);

  constructor(
    @InjectRepository(Building)
    private readonly buildingsRepository: Repository<Building>,
    @InjectRepository(MeterReading)
    private readonly readingsRepository: Repository<MeterReading>,
    @InjectRepository(SolarProduction)
    private readonly productionRepository: Repository<SolarProduction>,
    private readonly usersService: UsersService,
    private readonly metersService: MetersService,
    private readonly solarPanelsService: SolarPanelsService,
    private readonly esgReportsService: EsgReportsService,
  ) {}

  async onModuleInit() {
    await this.seedUsers();

    if ((await this.buildingsRepository.count()) > 0) {
      await this.ensureDyrektorAssignment();
      return;
    }

    this.logger.log('Tworzenie przykładowych danych demo...');
    await this.seedDemoData();
    this.logger.log('Przykładowe dane demo gotowe.');
  }

  private async seedUsers() {
    const testUsers = [
      { email: 'admin@example.com', password: 'password', role: UserRole.URZEDNIK },
      { email: 'dyrektor@example.com', password: 'password', role: UserRole.DYREKTOR },
    ];

    for (const { email, password, role } of testUsers) {
      const existing = await this.usersService.findByEmail(email);
      if (!existing) {
        await this.usersService.createUser(email, password, role);
      }
    }
  }

  private async ensureDyrektorAssignment() {
    const dyrektor = await this.usersService.findByEmail('dyrektor@example.com');
    const school = await this.buildingsRepository.findOne({ where: { name: SCHOOL_NAME } });
    if (!dyrektor || !school) return;

    const assigned = await this.usersService.getUserBuildings(dyrektor.id);
    if (!assigned.includes(school.id)) {
      await this.usersService.assignBuildingToUser(dyrektor.id, school.id);
    }
  }

  private async seedDemoData() {
    const admin = await this.usersService.findByEmail('admin@example.com');
    if (!admin) return;

    const school = await this.createBuilding(
      SCHOOL_NAME,
      'ul. Kopernika 10, Choroszcz',
      BuildingType.SZKOLA,
    );
    const office = await this.createBuilding(
      'Urząd Gminy',
      'ul. Urzędnika 5, Choroszcz',
      BuildingType.URZAD,
    );
    const hospital = await this.createBuilding(
      'Szpital Miejski',
      'ul. Zdrowotna 20, Choroszcz',
      BuildingType.SZPITAL,
    );

    const dyrektor = await this.usersService.findByEmail('dyrektor@example.com');
    if (dyrektor) {
      await this.usersService.assignBuildingToUser(dyrektor.id, school.id);
    }

    const schoolMeters = await Promise.all([
      this.metersService.createMeter(school.id, MeterType.PRAD, 'PRAD-001', 'kWh'),
      this.metersService.createMeter(school.id, MeterType.WODA, 'WODA-001', 'm³'),
      this.metersService.createMeter(school.id, MeterType.CIEPLO, 'CIEPLO-001', 'GJ'),
    ]);
    const officeMeters = await Promise.all([
      this.metersService.createMeter(office.id, MeterType.PRAD, 'PRAD-002', 'kWh'),
      this.metersService.createMeter(office.id, MeterType.WODA, 'WODA-002', 'm³'),
    ]);
    const hospitalMeters = await Promise.all([
      this.metersService.createMeter(hospital.id, MeterType.PRAD, 'PRAD-003', 'kWh'),
      this.metersService.createMeter(hospital.id, MeterType.WODA, 'WODA-003', 'm³'),
      this.metersService.createMeter(hospital.id, MeterType.CIEPLO, 'CIEPLO-003', 'GJ'),
    ]);

    await this.seedMeterReadings([
      ...schoolMeters.map((m) => ({ meterId: m.id, type: m.type })),
      ...officeMeters.map((m) => ({ meterId: m.id, type: m.type })),
      ...hospitalMeters.map((m) => ({ meterId: m.id, type: m.type })),
    ]);

    const schoolPanel = await this.solarPanelsService.createPanel(
      school.id,
      25.5,
      new Date('2023-01-15'),
    );
    const officePanel = await this.solarPanelsService.createPanel(
      office.id,
      15.0,
      new Date('2022-06-01'),
    );
    const hospitalPanel = await this.solarPanelsService.createPanel(
      hospital.id,
      40.0,
      new Date('2021-09-10'),
    );

    await this.seedSolarProduction([
      { panelId: schoolPanel.id, capacityKwp: 25.5 },
      { panelId: officePanel.id, capacityKwp: 15.0 },
      { panelId: hospitalPanel.id, capacityKwp: 40.0 },
    ]);

    await this.seedEsgReports(admin, [school, office, hospital]);
  }

  private async createBuilding(name: string, address: string, type: BuildingType) {
    const building = this.buildingsRepository.create({ name, address, type });
    return this.buildingsRepository.save(building);
  }

  private async seedMeterReadings(meters: { meterId: string; type: MeterType }[]) {
    const readings: MeterReading[] = [];

    for (let daysAgo = 365; daysAgo >= 0; daysAgo--) {
      const timestamp = this.daysAgo(daysAgo);
      const month = timestamp.getMonth();
      const isWinter = month <= 2 || month >= 10;

      for (const { meterId, type } of meters) {
        readings.push(
          this.readingsRepository.create({
            meter_id: meterId,
            timestamp,
            value: this.randomMeterValue(type, isWinter),
          }),
        );
      }
    }

    await this.readingsRepository.save(readings, { chunk: 500 });
  }

  private async seedSolarProduction(panels: { panelId: string; capacityKwp: number }[]) {
    const productions: SolarProduction[] = [];

    for (let daysAgo = 365; daysAgo >= 0; daysAgo--) {
      const timestamp = this.daysAgo(daysAgo);
      const month = timestamp.getMonth();
      const isSummer = month >= 4 && month <= 8;

      for (const { panelId, capacityKwp } of panels) {
        const base = capacityKwp * (isSummer ? 4.5 : 1.2);
        const dailyKwh = Math.round(base * (0.6 + Math.random() * 0.4) * 100) / 100;

        productions.push(
          this.productionRepository.create({
            panel_id: panelId,
            timestamp,
            energy_produced_kwh: dailyKwh,
          }),
        );
      }
    }

    await this.productionRepository.save(productions, { chunk: 500 });
  }

  private async seedEsgReports(admin: User, buildings: Building[]) {
    const buildingReports = [
      { co2: 1250.5, url: 'https://example.com/raport-szkola-2025.pdf' },
      { co2: 890.0, url: 'https://example.com/raport-szkola-2024.pdf' },
      { co2: 620.75, url: 'https://example.com/raport-urzad-2025.pdf' },
      { co2: 2100.0, url: 'https://example.com/raport-szpital-2025.pdf' },
      { co2: 1750.25, url: 'https://example.com/raport-szpital-2024.pdf' },
    ];

    await this.esgReportsService.createReport(
      admin.id,
      buildings[0].id,
      buildingReports[0].co2,
      buildingReports[0].url,
    );
    await this.esgReportsService.createReport(
      admin.id,
      buildings[0].id,
      buildingReports[1].co2,
      buildingReports[1].url,
    );
    await this.esgReportsService.createReport(
      admin.id,
      buildings[1].id,
      buildingReports[2].co2,
      buildingReports[2].url,
    );
    await this.esgReportsService.createReport(
      admin.id,
      buildings[2].id,
      buildingReports[3].co2,
      buildingReports[3].url,
    );
    await this.esgReportsService.createReport(
      admin.id,
      buildings[2].id,
      buildingReports[4].co2,
      buildingReports[4].url,
    );

    await this.esgReportsService.createReport(admin.id, null, 5400.0, 'https://example.com/raport-gmina-2025.pdf');
    await this.esgReportsService.createReport(admin.id, null, 4800.5, 'https://example.com/raport-gmina-2024.pdf');
  }

  private randomMeterValue(type: MeterType, isWinter: boolean): number {
    switch (type) {
      case MeterType.PRAD:
        return Math.round((isWinter ? 120 : 80) + Math.random() * 80);
      case MeterType.WODA:
        return Math.round((15 + Math.random() * 25) * 100) / 100;
      case MeterType.CIEPLO:
        return Math.round((isWinter ? 18 : 5) + Math.random() * 12);
      default:
        return Math.round(Math.random() * 100);
    }
  }

  private daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(12, 0, 0, 0);
    return date;
  }
}
