import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { parsePagination, paginationMeta } from '../../utils/pagination';

export async function createProduct(companyId: string, data: {
  name: string;
  description?: string;
  category: string;
  price?: number;
  currency: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  certifications: string[];
  tags: string[];
}) {
  return prisma.supplierProduct.create({
    data: { ...data, companyId },
  });
}

export async function listMyProducts(companyId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const [products, total] = await Promise.all([
    prisma.supplierProduct.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.supplierProduct.count({ where: { companyId } }),
  ]);
  return { products, meta: paginationMeta(total, page, limit) };
}

export async function updateProduct(id: string, companyId: string, data: Partial<{
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  minOrderQty: number;
  leadTimeDays: number;
  certifications: string[];
  tags: string[];
}>) {
  const product = await prisma.supplierProduct.findFirst({ where: { id, companyId } });
  if (!product) throw new AppError(404, 'Product not found');
  return prisma.supplierProduct.update({ where: { id }, data });
}

export async function deleteProduct(id: string, companyId: string) {
  const product = await prisma.supplierProduct.findFirst({ where: { id, companyId } });
  if (!product) throw new AppError(404, 'Product not found');
  await prisma.supplierProduct.delete({ where: { id } });
}

export async function togglePublish(id: string, companyId: string) {
  const product = await prisma.supplierProduct.findFirst({ where: { id, companyId } });
  if (!product) throw new AppError(404, 'Product not found');
  return prisma.supplierProduct.update({
    where: { id },
    data: { isPublished: !product.isPublished },
  });
}

export async function getCompanyProducts(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, country: true, companyType: true },
  });
  if (!company || company.companyType !== 'SUPPLIER') throw new AppError(404, 'Supplier not found');

  const products = await prisma.supplierProduct.findMany({
    where: { companyId, isPublished: true },
    orderBy: { createdAt: 'desc' },
  });
  return { company, products };
}
