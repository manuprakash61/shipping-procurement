import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { sendRFQEmail } from '../../services/email/sendgrid.service';
import { renderRFQTemplate } from '../../services/email/templates/rfq.template';
import { parsePagination, paginationMeta } from '../../utils/pagination';

export async function createRFQ(data: {
  companyId: string;
  userId: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  deadline?: string;
  searchSessionId?: string;
}) {
  return prisma.rFQ.create({
    data: {
      companyId: data.companyId,
      createdById: data.userId,
      searchSessionId: data.searchSessionId,
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      bodyText: data.bodyText,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    },
  });
}

export async function getRFQs(companyId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const [rfqs, total] = await Promise.all([
    prisma.rFQ.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: { select: { rfqVendors: true, quotes: true } },
      },
    }),
    prisma.rFQ.count({ where: { companyId } }),
  ]);
  return { rfqs, meta: paginationMeta(total, page, limit) };
}

export async function getRFQ(rfqId: string, companyId: string) {
  const rfq = await prisma.rFQ.findFirst({
    where: { id: rfqId, companyId },
    include: {
      rfqVendors: {
        include: { vendor: { include: { emails: true } } },
        orderBy: { sentAt: 'desc' },
      },
      quotes: { orderBy: { receivedAt: 'desc' } },
    },
  });
  if (!rfq) throw new AppError(404, 'RFQ not found');
  return rfq;
}

export async function updateRFQ(
  rfqId: string,
  companyId: string,
  data: { subject?: string; bodyHtml?: string; bodyText?: string; deadline?: string | null },
) {
  const rfq = await prisma.rFQ.findFirst({ where: { id: rfqId, companyId } });
  if (!rfq) throw new AppError(404, 'RFQ not found');
  if (rfq.status !== 'DRAFT') throw new AppError(400, 'Can only edit draft RFQs');

  return prisma.rFQ.update({
    where: { id: rfqId },
    data: {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : data.deadline === null ? null : undefined,
    },
  });
}

export async function sendRFQ(
  rfqId: string,
  companyId: string,
  vendorIds: string[] | 'all',
) {
  const rfq = await prisma.rFQ.findFirst({
    where: { id: rfqId, companyId },
    include: { createdBy: { include: { company: { include: { settings: true } } } } },
  });
  if (!rfq) throw new AppError(404, 'RFQ not found');

  const company = rfq.createdBy.company;

  // Resolve vendor list
  let vendors;
  if (vendorIds === 'all' && rfq.searchSessionId) {
    vendors = await prisma.vendor.findMany({
      where: { searchSessionId: rfq.searchSessionId },
      include: { emails: { where: { isPrimary: true } } },
    });
  } else if (Array.isArray(vendorIds)) {
    vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds }, searchSession: { companyId } },
      include: { emails: { where: { isPrimary: true } } },
    });
  } else {
    throw new AppError(400, 'Invalid vendorIds — provide array or "all" with a search session');
  }

  if (!vendors.length) throw new AppError(400, 'No eligible vendors found');

  const results = await Promise.all(
    vendors.map(async (vendor) => {
      const primaryEmail = vendor.emails[0];
      if (!primaryEmail) return null;

      // Skip already sent
      const existing = await prisma.rFQVendor.findUnique({
        where: { rfqId_vendorId: { rfqId, vendorId: vendor.id } },
      });
      if (existing?.status !== 'PENDING') return null;

      const htmlBody = renderRFQTemplate({
        vendorName: vendor.name,
        companyName: company.name,
        companyLogoUrl: company.logoUrl ?? undefined,
        bodyHtml: rfq.bodyHtml,
        rfqId,
        deadline: rfq.deadline?.toISOString().split('T')[0],
      });

      const msgId = await sendRFQEmail({
        to: primaryEmail.address,
        vendorName: vendor.name,
        rfqId,
        vendorId: vendor.id,
        subject: rfq.subject,
        htmlBody,
      });

      const rfqVendor = await prisma.rFQVendor.upsert({
        where: { rfqId_vendorId: { rfqId, vendorId: vendor.id } },
        update: {
          status: 'SENT',
          sentAt: new Date(),
          emailSentTo: primaryEmail.address,
          sendgridMsgId: msgId,
        },
        create: {
          rfqId,
          vendorId: vendor.id,
          emailSentTo: primaryEmail.address,
          sendgridMsgId: msgId,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      return rfqVendor;
    }),
  );

  const sentCount = results.filter(Boolean).length;

  await prisma.rFQ.update({
    where: { id: rfqId },
    data: { status: 'SENT', sentAt: new Date() },
  });

  return { sent: sentCount, total: vendors.length };
}

export async function deleteRFQ(rfqId: string, companyId: string) {
  const rfq = await prisma.rFQ.findFirst({ where: { id: rfqId, companyId } });
  if (!rfq) throw new AppError(404, 'RFQ not found');
  if (rfq.status !== 'DRAFT') throw new AppError(400, 'Can only delete draft RFQs');
  await prisma.rFQ.delete({ where: { id: rfqId } });
}

export async function previewRFQ(rfqId: string, companyId: string) {
  const rfq = await prisma.rFQ.findFirst({
    where: { id: rfqId, companyId },
    include: { createdBy: { include: { company: true } } },
  });
  if (!rfq) throw new AppError(404, 'RFQ not found');

  return renderRFQTemplate({
    vendorName: '[Vendor Name]',
    companyName: rfq.createdBy.company.name,
    companyLogoUrl: rfq.createdBy.company.logoUrl ?? undefined,
    bodyHtml: rfq.bodyHtml,
    rfqId,
    deadline: rfq.deadline?.toISOString().split('T')[0],
  });
}
