import client from './client';
import { SearchSession } from '@/types';

export const searchApi = {
  create: (data: { query: string; region?: string; countryCode?: string }) =>
    client.post<SearchSession>('/search', data).then((r) => r.data),

  get: (sessionId: string) =>
    client.get<SearchSession>(`/search/${sessionId}`).then((r) => r.data),

  history: (params?: { page?: number; limit?: number }) =>
    client.get('/search/history', { params }).then((r) => r.data),

  delete: (sessionId: string) => client.delete(`/search/${sessionId}`),
};
