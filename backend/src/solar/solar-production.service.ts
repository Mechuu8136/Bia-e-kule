import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { SolarProduction } from './solar-production.entity';
import { SolarPanel } from './solar-panel.entity';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';

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
  ) {}

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

  async findProductionByPanel(panelId: string): Promise<SolarProduction[]> {
    return this.productionRepository.find({
      where: { panel_id: panelId },
      order: { timestamp: 'ASC' },
    });
  }

  async findProductionByDateRange(
    panelId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SolarProduction[]> {
    return this.productionRepository.find({
      where: {
        panel_id: panelId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });
  }

  async aggregateByDay(
    panelId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AggregatedProduction[]> {
    const productions = await this.findProductionByDateRange(
      panelId,
      startDate,
      endDate,
    );

    const grouped = new Map<string, number[]>();

    productions.forEach((prod) => {
      const date = prod.timestamp.toISOString().split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(Number(prod.energy_produced_kwh));
    });

    return Array.from(grouped.entries()).map(([date, values]) => ({
      date,
      totalProduction: values.reduce((a, b) => a + b, 0),
      avgProduction: values.reduce((a, b) => a + b, 0) / values.length,
      maxProduction: Math.max(...values),
      minProduction: Math.min(...values),
      readingsCount: values.length,
    }));
  }

  async aggregateByMonth(
    panelId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AggregatedProduction[]> {
    const productions = await this.findProductionByDateRange(
      panelId,
      startDate,
      endDate,
    );

    const grouped = new Map<string, number[]>();

    productions.forEach((prod) => {
      const date = prod.timestamp.toISOString().slice(0, 7);
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(Number(prod.energy_produced_kwh));
    });

    return Array.from(grouped.entries()).map(([date, values]) => ({
      date,
      totalProduction: values.reduce((a, b) => a + b, 0),
      avgProduction: values.reduce((a, b) => a + b, 0) / values.length,
      maxProduction: Math.max(...values),
      minProduction: Math.min(...values),
      readingsCount: values.length,
    }));
  }

  async getStatistics(panelId: string): Promise<{
    totalReadings: number;
    totalProduction: number;
    avgProduction: number;
    maxProduction: number;
    minProduction: number;
    latestReading: SolarProduction | null;
  }> {
    const productions = await this.findProductionByPanel(panelId);

    if (productions.length === 0) {
      return {
        totalReadings: 0,
        totalProduction: 0,
        avgProduction: 0,
        maxProduction: 0,
        minProduction: 0,
        latestReading: null,
      };
    }

    const values = productions.map((p) => Number(p.energy_produced_kwh));

    return {
      totalReadings: productions.length,
      totalProduction: values.reduce((a, b) => a + b, 0),
      avgProduction: values.reduce((a, b) => a + b, 0) / values.length,
      maxProduction: Math.max(...values),
      minProduction: Math.min(...values),
      latestReading: productions[productions.length - 1],
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
        where: { user_id: userId },
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
