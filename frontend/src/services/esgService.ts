import apiClient from './api';

export interface EsgReport {
  id: string;
  generated_by_id?: string;
  building_id?: string;
  co2_reduction_kg: number;
  document_url?: string;
  created_at: string;
}

export const esgService = {
  getAllReports: () => apiClient.get<EsgReport[]>('/esg-reports'),

  getReportsByBuilding: (buildingId: string) =>
    apiClient.get<EsgReport[]>(`/esg-reports/building/${buildingId}`),

  getGlobalReports: () => apiClient.get<EsgReport[]>('/esg-reports/global'),

  getReportById: (reportId: string) =>
    apiClient.get<EsgReport>(`/esg-reports/${reportId}`),

  createReport: (
    buildingId: string | null,
    co2ReductionKg: number,
    documentUrl?: string
  ) =>
    apiClient.post<EsgReport>('/esg-reports', {
      building_id: buildingId,
      co2_reduction_kg: co2ReductionKg,
      document_url: documentUrl,
    }),

  updateReport: (
    reportId: string,
    co2ReductionKg?: number,
    documentUrl?: string
  ) =>
    apiClient.put<EsgReport>(`/esg-reports/${reportId}`, {
      co2_reduction_kg: co2ReductionKg,
      document_url: documentUrl,
    }),

  deleteReport: (reportId: string) =>
    apiClient.delete(`/esg-reports/${reportId}`),

  getStatisticsByBuilding: (buildingId: string) =>
    apiClient.get(`/esg-reports/statistics/building/${buildingId}`),

  getGlobalStatistics: () =>
    apiClient.get(`/esg-reports/statistics/global`),
};
