import apiClient from './api';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  is_published: boolean;
  published_at: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  is_published?: boolean;
}

export const announcementService = {
  getAll: () => apiClient.get<Announcement[]>('/announcements'),

  create: (payload: CreateAnnouncementPayload) =>
    apiClient.post<Announcement>('/announcements', payload),

  delete: (id: string) => apiClient.delete(`/announcements/${id}`),
};
