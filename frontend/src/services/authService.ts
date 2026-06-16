import apiClient from './api';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export const authService = {
  login: (email: string, password: string) =>
    apiClient.post<{ access_token: string; role: string }>('/auth/login', {
      email,
      password,
    }),

  getMe: () => apiClient.get<AuthUser>('/auth/me'),
};
