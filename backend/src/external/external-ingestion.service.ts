import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meter } from '../meters/meter.entity';
import { MeterReading } from '../meters/meter-reading.entity';
import { SolarPanel } from '../solar/solar-panel.entity';
import { SolarProduction } from '../solar/solar-production.entity';
import { AirQualityReading } from '../air-quality/air-quality-reading.entity';
import { ApiKeyContext } from '../api-keys/api-key-context.interface';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { AnnouncementsService } from '../announcements/announcements.service';
import { ExternalMeterReadingItemDto } from './dto/ingest-meter-readings.dto';
import { ExternalSolarProductionItemDto } from './dto/ingest-solar-production.dto';
import {
  ExternalAirQualityItemDto,
  ExternalAnnouncementItemDto,
} from './dto/ingest-air-quality.dto';
import { IngestionResult } from './ingestion-result.interface';

@Injectable()
export class ExternalIngestionService {
  constructor(
    @InjectRepository(Meter)
    private readonly metersRepository: Repository<Meter>,
    @InjectRepository(MeterReading)
    private readonly readingsRepository: Repository<MeterReading>,
    @InjectRepository(SolarPanel)
    private readonly panelsRepository: Repository<SolarPanel>,
    @InjectRepository(SolarProduction)
    private readonly productionRepository: Repository<SolarProduction>,
    @InjectRepository(AirQualityReading)
    private readonly airQualityRepository: Repository<AirQualityReading>,
    private readonly apiKeysService: ApiKeysService,
    private readonly announcementsService: AnnouncementsService,
  ) {}

  async ingestMeterReadings(
    apiKey: ApiKeyContext,
    items: ExternalMeterReadingItemDto[],
  ): Promise<IngestionResult> {
    const result: IngestionResult = {
      accepted: 0,
      skipped_duplicates: 0,
      rejected: 0,
      errors: [],
    };

    const toUpsert: Partial<MeterReading>[] = [];

    for (const item of items) {
      const meter = await this.metersRepository.findOne({
        where: { serial_number: item.serialNumber },
      });

      if (!meter) {
        result.rejected++;
        result.errors.push({
          identifier: item.serialNumber,
          timestamp: item.timestamp,
          reason: 'Nie znaleziono licznika o podanym numerze seryjnym',
        });
        continue;
      }

      if (!this.apiKeysService.canAccessBuilding(apiKey, meter.building_id)) {
        result.rejected++;
        result.errors.push({
          identifier: item.serialNumber,
          timestamp: item.timestamp,
          reason: 'Klucz API nie ma dostępu do budynku tego licznika',
        });
        continue;
      }

      toUpsert.push({
        meter_id: meter.id,
        timestamp: new Date(item.timestamp),
        value: item.value,
      });
    }

    if (toUpsert.length > 0) {
      const upsertResult = await this.upsertMeterReadings(toUpsert);
      result.accepted += upsertResult.inserted;
      result.skipped_duplicates += upsertResult.skipped;
    }

    return result;
  }

  async ingestSolarProduction(
    apiKey: ApiKeyContext,
    items: ExternalSolarProductionItemDto[],
  ): Promise<IngestionResult> {
    const result: IngestionResult = {
      accepted: 0,
      skipped_duplicates: 0,
      rejected: 0,
      errors: [],
    };

    const toUpsert: Partial<SolarProduction>[] = [];

    for (const item of items) {
      const panel = await this.panelsRepository.findOne({
        where: { serial_number: item.panelSerialNumber },
      });

      if (!panel) {
        result.rejected++;
        result.errors.push({
          identifier: item.panelSerialNumber,
          timestamp: item.timestamp,
          reason: 'Nie znaleziono instalacji PV o podanym numerze seryjnym',
        });
        continue;
      }

      if (!this.apiKeysService.canAccessBuilding(apiKey, panel.building_id)) {
        result.rejected++;
        result.errors.push({
          identifier: item.panelSerialNumber,
          timestamp: item.timestamp,
          reason: 'Klucz API nie ma dostępu do budynku tej instalacji',
        });
        continue;
      }

      toUpsert.push({
        panel_id: panel.id,
        timestamp: new Date(item.timestamp),
        energy_produced_kwh: item.energyProducedKwh,
      });
    }

    if (toUpsert.length > 0) {
      const upsertResult = await this.upsertSolarProduction(toUpsert);
      result.accepted += upsertResult.inserted;
      result.skipped_duplicates += upsertResult.skipped;
    }

    return result;
  }

  async ingestAirQuality(items: ExternalAirQualityItemDto[]): Promise<IngestionResult> {
    const result: IngestionResult = {
      accepted: 0,
      skipped_duplicates: 0,
      rejected: 0,
      errors: [],
    };

    for (const item of items) {
      try {
        await this.airQualityRepository.save(
          this.airQualityRepository.create({
            station_name: item.stationName,
            pm25: item.pm25,
            pm10: item.pm10,
            timestamp: new Date(item.timestamp),
          }),
        );
        result.accepted++;
      } catch (err) {
        result.rejected++;
        result.errors.push({
          identifier: item.stationName,
          timestamp: item.timestamp,
          reason: (err as Error).message,
        });
      }
    }

    return result;
  }

  async ingestAnnouncements(items: ExternalAnnouncementItemDto[]): Promise<IngestionResult> {
    const result: IngestionResult = {
      accepted: 0,
      skipped_duplicates: 0,
      rejected: 0,
      errors: [],
    };

    for (const item of items) {
      try {
        await this.announcementsService.create(
          item.title,
          item.body,
          item.is_published ?? true,
        );
        result.accepted++;
      } catch (err) {
        result.rejected++;
        result.errors.push({
          identifier: item.title,
          reason: (err as Error).message,
        });
      }
    }

    return result;
  }

  private async upsertMeterReadings(
    rows: Partial<MeterReading>[],
  ): Promise<{ inserted: number; skipped: number }> {
    const result = await this.readingsRepository
      .createQueryBuilder()
      .insert()
      .into(MeterReading)
      .values(rows)
      .orIgnore()
      .returning('id')
      .execute();

    const inserted = result.raw?.length ?? 0;
    return { inserted, skipped: rows.length - inserted };
  }

  private async upsertSolarProduction(
    rows: Partial<SolarProduction>[],
  ): Promise<{ inserted: number; skipped: number }> {
    const result = await this.productionRepository
      .createQueryBuilder()
      .insert()
      .into(SolarProduction)
      .values(rows)
      .orIgnore()
      .returning('id')
      .execute();

    const inserted = result.raw?.length ?? 0;
    return { inserted, skipped: rows.length - inserted };
  }
}
