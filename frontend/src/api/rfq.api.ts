import client from './client';
import { RFQ } from '@/types';

export const rfqApi = {
  create: (data: { subject: string; bodyHtml: string; bodyText: string; deadline?: string; searchSessionId?: string }) =>
    client.post<RFQ>('/rfq', data).then((r) => r.data),

  list: (params?: { page?: number; limit?: number }) =>
    client.get('/rfq', { params }).then((r) => r.data),

  get: (id: string) => client.get<RFQ>(`/rfq/${id}`).then((r) => r.data),

  update: (id: string, data: Partial<{ subject: string; bodyHtml: string; bodyText: string; deadline: string | null }>) =>
    client.patch<RFQ>(`/rfq/${id}`, data).then((r) => r.data),

  send: (id: string, vendorIds: string[] | 'all') =>
    client.post(`/rfq/${id}/send`, { vendorIds }).then((r) => r.data),

  preview: (id: string) =>
    client.get<string>(`/rfq/${id}/preview`, { responseType: 'text' }).then((r) => r.data),

  delete: (id: string) => client.delete(`/rfq/${id}`),
};
