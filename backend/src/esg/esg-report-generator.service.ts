import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { Building } from '../buildings/building.entity';
import { Meter } from '../meters/meter.entity';
import { MeterReading } from '../meters/meter-reading.entity';
import { MeterType } from '../meters/meter-type.enum';
import { SolarPanel } from '../solar/solar-panel.entity';
import { SolarProduction } from '../solar/solar-production.entity';
import { MunicipalitySettings } from '../municipality/municipality-settings.entity';

/** Średnia emisja sieci energetycznej w Polsce [kg CO2 / kWh] */
const GRID_EMISSION_KG_PER_KWH = 0.662;

const METER_EMISSION_FACTORS: Record<MeterType, number> = {
  [MeterType.PRAD]: GRID_EMISSION_KG_PER_KWH,
  [MeterType.CIEPLO]: 0.2,
  [MeterType.WODA]: 0.34,
};

export interface Co2Breakdown {
  solarOffsetKg: number;
  consumptionReductionKg: number;
  totalKg: number;
  solarProductionKwh: number;
  periodStart: Date;
  periodEnd: Date;
  buildingIds: string[];
}

@Injectable()
export class EsgReportGeneratorService {
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'esg');

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
    @InjectRepository(MunicipalitySettings)
    private readonly settingsRepository: Repository<MunicipalitySettings>,
  ) {
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async calculateCo2Reduction(
    buildingId: string | null,
    startDate: Date,
    endDate: Date,
  ): Promise<Co2Breakdown> {
    const buildings = buildingId
      ? await this.buildingsRepository.find({ where: { id: buildingId } })
      : await this.buildingsRepository.find();

    const buildingIds = buildings.map((b) => b.id);
    if (buildingIds.length === 0) {
      return {
        solarOffsetKg: 0,
        consumptionReductionKg: 0,
        totalKg: 0,
        solarProductionKwh: 0,
        periodStart: startDate,
        periodEnd: endDate,
        buildingIds: [],
      };
    }

    const panels = await this.panelsRepository.find({
      where: { building_id: In(buildingIds) },
    });
    const panelIds = panels.map((p) => p.id);

    let solarProductionKwh = 0;
    if (panelIds.length > 0) {
      const solarRows = await this.productionRepository
        .createQueryBuilder('sp')
        .select('SUM(sp.energy_produced_kwh)', 'total')
        .where('sp.panel_id IN (:...panelIds)', { panelIds })
        .andWhere('sp.timestamp BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .getRawOne<{ total: string | null }>();
      solarProductionKwh = Number(solarRows?.total ?? 0);
    }

    const solarOffsetKg = solarProductionKwh * GRID_EMISSION_KG_PER_KWH;

    const meters = await this.metersRepository.find({
      where: { building_id: In(buildingIds) },
    });

    const periodMs = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - periodMs);
    const prevEnd = new Date(startDate.getTime() - 1);

    let consumptionReductionKg = 0;

    for (const meter of meters) {
      const currentSum = await this.sumReadings(
        meter.id,
        startDate,
        endDate,
      );
      const previousSum = await this.sumReadings(
        meter.id,
        prevStart,
        prevEnd,
      );
      const reduction = Math.max(0, previousSum - currentSum);
      consumptionReductionKg +=
        reduction * (METER_EMISSION_FACTORS[meter.type] ?? 0);
    }

    const totalKg = solarOffsetKg + consumptionReductionKg;

    return {
      solarOffsetKg,
      consumptionReductionKg,
      totalKg: Math.round(totalKg * 100) / 100,
      solarProductionKwh: Math.round(solarProductionKwh * 100) / 100,
      periodStart: startDate,
      periodEnd: endDate,
      buildingIds,
    };
  }

  private async sumReadings(
    meterId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.readingsRepository
      .createQueryBuilder('r')
      .select('SUM(r.value)', 'total')
      .where('r.meter_id = :meterId', { meterId })
      .andWhere('r.timestamp BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .getRawOne<{ total: string | null }>();
    return Number(result?.total ?? 0);
  }

  getReportFilePath(reportId: string): string {
    return join(this.uploadsDir, `${reportId}.pdf`);
  }

  async generatePdf(
    reportId: string,
    breakdown: Co2Breakdown,
    buildingName: string | null,
    municipalityName: string,
  ): Promise<string> {
    const filePath = this.getReportFilePath(reportId);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).text('Raport redukcji CO2 — EnergyCity', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Gmina: ${municipalityName}`);
      doc.text(
        `Zakres: ${buildingName ?? 'Cała gmina'}`,
      );
      doc.text(
        `Okres: ${breakdown.periodStart.toLocaleDateString('pl-PL')} — ${breakdown.periodEnd.toLocaleDateString('pl-PL')}`,
      );
      doc.moveDown();
      doc.fontSize(14).text('Podsumowanie redukcji emisji', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(
        `Produkcja OZE: ${breakdown.solarProductionKwh.toLocaleString('pl-PL')} kWh`,
      );
      doc.text(
        `Redukcja z OZE: ${breakdown.solarOffsetKg.toFixed(2)} kg CO₂`,
      );
      doc.text(
        `Redukcja zużycia mediów: ${breakdown.consumptionReductionKg.toFixed(2)} kg CO₂`,
      );
      doc.moveDown();
      doc.fontSize(16).text(
        `Łączna redukcja: ${breakdown.totalKg.toFixed(2)} kg CO₂`,
        { align: 'left' },
      );
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#666').text(
        'Wygenerowano automatycznie na podstawie odczytów liczników i produkcji OZE. ' +
          `Współczynnik emisji sieci: ${GRID_EMISSION_KG_PER_KWH} kg CO₂/kWh.`,
      );

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    return filePath;
  }

  async getMunicipalityName(): Promise<string> {
    const settings = await this.settingsRepository.find({ take: 1 });
    return settings[0]?.municipality_name ?? 'Gmina';
  }

  async getBuildingName(buildingId: string | null): Promise<string | null> {
    if (!buildingId) return null;
    const building = await this.buildingsRepository.findOne({
      where: { id: buildingId },
    });
    return building?.name ?? null;
  }
}
