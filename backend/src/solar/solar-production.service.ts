import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { SolarProduction } from './solar-production.entity';
import { SolarPanel } from './solar-panel.entity';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';
import { UserBuildingLinkType } from '../users/user-building-link-type.enum';
import { aggregateByTimeBucket } from '../database/aggregate-time-series';
import { BuildingAccessService } from '../access/building-access.service';

interface AggregatedProduction {
  date: string;
  totalProduction: number;
  avgProduction: number;
  maxProduction: number;
  minProduction: number;
  readingsCount: number;
}

@Injectable()
export class SolarProductionService {
  constructor(
    @InjectRepository(SolarProduction)
    private productionRepository: Repository<SolarProduction>,
    @InjectRepository(SolarPanel)
    private panelsRepository: Repository<SolarPanel>,
    @InjectRepository(UserBuilding)
    private userBuildingsRepository: Repository<UserBuilding>,
    private readonly buildingAccess: BuildingAccessService,
  ) {}

  private async ensurePanelAccess(
    panelId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    await this.buildingAccess.assertPanelAccess(panelId, userId, userRole);
  }

  async createProduction(
    panelId: string,
    timestamp: Date,
    energyProducedKwh: number,
  ): Promise<SolarProduction> {
    const production = this.productionRepository.create({
      panel_id: panelId,
      timestamp,
      energy_produced_kwh: energyProducedKwh,
    });
    return this.productionRepository.save(production);
  }

  async findProductionByPanel(
    panelId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<SolarProduction[]> {
    await this.ensurePanelAccess(panelId, userId, userRole);
    return this.productionRepository.find({
      where: { panel_id: panelId },
      order: { timestamp: 'ASC' },
    });
  }

  async findProductionByDateRange(
    panelId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    userRole: UserRole,
  ): Promise<SolarProduction[]> {
    await this.ensurePanelAccess(panelId, userId, userRole);
    return this.productionRepository.find({
      where: {
        panel_id: panelId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });
  }

  private mapAggregatedProduction(
    rows: Awaited<ReturnType<typeof aggregateByTimeBucket>>,
  ): AggregatedProduction[] {
    return rows.map((row) => ({
      date: row.date,
      totalProduction: row.sum,
      avgProduction: row.avg,
      maxProduction: row.max,
      minProduction: row.min,
      readingsCount: row.count,
    }));
  }

  async aggregateByDay(
    panelId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    userRole: UserRole,
  ): Promise<AggregatedProduction[]> {
    await this.ensurePanelAccess(panelId, userId, userRole);
    const rows = await aggregateByTimeBucket(this.productionRepository, {
      alias: 'production',
      foreignKeyColumn: 'panel_id',
      foreignKeyValue: panelId,
      valueColumn: 'energy_produced_kwh',
      startDate,
      endDate,
      unit: 'day',
    });

    return this.mapAggregatedProduction(rows);
  }

  async aggregateByMonth(
    panelId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    userRole: UserRole,
  ): Promise<AggregatedProduction[]> {
    await this.ensurePanelAccess(panelId, userId, userRole);
    const rows = await aggregateByTimeBucket(this.productionRepository, {
      alias: 'production',
      foreignKeyColumn: 'panel_id',
      foreignKeyValue: panelId,
      valueColumn: 'energy_produced_kwh',
      startDate,
      endDate,
      unit: 'month',
    });

    return this.mapAggregatedProduction(rows);
  }

  async getStatistics(
    panelId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{
    totalReadings: number;
    totalProduction: number;
    avgProduction: number;
    maxProduction: number;
    minProduction: number;
    latestReading: SolarProduction | null;
  }> {
    await this.ensurePanelAccess(panelId, userId, userRole);
    const stats = await this.productionRepository
      .createQueryBuilder('production')
      .select('COUNT(*)', 'totalReadings')
      .addSelect('SUM(production.energy_produced_kwh)', 'totalProduction')
      .addSelect('AVG(production.energy_produced_kwh)', 'avgProduction')
      .addSelect('MAX(production.energy_produced_kwh)', 'maxProduction')
      .addSelect('MIN(production.energy_produced_kwh)', 'minProduction')
      .where('production.panel_id = :panelId', { panelId })
      .getRawOne<{
        totalReadings: string;
        totalProduction: string | null;
        avgProduction: string | null;
        maxProduction: string | null;
        minProduction: string | null;
      }>();

    const totalReadings = Number(stats?.totalReadings ?? 0);

    if (totalReadings === 0) {
      return {
        totalReadings: 0,
        totalProduction: 0,
        avgProduction: 0,
        maxProduction: 0,
        minProduction: 0,
        latestReading: null,
      };
    }

    const latestReading = await this.productionRepository.findOne({
      where: { panel_id: panelId },
      order: { timestamp: 'DESC' },
    });

    return {
      totalReadings,
      totalProduction: Number(stats?.totalProduction ?? 0),
      avgProduction: Number(stats?.avgProduction ?? 0),
      maxProduction: Number(stats?.maxProduction ?? 0),
      minProduction: Number(stats?.minProduction ?? 0),
      latestReading,
    };
  }

  async deleteProduction(productionId: string): Promise<void> {
    await this.productionRepository.delete(productionId);
  }

  async findProductionWithAccess(
    userId: string,
    userRole: UserRole,
  ): Promise<SolarProduction[]> {
    if (userRole === UserRole.URZEDNIK) {
      return this.productionRepository.find({
        order: { timestamp: 'ASC' },
      });
    }

    if (userRole === UserRole.DYREKTOR) {
      const userBuildings = await this.userBuildingsRepository.find({
        where: { user_id: userId, link_type: UserBuildingLinkType.ASSIGNED },
      });

      if (userBuildings.length === 0) {
        return [];
      }

      const buildingIds = userBuildings.map((ub) => ub.building_id);
      const panels = await this.panelsRepository.find({
        where: { building_id: In(buildingIds) },
      });

      const panelIds = panels.map((p) => p.id);

      if (panelIds.length === 0) {
        return [];
      }

      return this.productionRepository.find({
        where: { panel_id: In(panelIds) },
        order: { timestamp: 'ASC' },
      });
    }

    return [];
  }
}
