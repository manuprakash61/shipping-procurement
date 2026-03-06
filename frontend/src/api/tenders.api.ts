import client from './client';
import { Tender } from '@/types';

export const tendersApi = {
  create: (data: { quoteId: string; termsAndCond?: string; deliveryDate?: string }) =>
    client.post<Tender>('/tenders', data).then((r) => r.data),

  list: (params?: { page?: number; limit?: number }) =>
    client.get('/tenders', { params }).then((r) => r.data),

  get: (id: string) => client.get<Tender>(`/tenders/${id}`).then((r) => r.data),

  issue: (id: string) => client.post<Tender>(`/tenders/${id}/issue`).then((r) => r.data),

  update: (id: string, data: { termsAndCond?: string; deliveryDate?: string }) =>
    client.patch<Tender>(`/tenders/${id}`, data).then((r) => r.data),

  preview: (id: string) =>
    client.get<string>(`/tenders/${id}/preview`, { responseType: 'text' }).then((r) => r.data),
};
