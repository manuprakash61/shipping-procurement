import client from './client';
import { SupplierProduct } from './portfolio.api';

export interface MarketplaceProduct extends SupplierProduct {
  company: {
    id: string;
    name: string;
    country?: string;
    domain: string;
  };
}

export const marketplaceApi = {
  search: (params: { q: string; category?: string; country?: string; page?: number; limit?: number }) =>
    client.get<{ products: MarketplaceProduct[]; meta: unknown }>('/marketplace/search', { params }).then((r) => r.data),
};
