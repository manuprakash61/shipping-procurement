export interface TenderTemplateParams {
  tenderNumber: string;
  issuedAt: string;
  companyName: string;
  companyLogoUrl?: string;
  vendorName: string;
  vendorEmail: string;
  productDescription: string;
  agreedPrice: string;
  currency: string;
  deliveryDate?: string;
  termsAndCond?: string;
  bodyHtml: string;
}

export function renderTenderTemplate(params: TenderTemplateParams): string {
  const logoHtml = params.companyLogoUrl
    ? `<img src="${params.companyLogoUrl}" alt="${params.companyName}" style="height:48px;margin-bottom:8px;" />`
    : `<div style="font-size:22px;font-weight:700;color:#1a1a2e;">${params.companyName}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tender Award — ${params.tenderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Letterhead -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f3460 0%,#16213e 100%);padding:32px 48px;">
              ${logoHtml}
              <div style="color:#63b3ed;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Official Tender Award</div>
            </td>
          </tr>

          <!-- Reference Bar -->
          <tr>
            <td style="background:#0f3460;padding:12px 48px;display:flex;justify-content:space-between;">
              <table width="100%">
                <tr>
                  <td style="color:#90cdf4;font-size:12px;">Tender No: <strong style="color:#fff;">${params.tenderNumber}</strong></td>
                  <td align="right" style="color:#90cdf4;font-size:12px;">Issued: <strong style="color:#fff;">${params.issuedAt}</strong></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <p style="color:#2d3748;font-size:15px;margin:0 0 24px;">Dear <strong>${params.vendorName}</strong>,</p>

              ${params.bodyHtml}

              <!-- Commercial Summary Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <tr style="background:#ebf8ff;">
                  <td colspan="2" style="padding:12px 16px;font-weight:700;color:#2b6cb0;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Commercial Terms Summary</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:12px 16px;color:#4a5568;font-size:14px;width:40%;">Product / Service</td>
                  <td style="padding:12px 16px;color:#2d3748;font-weight:600;font-size:14px;">${params.productDescription}</td>
                </tr>
                <tr style="background:#f7fafc;border-bottom:1px solid #e2e8f0;">
                  <td style="padding:12px 16px;color:#4a5568;font-size:14px;">Agreed Price</td>
                  <td style="padding:12px 16px;color:#276749;font-weight:700;font-size:16px;">${params.agreedPrice} ${params.currency}</td>
                </tr>
                ${params.deliveryDate ? `
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:12px 16px;color:#4a5568;font-size:14px;">Delivery Date</td>
                  <td style="padding:12px 16px;color:#2d3748;font-weight:600;font-size:14px;">${params.deliveryDate}</td>
                </tr>` : ''}
                ${params.termsAndCond ? `
                <tr>
                  <td style="padding:12px 16px;color:#4a5568;font-size:14px;vertical-align:top;">Terms &amp; Conditions</td>
                  <td style="padding:12px 16px;color:#4a5568;font-size:13px;">${params.termsAndCond}</td>
                </tr>` : ''}
              </table>

              <div style="background:#f0fff4;border:1px solid #9ae6b4;border-radius:8px;padding:16px;margin-top:24px;">
                <p style="margin:0;color:#276749;font-size:14px;">
                  <strong>Action Required:</strong> Please acknowledge receipt of this tender award by replying to this email within <strong>5 business days</strong>.
                  Your acceptance constitutes a binding agreement to the terms stated above.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f7fafc;padding:24px 48px;border-top:1px solid #e2e8f0;">
              <p style="color:#718096;font-size:12px;margin:0;line-height:1.6;">
                This is an official tender document issued by <strong>${params.companyName}</strong> via ShipProcure.<br />
                Tender No: ${params.tenderNumber} | Vendor: ${params.vendorEmail}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
