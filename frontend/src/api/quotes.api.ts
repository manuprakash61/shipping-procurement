import client from './client';
import { Quote } from '@/types';

export const quotesApi = {
  list: (params?: { rfqId?: string; page?: number; limit?: number }) =>
    client.get('/quotes', { params }).then((r) => r.data),

  get: (id: string) => client.get<Quote>(`/quotes/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED') =>
    client.patch<Quote>(`/quotes/${id}/status`, { status }).then((r) => r.data),

  reExtract: (id: string) => client.post<Quote>(`/quotes/${id}/extract`).then((r) => r.data),

  compare: (rfqId: string) =>
    client.get<Quote[]>(`/rfq/${rfqId}/quotes/compare`).then((r) => r.data),
};
