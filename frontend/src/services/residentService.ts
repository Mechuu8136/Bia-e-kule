import apiClient from './api';
import { Building } from './buildingService';

export interface MonthlyTotal {
  month: string;
  total: number;
}

export interface MediaTypeSummary {
  type: string;
  label: string;
  unit: string;
  currentMonthTotal: number;
  sameMonthLastYearTotal: number;
  yearOverYearChangePercent: number | null;
  monthlyTrend: MonthlyTotal[];
}

export interface EsgReportSummary {
  id: string;
  co2_reduction_kg: number;
  document_url?: string;
  created_at: string;
  building_id?: string;
}

export interface BuildingSummary {
  building: Building;
  media: MediaTypeSummary[];
  solar: {
    monthlyProduction: MonthlyTotal[];
    last12MonthsTotal: number;
  };
  esgReports: EsgReportSummary[];
}

export const residentService = {
  getFavorites: () => apiClient.get<Building[]>('/resident/favorites'),

  getCatalog: () => apiClient.get<Building[]>('/resident/buildings/catalog'),

  addFavorite: (buildingId: string) =>
    apiClient.post(`/resident/favorites/${buildingId}`),

  removeFavorite: (buildingId: string) =>
    apiClient.delete(`/resident/favorites/${buildingId}`),

  getBuildingSummary: (buildingId: string) =>
    apiClient.get<BuildingSummary>(`/resident/buildings/${buildingId}/summary`),
};
