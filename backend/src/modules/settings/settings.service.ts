import { prisma } from '../../config/database';
import { encrypt, decrypt } from '../../utils/crypto';
import { sendTestEmail } from '../../services/email/sendgrid.service';
import { AppError } from '../../middleware/errorHandler';

export async function getSettings(companyId: string) {
  const settings = await prisma.companySettings.findUnique({ where: { companyId } });
  if (!settings) throw new AppError(404, 'Settings not found');

  return {
    ...settings,
    // Mask encrypted keys
    sendgridApiKey: settings.sendgridApiKey ? '****' + settings.sendgridApiKey.slice(-4) : null,
    hunterApiKey: settings.hunterApiKey ? '****' + settings.hunterApiKey.slice(-4) : null,
  };
}

export async function updateSettings(
  companyId: string,
  data: {
    rfqTemplate?: string;
    senderName?: string;
    senderEmail?: string;
    sendgridApiKey?: string;
    hunterApiKey?: string;
  },
) {
  const updateData: Record<string, string | null | undefined> = {
    rfqTemplate: data.rfqTemplate,
    senderName: data.senderName,
    senderEmail: data.senderEmail,
  };

  if (data.sendgridApiKey) updateData.sendgridApiKey = encrypt(data.sendgridApiKey);
  if (data.hunterApiKey) updateData.hunterApiKey = encrypt(data.hunterApiKey);

  return prisma.companySettings.update({
    where: { companyId },
    data: updateData,
  });
}

export async function testEmail(companyId: string, toEmail: string) {
  const settings = await prisma.companySettings.findUnique({ where: { companyId } });
  const apiKey = settings?.sendgridApiKey ? decrypt(settings.sendgridApiKey) : null;

  if (apiKey) {
    // Use company-specific key if configured
    process.env.SENDGRID_API_KEY = apiKey;
  }

  await sendTestEmail(toEmail);
}
