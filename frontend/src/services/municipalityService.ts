import apiClient from './api';

export interface MunicipalitySettings {
  municipality_name: string;
  tagline: string;
  air_quality_station_name: string;
  is_configured: boolean;
}

export interface SetupStatus {
  needs_setup: boolean;
}

export interface InitialSetupPayload {
  municipality_name: string;
  tagline?: string;
  admin_email: string;
  admin_password: string;
}

export interface InitialSetupResult {
  settings: MunicipalitySettings;
  access_token: string;
  role: string;
  api_key: string;
}

export const municipalityService = {
  getPublicSettings: () => apiClient.get<MunicipalitySettings>('/public/settings'),

  getSetupStatus: () => apiClient.get<SetupStatus>('/public/setup-status'),

  initialSetup: (payload: InitialSetupPayload) =>
    apiClient.post<InitialSetupResult>('/public/setup', payload),

  getSettings: () => apiClient.get<MunicipalitySettings>('/settings'),

  updateSettings: (payload: Partial<MunicipalitySettings>) =>
    apiClient.patch<MunicipalitySettings>('/settings', payload),
};
