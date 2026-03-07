import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { extractQuoteData } from '../../services/ai/claude.service';
import { parsePagination, paginationMeta } from '../../utils/pagination';

export async function getQuotes(companyId: string, rfqId: string | undefined, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const where = rfqId
    ? { rfqId, rfq: { companyId } }
    : { rfq: { companyId } };

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.quote.count({ where }),
  ]);

  return { quotes, meta: paginationMeta(total, page, limit) };
}

export async function getQuote(quoteId: string, companyId: string) {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, rfq: { companyId } },
    include: { rfqVendor: { include: { vendor: true } } },
  });
  if (!quote) throw new AppError(404, 'Quote not found');
  return quote;
}

export async function updateQuoteStatus(
  quoteId: string,
  companyId: string,
  status: 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED',
) {
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, rfq: { companyId } } });
  if (!quote) throw new AppError(404, 'Quote not found');
  return prisma.quote.update({ where: { id: quoteId }, data: { status } });
}

export async function reExtractQuote(quoteId: string, companyId: string) {
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, rfq: { companyId } } });
  if (!quote) throw new AppError(404, 'Quote not found');

  const emailText = quote.rawEmailText ?? quote.rawEmailHtml ?? '';
  if (!emailText) throw new AppError(400, 'No email content to extract from');

  const extracted = await extractQuoteData(emailText);

  return prisma.quote.update({
    where: { id: quoteId },
    data: {
      price: extracted.price ? String(extracted.price) : undefined,
      currency: extracted.currency,
      leadTimeDays: extracted.leadTimeDays,
      validUntil: extracted.validUntil ? new Date(extracted.validUntil) : undefined,
      terms: extracted.terms,
      aiSummary: extracted.summary,
      aiExtractedData: extracted as any,
    },
  });
}

export async function getComparisonData(rfqId: string, companyId: string) {
  const rfq = await prisma.rFQ.findFirst({ where: { id: rfqId, companyId } });
  if (!rfq) throw new AppError(404, 'RFQ not found');

  const quotes = await prisma.quote.findMany({
    where: { rfqId },
    include: { rfqVendor: { include: { vendor: true } } },
    orderBy: { price: 'asc' },
  });

  return quotes;
}
