import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? '');

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@example.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME ?? 'ShipProcure';
const INBOUND_HOST = process.env.SENDGRID_INBOUND_PARSE_HOST ?? 'inbound.example.com';

export function buildRFQReplyTo(rfqId: string, vendorId: string): string {
  return `replies+rfq_${rfqId}_vendor_${vendorId}@${INBOUND_HOST}`;
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
    const [response] = await sgMail.send({
      to: params.to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      replyTo: buildRFQReplyTo(params.rfqId, params.vendorId),
      subject: params.subject,
      html: params.htmlBody,
      customArgs: {
        rfq_id: params.rfqId,
        vendor_id: params.vendorId,
      },
    });

    const msgId = response.headers['x-message-id'] as string | undefined;
    return msgId ?? null;
  } catch (err) {
    console.error('[SendGrid] Failed to send RFQ:', err);
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
    const msg: sgMail.MailDataRequired = {
      to: params.to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: params.subject,
      html: params.htmlBody,
      customArgs: { tender_id: params.tenderId },
    };

    if (params.pdfAttachment) {
      msg.attachments = [
        {
          content: params.pdfAttachment.content,
          filename: params.pdfAttachment.filename,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ];
    }

    const [response] = await sgMail.send(msg);
    const msgId = response.headers['x-message-id'] as string | undefined;
    return msgId ?? null;
  } catch (err) {
    console.error('[SendGrid] Failed to send Tender:', err);
    return null;
  }
}

export async function sendTestEmail(to: string): Promise<void> {
  await sgMail.send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: 'ShipProcure — Test Email',
    html: '<p>This is a test email from ShipProcure. Your email configuration is working correctly.</p>',
  });
}
