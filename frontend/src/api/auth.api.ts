import client from './client';
import { AuthResponse } from '@/types';

export const authApi = {
  register: (data: { companyName: string; companyDomain: string; name: string; email: string; password: string }) =>
    client.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (email: string, password: string) =>
    client.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  me: () => client.get('/auth/me').then((r) => r.data),

  logout: () => client.post('/auth/logout').then((r) => r.data),
};
