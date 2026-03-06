export interface RFQTemplateParams {
  vendorName: string;
  companyName: string;
  companyLogoUrl?: string;
  bodyHtml: string;
  rfqId: string;
  deadline?: string;
}

export function renderRFQTemplate(params: RFQTemplateParams): string {
  const logoHtml = params.companyLogoUrl
    ? `<img src="${params.companyLogoUrl}" alt="${params.companyName}" style="height:48px;margin-bottom:16px;" />`
    : `<div style="font-size:22px;font-weight:700;color:#1a1a2e;">${params.companyName}</div>`;

  const deadlineHtml = params.deadline
    ? `<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:12px 16px;margin:16px 0;">
        <strong>⏰ Response Required By:</strong> ${params.deadline}
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Request for Quotation</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
              ${logoHtml}
              <div style="color:#a0aec0;font-size:13px;margin-top:8px;text-transform:uppercase;letter-spacing:1px;">Request for Quotation</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#4a5568;font-size:15px;margin:0 0 16px;">Dear <strong>${params.vendorName}</strong>,</p>
              ${params.bodyHtml}
              ${deadlineHtml}
            </td>
          </tr>

          <!-- Reference -->
          <tr>
            <td style="padding:0 40px 16px;">
              <div style="background:#f7fafc;border-radius:6px;padding:12px 16px;font-size:12px;color:#718096;">
                RFQ Reference: <strong>${params.rfqId}</strong> — Please include this reference in your reply.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f7fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#a0aec0;font-size:12px;margin:0;">
                This RFQ was sent via <strong>ShipProcure</strong> on behalf of ${params.companyName}.<br />
                Please reply directly to this email to submit your quotation.
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
