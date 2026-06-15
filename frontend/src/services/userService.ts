import apiClient from './api';

export type UserRole = 'urzednik' | 'dyrektor' | 'mieszkaniec' | 'gosc';

export interface UserListItem {
  id: string;
  email: string;
  role: UserRole;
  building_ids: string[];
}

export interface CreateUserPayload {
  email: string;
  password: string;
  role: UserRole;
  building_ids?: string[];
}

export const userService = {
  getAllUsers: () => apiClient.get<UserListItem[]>('/users'),

  createUser: (payload: CreateUserPayload) =>
    apiClient.post<UserListItem>('/users', payload),

  updateUserBuildings: (userId: string, buildingIds: string[]) =>
    apiClient.patch<UserListItem>(`/users/${userId}/buildings`, {
      building_ids: buildingIds,
    }),

  deleteUser: (userId: string) => apiClient.delete(`/users/${userId}`),
};
