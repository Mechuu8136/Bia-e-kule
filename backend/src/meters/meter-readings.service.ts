import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { MeterReading } from './meter-reading.entity';
import { Meter } from './meter.entity';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';
import { UserBuildingLinkType } from '../users/user-building-link-type.enum';

interface AggregatedData {
  date: string;
  sum: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

@Injectable()
export class MeterReadingsService {
  constructor(
    @InjectRepository(MeterReading)
    private readingsRepository: Repository<MeterReading>,
    @InjectRepository(Meter)
    private metersRepository: Repository<Meter>,
    @InjectRepository(UserBuilding)
    private userBuildingsRepository: Repository<UserBuilding>,
  ) {}

  async createReading(
    meterId: string,
    timestamp: Date,
    value: number,
  ): Promise<MeterReading> {
    const reading = this.readingsRepository.create({
      meter_id: meterId,
      timestamp,
      value,
    });
    return this.readingsRepository.save(reading);
  }

  async findReadingsByMeter(meterId: string): Promise<MeterReading[]> {
    return this.readingsRepository.find({
      where: { meter_id: meterId },
      order: { timestamp: 'ASC' },
    });
  }

  async findReadingsByDateRange(
    meterId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MeterReading[]> {
    return this.readingsRepository.find({
      where: {
        meter_id: meterId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });
  }

  async aggregateByDay(
    meterId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AggregatedData[]> {
    const readings = await this.findReadingsByDateRange(
      meterId,
      startDate,
      endDate,
    );

    const grouped = new Map<string, number[]>();

    readings.forEach((reading) => {
      const date = reading.timestamp.toISOString().split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(Number(reading.value));
    });

    return Array.from(grouped.entries()).map(([date, values]) => ({
      date,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }));
  }

  async aggregateByHour(
    meterId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AggregatedData[]> {
    const readings = await this.findReadingsByDateRange(
      meterId,
      startDate,
      endDate,
    );

    const grouped = new Map<string, number[]>();

    readings.forEach((reading) => {
      const date = reading.timestamp.toISOString().slice(0, 13);
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(Number(reading.value));
    });

    return Array.from(grouped.entries()).map(([date, values]) => ({
      date,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }));
  }

  async aggregateByMonth(
    meterId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AggregatedData[]> {
    const readings = await this.findReadingsByDateRange(
      meterId,
      startDate,
      endDate,
    );

    const grouped = new Map<string, number[]>();

    readings.forEach((reading) => {
      const date = reading.timestamp.toISOString().slice(0, 7);
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(Number(reading.value));
    });

    return Array.from(grouped.entries()).map(([date, values]) => ({
      date,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }));
  }

  async getStatistics(meterId: string): Promise<{
    totalReadings: number;
    minValue: number;
    maxValue: number;
    avgValue: number;
    latestReading: MeterReading | null;
  }> {
    const readings = await this.findReadingsByMeter(meterId);

    if (readings.length === 0) {
      return {
        totalReadings: 0,
        minValue: 0,
        maxValue: 0,
        avgValue: 0,
        latestReading: null,
      };
    }

    const values = readings.map((r) => Number(r.value));

    return {
      totalReadings: readings.length,
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      avgValue: values.reduce((a, b) => a + b, 0) / values.length,
      latestReading: readings[readings.length - 1],
    };
  }

  async deleteReading(readingId: string): Promise<void> {
    await this.readingsRepository.delete(readingId);
  }

  async findReadingsWithAccess(
    userId: string,
    userRole: UserRole,
  ): Promise<MeterReading[]> {
    if (userRole === UserRole.URZEDNIK) {
      return this.readingsRepository.find({
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
      const meters = await this.metersRepository.find({
        where: { building_id: In(buildingIds) },
      });

      const meterIds = meters.map((m) => m.id);

      if (meterIds.length === 0) {
        return [];
      }

      return this.readingsRepository.find({
        where: { meter_id: In(meterIds) },
        order: { timestamp: 'ASC' },
      });
    }

    return [];
  }
}
