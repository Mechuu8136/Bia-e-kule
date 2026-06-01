import apiClient from './api';

export enum MeterType {
  PRAD = 'prad',
  WODA = 'woda',
  CIEPLO = 'cieplo',
}

export interface Meter {
  id: string;
  building_id: string;
  type: MeterType;
  serial_number: string;
  unit: string;
}

export interface MeterReading {
  id: string;
  meter_id: string;
  timestamp: string;
  value: number;
}

export interface AggregatedData {
  date: string;
  sum: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

export const meterService = {
  getAllMeters: () => apiClient.get<Meter[]>('/meters'),

  getMetersByBuilding: (buildingId: string) =>
    apiClient.get<Meter[]>(`/meters/building/${buildingId}`),

  getMeterReadings: (meterId: string) =>
    apiClient.get<MeterReading[]>(`/meter-readings/${meterId}`),

  getMeterReadingsByDate: (meterId: string, startDate: string, endDate: string) =>
    apiClient.get<MeterReading[]>(`/meter-readings/${meterId}/range`, {
      params: { startDate, endDate },
    }),

  aggregateReadingsByDay: (meterId: string, startDate: string, endDate: string) =>
    apiClient.get<AggregatedData[]>(`/meter-readings/${meterId}/aggregate/day`, {
      params: { startDate, endDate },
    }),

  aggregateReadingsByMonth: (meterId: string, startDate: string, endDate: string) =>
    apiClient.get<AggregatedData[]>(`/meter-readings/${meterId}/aggregate/month`, {
      params: { startDate, endDate },
    }),

  getMeterStatistics: (meterId: string) =>
    apiClient.get(`/meter-readings/${meterId}/statistics`),
};
