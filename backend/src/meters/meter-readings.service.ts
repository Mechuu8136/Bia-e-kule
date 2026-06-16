import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { MeterReading } from './meter-reading.entity';
import { Meter } from './meter.entity';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';
import { UserBuildingLinkType } from '../users/user-building-link-type.enum';
import { aggregateByTimeBucket } from '../database/aggregate-time-series';
import { BuildingAccessService } from '../access/building-access.service';

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
    private readonly buildingAccess: BuildingAccessService,
  ) {}

  private async ensureMeterAccess(
    meterId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    await this.buildingAccess.assertMeterAccess(meterId, userId, userRole);
  }

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

  async findReadingsByMeter(
    meterId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<MeterReading[]> {
    await this.ensureMeterAccess(meterId, userId, userRole);
    return this.readingsRepository.find({
      where: { meter_id: meterId },
      order: { timestamp: 'ASC' },
    });
  }

  async findReadingsByDateRange(
    meterId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    userRole: UserRole,
  ): Promise<MeterReading[]> {
    await this.ensureMeterAccess(meterId, userId, userRole);
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
    userId: string,
    userRole: UserRole,
  ): Promise<AggregatedData[]> {
    await this.ensureMeterAccess(meterId, userId, userRole);
    return aggregateByTimeBucket(this.readingsRepository, {
      alias: 'reading',
      foreignKeyColumn: 'meter_id',
      foreignKeyValue: meterId,
      valueColumn: 'value',
      startDate,
      endDate,
      unit: 'day',
    });
  }

  async aggregateByHour(
    meterId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    userRole: UserRole,
  ): Promise<AggregatedData[]> {
    await this.ensureMeterAccess(meterId, userId, userRole);
    return aggregateByTimeBucket(this.readingsRepository, {
      alias: 'reading',
      foreignKeyColumn: 'meter_id',
      foreignKeyValue: meterId,
      valueColumn: 'value',
      startDate,
      endDate,
      unit: 'hour',
    });
  }

  async aggregateByMonth(
    meterId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    userRole: UserRole,
  ): Promise<AggregatedData[]> {
    await this.ensureMeterAccess(meterId, userId, userRole);
    return aggregateByTimeBucket(this.readingsRepository, {
      alias: 'reading',
      foreignKeyColumn: 'meter_id',
      foreignKeyValue: meterId,
      valueColumn: 'value',
      startDate,
      endDate,
      unit: 'month',
    });
  }

  async getStatistics(
    meterId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{
    totalReadings: number;
    minValue: number;
    maxValue: number;
    avgValue: number;
    latestReading: MeterReading | null;
  }> {
    await this.ensureMeterAccess(meterId, userId, userRole);
    const stats = await this.readingsRepository
      .createQueryBuilder('reading')
      .select('COUNT(*)', 'totalReadings')
      .addSelect('MIN(reading.value)', 'minValue')
      .addSelect('MAX(reading.value)', 'maxValue')
      .addSelect('AVG(reading.value)', 'avgValue')
      .where('reading.meter_id = :meterId', { meterId })
      .getRawOne<{
        totalReadings: string;
        minValue: string | null;
        maxValue: string | null;
        avgValue: string | null;
      }>();

    const totalReadings = Number(stats?.totalReadings ?? 0);

    if (totalReadings === 0) {
      return {
        totalReadings: 0,
        minValue: 0,
        maxValue: 0,
        avgValue: 0,
        latestReading: null,
      };
    }

    const latestReading = await this.readingsRepository.findOne({
      where: { meter_id: meterId },
      order: { timestamp: 'DESC' },
    });

    return {
      totalReadings,
      minValue: Number(stats?.minValue ?? 0),
      maxValue: Number(stats?.maxValue ?? 0),
      avgValue: Number(stats?.avgValue ?? 0),
      latestReading,
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
