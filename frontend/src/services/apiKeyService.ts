import apiClient from './api';

export type ApiKeyScope = 'organization' | 'building';

export interface ApiKeyListItem {
  id: string;
  name: string;
  key_prefix: string;
  scope: ApiKeyScope;
  building_id?: string;
  is_active: boolean;
  rate_limit_per_minute: number;
  last_used_at?: string;
  created_at: string;
}

export interface CreateApiKeyPayload {
  name: string;
  scope: ApiKeyScope;
  building_id?: string;
  rate_limit_per_minute?: number;
}

export interface CreateApiKeyResult extends ApiKeyListItem {
  raw_key: string;
}

export const apiKeyService = {
  getAll: () => apiClient.get<ApiKeyListItem[]>('/api-keys'),

  create: (payload: CreateApiKeyPayload) =>
    apiClient.post<CreateApiKeyResult>('/api-keys', payload),

  delete: (id: string) => apiClient.delete(`/api-keys/${id}`),
};
