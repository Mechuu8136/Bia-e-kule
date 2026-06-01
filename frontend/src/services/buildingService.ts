import apiClient from './api';

export interface Building {
  id: string;
  name: string;
  address: string;
  type: string;
}

export const buildingService = {
  getAllBuildings: () => apiClient.get<Building[]>('/buildings'),

  getBuilding: (id: string) => apiClient.get<Building>(`/buildings/${id}`),
};
