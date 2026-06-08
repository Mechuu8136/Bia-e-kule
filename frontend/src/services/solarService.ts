import apiClient from './api';

export interface SolarPanel {
  id: string;
  building_id: string;
  capacity_kwp: number;
  installation_date: string;
}

export interface SolarProduction {
  id: string;
  panel_id: string;
  timestamp: string;
  energy_produced_kwh: number;
}

export interface AggregatedProduction {
  date: string;
  totalProduction: number;
  avgProduction: number;
  maxProduction: number;
  minProduction: number;
  readingsCount: number;
}

export interface ProductionStatistics {
  totalReadings: number;
  totalProduction: number;
  avgProduction: number;
  maxProduction: number;
  minProduction: number;
  latestReading: SolarProduction | null;
}

export const solarService = {
  getAllPanels: () => apiClient.get<SolarPanel[]>('/solar-panels'),

  getPanelsByBuilding: (buildingId: string) =>
    apiClient.get<SolarPanel[]>(`/solar-panels/building/${buildingId}`),

  getProduction: (panelId: string) =>
    apiClient.get<SolarProduction[]>(`/solar-production/${panelId}`),

  getProductionByDate: (panelId: string, startDate: string, endDate: string) =>
    apiClient.get<SolarProduction[]>(`/solar-production/${panelId}/range`, {
      params: { startDate, endDate },
    }),

  aggregateProductionByDay: (panelId: string, startDate: string, endDate: string) =>
    apiClient.get<AggregatedProduction[]>(`/solar-production/${panelId}/aggregate/day`, {
      params: { startDate, endDate },
    }),

  aggregateProductionByMonth: (panelId: string, startDate: string, endDate: string) =>
    apiClient.get<AggregatedProduction[]>(`/solar-production/${panelId}/aggregate/month`, {
      params: { startDate, endDate },
    }),

  getProductionStatistics: (panelId: string) =>
    apiClient.get<ProductionStatistics>(`/solar-production/${panelId}/statistics`),
};
