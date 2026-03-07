import client from './client';

export interface SupplierProduct {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category: string;
  price?: string;
  currency: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  certifications: string[];
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  category: string;
  price?: number;
  currency: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  certifications: string[];
  tags: string[];
}

export const portfolioApi = {
  list: (params?: { page?: number; limit?: number }) =>
    client.get<{ products: SupplierProduct[]; meta: unknown }>('/portfolio', { params }).then((r) => r.data),

  create: (data: ProductFormData) =>
    client.post<SupplierProduct>('/portfolio', data).then((r) => r.data),

  update: (id: string, data: Partial<ProductFormData>) =>
    client.patch<SupplierProduct>(`/portfolio/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/portfolio/${id}`),

  togglePublish: (id: string) =>
    client.patch<SupplierProduct>(`/portfolio/${id}/publish`).then((r) => r.data),

  getCompanyProducts: (companyId: string) =>
    client.get(`/portfolio/company/${companyId}`).then((r) => r.data),
};
