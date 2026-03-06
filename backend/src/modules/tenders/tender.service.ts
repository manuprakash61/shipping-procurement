import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { sendTenderEmail } from '../../services/email/sendgrid.service';
import { renderTenderTemplate } from '../../services/email/templates/tender.template';
import { generateTenderDocument } from '../../services/ai/claude.service';
import { parsePagination, paginationMeta } from '../../utils/pagination';

function generateTenderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `TND-${year}${month}-${random}`;
}

export async function createTender(data: {
  companyId: string;
  quoteId: string;
  termsAndCond?: string;
  deliveryDate?: string;
}) {
  const quote = await prisma.quote.findFirst({
    where: { id: data.quoteId, rfq: { companyId: data.companyId } },
    include: {
      rfq: { include: { createdBy: { include: { company: true } } } },
      rfqVendor: { include: { vendor: true } },
    },
  });
  if (!quote) throw new AppError(404, 'Quote not found');
  if (quote.status === 'REJECTED') throw new AppError(400, 'Cannot issue tender for rejected quote');

  const existing = await prisma.tender.findUnique({ where: { quoteId: data.quoteId } });
  if (existing) throw new AppError(409, 'Tender already exists for this quote');

  const company = quote.rfq.createdBy.company;
  const tenderNumber = generateTenderNumber();

  const bodyHtml = await generateTenderDocument({
    companyName: company.name,
    vendorName: quote.vendorName,
    productDescription: quote.rfq.subject,
    price: quote.price?.toString() ?? 'TBD',
    currency: quote.currency ?? 'USD',
    deliveryDate: data.deliveryDate ?? 'To be agreed',
    terms: data.termsAndCond ?? 'Standard terms apply',
    tenderNumber,
  });

  const documentHtml = renderTenderTemplate({
    tenderNumber,
    issuedAt: new Date().toISOString().split('T')[0],
    companyName: company.name,
    companyLogoUrl: company.logoUrl ?? undefined,
    vendorName: quote.vendorName,
    vendorEmail: quote.vendorEmail,
    productDescription: quote.rfq.subject,
    agreedPrice: quote.price?.toString() ?? 'TBD',
    currency: quote.currency ?? 'USD',
    deliveryDate: data.deliveryDate,
    termsAndCond: data.termsAndCond,
    bodyHtml,
  });

  const tender = await prisma.tender.create({
    data: {
      companyId: data.companyId,
      quoteId: data.quoteId,
      vendorName: quote.vendorName,
      vendorEmail: quote.vendorEmail,
      documentHtml,
      subject: `Tender Award — ${company.name} — ${tenderNumber}`,
      termsAndCond: data.termsAndCond,
      agreedPrice: quote.price,
      currency: quote.currency,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
    },
  });

  // Update quote status
  await prisma.quote.update({
    where: { id: data.quoteId },
    data: { status: 'ACCEPTED' },
  });

  return tender;
}

export async function getTenders(companyId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const [tenders, total] = await Promise.all([
    prisma.tender.findMany({
      where: { companyId },
      orderBy: { issuedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.tender.count({ where: { companyId } }),
  ]);
  return { tenders, meta: paginationMeta(total, page, limit) };
}

export async function getTender(tenderId: string, companyId: string) {
  const tender = await prisma.tender.findFirst({
    where: { id: tenderId, companyId },
    include: { quote: { include: { rfqVendor: { include: { vendor: true } }, rfq: true } } },
  });
  if (!tender) throw new AppError(404, 'Tender not found');
  return tender;
}

export async function issueTender(tenderId: string, companyId: string) {
  const tender = await prisma.tender.findFirst({ where: { id: tenderId, companyId } });
  if (!tender) throw new AppError(404, 'Tender not found');
  if (tender.status !== 'DRAFT') throw new AppError(400, 'Tender already issued');

  const msgId = await sendTenderEmail({
    to: tender.vendorEmail,
    subject: tender.subject,
    htmlBody: tender.documentHtml,
    tenderId: tender.id,
  });

  return prisma.tender.update({
    where: { id: tenderId },
    data: {
      status: 'ISSUED',
      issuedAt: new Date(),
      sendgridMsgId: msgId,
    },
  });
}

export async function updateTender(
  tenderId: string,
  companyId: string,
  data: { termsAndCond?: string; deliveryDate?: string },
) {
  const tender = await prisma.tender.findFirst({ where: { id: tenderId, companyId } });
  if (!tender) throw new AppError(404, 'Tender not found');
  if (tender.status !== 'DRAFT') throw new AppError(400, 'Can only edit draft tenders');

  return prisma.tender.update({
    where: { id: tenderId },
    data: {
      termsAndCond: data.termsAndCond,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
    },
  });
}
