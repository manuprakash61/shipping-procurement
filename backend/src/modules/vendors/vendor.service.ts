import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { verifyEmail } from '../../services/verification/email.verifier';

export async function getVendor(vendorId: string, companyId: string) {
  const vendor = await prisma.vendor.findFirst({
    where: {
      id: vendorId,
      searchSession: { companyId },
    },
    include: { emails: true },
  });
  if (!vendor) throw new AppError(404, 'Vendor not found');
  return vendor;
}

export async function updateVendor(vendorId: string, companyId: string, data: { name?: string; website?: string; phone?: string; description?: string }) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, searchSession: { companyId } },
  });
  if (!vendor) throw new AppError(404, 'Vendor not found');

  return prisma.vendor.update({
    where: { id: vendorId },
    data,
    include: { emails: true },
  });
}

export async function triggerEmailVerification(vendorId: string, companyId: string) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, searchSession: { companyId } },
    include: { emails: true },
  });
  if (!vendor) throw new AppError(404, 'Vendor not found');

  const results = await Promise.all(
    vendor.emails.map((e) => verifyEmail(e.address, vendor.website ?? undefined)),
  );

  for (const result of results) {
    await prisma.vendorEmail.updateMany({
      where: { vendorId, address: result.address },
      data: {
        formatValid: result.formatValid,
        mxValid: result.mxValid,
        domainMatch: result.domainMatch,
        hunterScore: result.hunterScore,
        disposable: result.disposable,
        verificationStatus: result.status,
        verifiedAt: new Date(),
      },
    });
  }

  return prisma.vendor.findUnique({ where: { id: vendorId }, include: { emails: true } });
}

export async function addEmail(vendorId: string, companyId: string, address: string) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, searchSession: { companyId } },
  });
  if (!vendor) throw new AppError(404, 'Vendor not found');

  const existing = await prisma.vendorEmail.findUnique({
    where: { vendorId_address: { vendorId, address: address.toLowerCase() } },
  });
  if (existing) throw new AppError(409, 'Email already exists for this vendor');

  return prisma.vendorEmail.create({
    data: {
      vendorId,
      address: address.toLowerCase(),
      source: 'MANUAL',
      isPrimary: false,
    },
  });
}

export async function getVendorEmails(vendorId: string, companyId: string) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, searchSession: { companyId } },
    include: { emails: { orderBy: { isPrimary: 'desc' } } },
  });
  if (!vendor) throw new AppError(404, 'Vendor not found');
  return vendor.emails;
}
