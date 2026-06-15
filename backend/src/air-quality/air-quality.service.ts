import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AirQualityReading } from './air-quality-reading.entity';

export type AirQualityLevel = 'dobra' | 'umiarkowana' | 'niezdrowa';

export interface AirQualitySnapshot {
  station_name: string;
  pm25: number;
  pm10: number;
  timestamp: string;
  level: AirQualityLevel;
  level_label: string;
}

export interface AirQualityTrendPoint {
  date: string;
  pm25: number;
  pm10: number;
  level: AirQualityLevel;
}

@Injectable()
export class AirQualityService {
  constructor(
    @InjectRepository(AirQualityReading)
    private readonly repository: Repository<AirQualityReading>,
  ) {}

  getLevel(pm25: number): { level: AirQualityLevel; label: string } {
    if (pm25 <= 13) {
      return { level: 'dobra', label: 'Dobra jakość powietrza' };
    }
    if (pm25 <= 35) {
      return { level: 'umiarkowana', label: 'Umiarkowana jakość powietrza' };
    }
    return { level: 'niezdrowa', label: 'Podwyższony poziom zanieczyszczeń' };
  }

  async getLatest(): Promise<AirQualitySnapshot | null> {
    const reading = await this.repository.findOne({
      order: { timestamp: 'DESC' },
    });

    if (!reading) return null;

    const { level, label } = this.getLevel(Number(reading.pm25));

    return {
      station_name: reading.station_name,
      pm25: Number(reading.pm25),
      pm10: Number(reading.pm10),
      timestamp: reading.timestamp.toISOString(),
      level,
      level_label: label,
    };
  }

  async getWeeklyTrend(): Promise<AirQualityTrendPoint[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const readings = await this.repository.find({
      where: { timestamp: Between(startDate, endDate) },
      order: { timestamp: 'ASC' },
    });

    const grouped = new Map<string, { pm25: number[]; pm10: number[] }>();

    readings.forEach((reading) => {
      const date = reading.timestamp.toISOString().split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, { pm25: [], pm10: [] });
      }
      grouped.get(date)!.pm25.push(Number(reading.pm25));
      grouped.get(date)!.pm10.push(Number(reading.pm10));
    });

    return Array.from(grouped.entries()).map(([date, values]) => {
      const avgPm25 =
        values.pm25.reduce((sum, v) => sum + v, 0) / values.pm25.length;
      return {
        date,
        pm25: Math.round(avgPm25 * 10) / 10,
        pm10:
          Math.round(
            (values.pm10.reduce((sum, v) => sum + v, 0) / values.pm10.length) * 10,
          ) / 10,
        level: this.getLevel(avgPm25).level,
      };
    });
  }
}
