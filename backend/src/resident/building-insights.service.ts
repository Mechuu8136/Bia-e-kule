import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Building } from '../buildings/building.entity';
import { Meter } from '../meters/meter.entity';
import { MeterReading } from '../meters/meter-reading.entity';
import { MeterType } from '../meters/meter-type.enum';
import { SolarPanel } from '../solar/solar-panel.entity';
import { SolarProduction } from '../solar/solar-production.entity';
import { EsgReport } from '../esg/esg-report.entity';

export interface MonthlyTotal {
  month: string;
  total: number;
}

export interface MediaTypeSummary {
  type: MeterType;
  label: string;
  unit: string;
  currentMonthTotal: number;
  sameMonthLastYearTotal: number;
  yearOverYearChangePercent: number | null;
  monthlyTrend: MonthlyTotal[];
}

export interface BuildingSummary {
  building: Building;
  media: MediaTypeSummary[];
  solar: {
    monthlyProduction: MonthlyTotal[];
    last12MonthsTotal: number;
  };
  esgReports: EsgReport[];
}

const getMediaLabel = (type: MeterType): string => {
  if (type === MeterType.PRAD) return 'Prąd';
  if (type === MeterType.WODA) return 'Woda';
  return 'Ciepło';
};

@Injectable()
export class BuildingInsightsService {
  constructor(
    @InjectRepository(Building)
    private buildingsRepository: Repository<Building>,
    @InjectRepository(Meter)
    private metersRepository: Repository<Meter>,
    @InjectRepository(MeterReading)
    private readingsRepository: Repository<MeterReading>,
    @InjectRepository(SolarPanel)
    private panelsRepository: Repository<SolarPanel>,
    @InjectRepository(SolarProduction)
    private productionRepository: Repository<SolarProduction>,
    @InjectRepository(EsgReport)
    private reportsRepository: Repository<EsgReport>,
  ) {}

  async getBuildingSummary(buildingId: string): Promise<BuildingSummary> {
    const building = await this.buildingsRepository.findOne({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundException('Budynek nie został znaleziony');
    }

    const meters = await this.metersRepository.find({
      where: { building_id: buildingId },
    });

    const now = new Date();
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const trendEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const media = await Promise.all(
      (Object.values(MeterType) as MeterType[]).map((type) =>
        this.summarizeMediaType(meters, type, trendStart, trendEnd, now),
      ),
    );

    const solar = await this.summarizeSolar(buildingId, trendStart, trendEnd);

    const esgReports = await this.reportsRepository.find({
      where: { building_id: buildingId },
      order: { created_at: 'DESC' },
    });

    return { building, media, solar, esgReports };
  }

  private async summarizeMediaType(
    meters: Meter[],
    type: MeterType,
    trendStart: Date,
    trendEnd: Date,
    now: Date,
  ): Promise<MediaTypeSummary> {
    const typeMeters = meters.filter((m) => m.type === type);
    const unit = typeMeters[0]?.unit ?? (type === MeterType.WODA ? 'm³' : 'kWh');

    if (typeMeters.length === 0) {
      return {
        type,
        label: getMediaLabel(type),
        unit,
        currentMonthTotal: 0,
        sameMonthLastYearTotal: 0,
        yearOverYearChangePercent: null,
        monthlyTrend: [],
      };
    }

    const meterIds = typeMeters.map((m) => m.id);
    const readings = await this.readingsRepository.find({
      where: {
        meter_id: In(meterIds),
        timestamp: Between(trendStart, trendEnd),
      },
      order: { timestamp: 'ASC' },
    });

    const monthlyMap = new Map<string, number>();
    readings.forEach((reading) => {
      const month = reading.timestamp.toISOString().slice(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + Number(reading.value));
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const currentMonthKey = now.toISOString().slice(0, 7);
    const lastYearMonthKey = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthTotal = monthlyMap.get(currentMonthKey) ?? 0;
    const sameMonthLastYearTotal = monthlyMap.get(lastYearMonthKey) ?? 0;

    let yearOverYearChangePercent: number | null = null;
    if (sameMonthLastYearTotal > 0) {
      yearOverYearChangePercent =
        ((currentMonthTotal - sameMonthLastYearTotal) / sameMonthLastYearTotal) * 100;
    }

    return {
      type,
      label: getMediaLabel(type),
      unit,
      currentMonthTotal,
      sameMonthLastYearTotal,
      yearOverYearChangePercent,
      monthlyTrend,
    };
  }

  private async summarizeSolar(
    buildingId: string,
    trendStart: Date,
    trendEnd: Date,
  ): Promise<{ monthlyProduction: MonthlyTotal[]; last12MonthsTotal: number }> {
    const panels = await this.panelsRepository.find({
      where: { building_id: buildingId },
    });

    if (panels.length === 0) {
      return { monthlyProduction: [], last12MonthsTotal: 0 };
    }

    const panelIds = panels.map((p) => p.id);
    const production = await this.productionRepository.find({
      where: {
        panel_id: In(panelIds),
        timestamp: Between(trendStart, trendEnd),
      },
      order: { timestamp: 'ASC' },
    });

    const monthlyMap = new Map<string, number>();
    production.forEach((record) => {
      const month = record.timestamp.toISOString().slice(0, 7);
      monthlyMap.set(
        month,
        (monthlyMap.get(month) ?? 0) + Number(record.energy_produced_kwh),
      );
    });

    const monthlyProduction = Array.from(monthlyMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const last12MonthsTotal = monthlyProduction.reduce((sum, m) => sum + m.total, 0);

    return { monthlyProduction, last12MonthsTotal };
  }
}
