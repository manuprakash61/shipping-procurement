import { prisma } from '../../config/database';
import { parsePagination, paginationMeta } from '../../utils/pagination';

export async function searchMarketplace(
  q: string,
  options: { category?: string; country?: string; page?: number; limit?: number },
) {
  const { page, limit, skip } = parsePagination(options);

  const where = {
    isPublished: true,
    OR: [
      { name: { contains: q, mode: 'insensitive' as const } },
      { description: { contains: q, mode: 'insensitive' as const } },
      { category: { contains: q, mode: 'insensitive' as const } },
      { tags: { has: q } },
    ],
    ...(options.category ? { category: { contains: options.category, mode: 'insensitive' as const } } : {}),
    ...(options.country
      ? { company: { country: { contains: options.country, mode: 'insensitive' as const } } }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.supplierProduct.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true, country: true, domain: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.supplierProduct.count({ where }),
  ]);

  return { products, meta: paginationMeta(total, page, limit) };
}
