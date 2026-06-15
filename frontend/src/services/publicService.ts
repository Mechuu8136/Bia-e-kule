import apiClient from './api';

export interface PublicAnnouncement {
  id: string;
  title: string;
  body: string;
  published_at: string;
}

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

export interface PublicEsgReport {
  id: string;
  co2_reduction_kg: number;
  document_url?: string;
  created_at: string;
}

export interface PublicEsgStatistics {
  totalCo2Reduction: number;
  totalReports: number;
}

export const publicService = {
  getAnnouncements: () =>
    apiClient.get<PublicAnnouncement[]>('/public/announcements'),

  getAirQuality: () =>
    apiClient.get<{ current: AirQualitySnapshot | null; trend: AirQualityTrendPoint[] }>(
      '/public/air-quality',
    ),

  getGlobalEsgReports: () =>
    apiClient.get<PublicEsgReport[]>('/public/esg-reports'),

  getGlobalEsgStatistics: () =>
    apiClient.get<PublicEsgStatistics>('/public/esg-statistics'),
};
