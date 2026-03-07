import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { extractQuoteData } from '../../services/ai/claude.service';
import { QuoteExtractionResult } from '../../types';

function parseRFQIds(recipient: string): { rfqId: string; vendorId: string } | null {
  // Format: replies+rfq_{rfqId}_vendor_{vendorId}@domain.com
  const match = recipient.match(/rfq_([^_]+)_vendor_([^@]+)/);
  if (!match) return null;
  return { rfqId: match[1], vendorId: match[2] };
}

export async function handleInboundEmail(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, string>;

    const from = body.from ?? '';
    const to = body.to ?? '';
    const subject = body.subject ?? '';
    const htmlBody = body.html ?? '';
    const textBody = body.text ?? '';

    // Extract sender email
    const senderMatch = from.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const senderEmail = senderMatch?.[0]?.toLowerCase() ?? '';

    // Try to match via reply-to subaddress (most reliable)
    let rfqId: string | null = null;
    let vendorId: string | null = null;

    const toAddresses = to.split(',').map((a: string) => a.trim());
    for (const addr of toAddresses) {
      const parsed = parseRFQIds(addr);
      if (parsed) {
        rfqId = parsed.rfqId;
        vendorId = parsed.vendorId;
        break;
      }
    }

    // Fallback: match by sender email
    if (!rfqId && senderEmail) {
      const rfqVendor = await prisma.rFQVendor.findFirst({
        where: { emailSentTo: senderEmail, status: { in: ['SENT', 'DELIVERED', 'OPENED'] } },
        orderBy: { sentAt: 'desc' },
      });
      if (rfqVendor) {
        rfqId = rfqVendor.rfqId;
        vendorId = rfqVendor.vendorId;
      }
    }

    if (!rfqId || !vendorId) {
      console.warn('[Inbound] Could not match email to RFQ:', { from, to });
      res.status(200).json({ message: 'Unmatched email — ignored' });
      return;
    }

    const rfqVendor = await prisma.rFQVendor.findUnique({
      where: { rfqId_vendorId: { rfqId, vendorId } },
      include: { vendor: true },
    });

    if (!rfqVendor) {
      res.status(200).json({ message: 'RFQVendor not found' });
      return;
    }

    // Avoid duplicate quotes
    const existing = await prisma.quote.findUnique({
      where: { rfqVendorId: rfqVendor.id },
    });
    if (existing) {
      res.status(200).json({ message: 'Quote already recorded' });
      return;
    }

    // AI extraction
    let extracted: QuoteExtractionResult = {};

    try {
      extracted = await extractQuoteData(textBody || htmlBody);
    } catch (err) {
      console.error('[Inbound] Claude extraction failed:', err);
    }

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        rfqId,
        rfqVendorId: rfqVendor.id,
        vendorName: rfqVendor.vendor.name,
        vendorEmail: senderEmail,
        rawEmailHtml: htmlBody,
        rawEmailText: textBody,
        price: extracted.price ? String(extracted.price) : undefined,
        currency: extracted.currency,
        leadTimeDays: extracted.leadTimeDays,
        validUntil: extracted.validUntil ? new Date(extracted.validUntil) : undefined,
        terms: extracted.terms,
        aiSummary: extracted.summary,
        aiExtractedData: extracted as any,
        status: 'RECEIVED',
      },
    });

    // Update RFQVendor status
    await prisma.rFQVendor.update({
      where: { id: rfqVendor.id },
      data: { status: 'REPLIED', repliedAt: new Date() },
    });

    // Update RFQ status
    const allVendors = await prisma.rFQVendor.findMany({ where: { rfqId } });
    const allReplied = allVendors.every((v) => v.status === 'REPLIED');
    await prisma.rFQ.update({
      where: { id: rfqId },
      data: { status: allReplied ? 'FULLY_REPLIED' : 'PARTIALLY_REPLIED' },
    });

    console.log(`[Inbound] Quote created: ${quote.id} for RFQ ${rfqId}`);
    res.status(200).json({ message: 'Quote recorded', quoteId: quote.id });
  } catch (err) {
    console.error('[Inbound] Webhook error:', err);
    res.status(200).json({ message: 'Error processing — acknowledged' });
  }
}

export async function handleSendgridEvent(req: Request, res: Response) {
  try {
    const events = req.body as Array<{
      event: string;
      sg_message_id: string;
      timestamp: number;
    }>;

    for (const event of events) {
      const msgId = event.sg_message_id?.split('.')[0];
      if (!msgId) continue;

      if (event.event === 'open') {
        await prisma.rFQVendor.updateMany({
          where: { sendgridMsgId: msgId },
          data: { status: 'OPENED', openedAt: new Date(event.timestamp * 1000) },
        });
      } else if (event.event === 'bounce' || event.event === 'dropped') {
        await prisma.rFQVendor.updateMany({
          where: { sendgridMsgId: msgId },
          data: { status: 'BOUNCED', bouncedAt: new Date(event.timestamp * 1000) },
        });
      } else if (event.event === 'delivered') {
        await prisma.rFQVendor.updateMany({
          where: { sendgridMsgId: msgId, status: 'SENT' },
          data: { status: 'DELIVERED' },
        });
      }
    }

    res.status(200).json({ message: 'Events processed' });
  } catch (err) {
    console.error('[Events] Webhook error:', err);
    res.status(200).json({ message: 'Error — acknowledged' });
  }
}
