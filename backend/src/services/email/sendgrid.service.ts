import nodemailer from 'nodemailer';

const FROM_EMAIL = process.env.GMAIL_USER ?? process.env.SENDGRID_FROM_EMAIL ?? 'noreply@example.com';
const FROM_NAME = process.env.FROM_NAME ?? process.env.SENDGRID_FROM_NAME ?? 'ShipProcure';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

// Kept for compatibility — replies go to FROM_EMAIL since inbound parse is not available with Gmail
export function buildRFQReplyTo(_rfqId: string, _vendorId: string): string {
  return FROM_EMAIL;
}

export interface SendRFQParams {
  to: string;
  vendorName: string;
  rfqId: string;
  vendorId: string;
  subject: string;
  htmlBody: string;
}

export async function sendRFQEmail(params: SendRFQParams): Promise<string | null> {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      to: params.to,
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      replyTo: buildRFQReplyTo(params.rfqId, params.vendorId),
      subject: params.subject,
      html: params.htmlBody,
    });
    return info.messageId ?? null;
  } catch (err) {
    console.error('[Gmail] Failed to send RFQ:', err);
    return null;
  }
}

export interface SendTenderParams {
  to: string;
  subject: string;
  htmlBody: string;
  tenderId: string;
  pdfAttachment?: { content: string; filename: string };
}

export async function sendTenderEmail(params: SendTenderParams): Promise<string | null> {
  try {
    const transporter = createTransporter();
    const mailOptions: nodemailer.SendMailOptions = {
      to: params.to,
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      subject: params.subject,
      html: params.htmlBody,
    };

    if (params.pdfAttachment) {
      mailOptions.attachments = [
        {
          content: Buffer.from(params.pdfAttachment.content, 'base64'),
          filename: params.pdfAttachment.filename,
          contentType: 'application/pdf',
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);
    return info.messageId ?? null;
  } catch (err) {
    console.error('[Gmail] Failed to send Tender:', err);
    return null;
  }
}

export async function sendTestEmail(to: string): Promise<void> {
  const transporter = createTransporter();
  await transporter.sendMail({
    to,
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    subject: 'ShipProcure — Test Email',
    html: '<p>This is a test email from ShipProcure. Your email configuration is working correctly.</p>',
  });
}
