import apiClient from './api';

export interface EsgReport {
  id: string;
  generated_by_id?: string;
  building_id?: string;
  co2_reduction_kg: number;
  document_url?: string;
  is_public: boolean;
  created_at: string;
}

export interface EsgStatistics {
  totalReports: number;
  totalCo2Reduction: number;
  latestReport: EsgReport | null;
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
    documentUrl?: string,
    isPublic?: boolean,
  ) =>
    apiClient.post<EsgReport>('/esg-reports', {
      building_id: buildingId,
      co2_reduction_kg: co2ReductionKg,
      document_url: documentUrl,
      is_public: isPublic,
    }),

  updateReport: (
    reportId: string,
    payload: { is_public?: boolean; co2_reduction_kg?: number; document_url?: string },
  ) => apiClient.patch<EsgReport>(`/esg-reports/${reportId}`, payload),

  deleteReport: (reportId: string) =>
    apiClient.delete(`/esg-reports/${reportId}`),

  getStatisticsByBuilding: (buildingId: string) =>
    apiClient.get<EsgStatistics>(`/esg-reports/building/${buildingId}/statistics`),

  getGlobalStatistics: () =>
    apiClient.get<EsgStatistics>('/esg-reports/global/statistics'),

  generateReport: (
    buildingId: string | null,
    startDate: string,
    endDate: string,
    isPublic?: boolean,
  ) =>
    apiClient.post<EsgReport>('/esg-reports/generate', {
      building_id: buildingId,
      start_date: startDate,
      end_date: endDate,
      is_public: isPublic,
    }),
};
