type LoginDetailsTemplateInput = {
  firstName: string;
  portalUrl: string;
  email: string;
  temporaryPassword: string;
};

type VendorInviteTemplateInput = {
  companyName: string;
  portalUrl: string;
  inviteEmail: string;
  vendorName: string;
  temporaryPassword: string;
};

type CertificateResendTemplateInput = {
  unitLabel: string;
  portalUrl: string;
  requestNumber: string;
  buildingName: string;
};

type VendorComplianceEmailInput = {
  vendorCompanyName: string;
  documentLabel: string;
  expiryDate: string;
  portalUrl: string;
  audience: "vendor" | "stakeholder";
};

type CustomMessageTemplateInput = {
  subject: string;
  body: string;
  recipientName?: string;
};

type NewsNoticeTemplateInput = {
  title: string;
  body: string;
  buildingName: string;
  portalUrl: string;
  recipientName?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function loginDetailsEmail(input: LoginDetailsTemplateInput) {
  const name = input.firstName.trim() || "there";
  const subject = "Your EasyPortal login details";
  const text = [
    `Hi ${name},`,
    "",
    "Your portal login details are below:",
    "",
    `Portal: ${input.portalUrl}`,
    `Email: ${input.email}`,
    `Temporary password: ${input.temporaryPassword}`,
    "",
    "Sign in and change your password after your first login.",
    "",
    "If you did not expect this email, contact your property management company.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b; max-width: 560px;">
      <h2 style="color: #3476ef; margin-bottom: 16px;">EasyPortal login details</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>Your portal account is ready. Use the details below to sign in:</p>
      <table style="margin: 16px 0; border-collapse: collapse;">
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Portal</strong></td><td><a href="${escapeHtml(input.portalUrl)}">${escapeHtml(input.portalUrl)}</a></td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Email</strong></td><td>${escapeHtml(input.email)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Temporary password</strong></td><td>${escapeHtml(input.temporaryPassword)}</td></tr>
      </table>
      <p>Please change your password after your first login.</p>
      <p style="color: #64748b; font-size: 13px;">If you did not expect this email, contact your property management company.</p>
    </div>
  `.trim();

  return { subject, html, text };
}

export function vendorInviteEmail(input: VendorInviteTemplateInput) {
  const subject = `You're invited to ${input.companyName} on EasyPortal`;
  const text = [
    `Hello${input.vendorName ? ` ${input.vendorName}` : ""},`,
    "",
    `${input.companyName} has invited you to join their vendor portal on EasyPortal.`,
    "",
    `Portal: ${input.portalUrl}`,
    `Email: ${input.inviteEmail}`,
    `Temporary password: ${input.temporaryPassword}`,
    "",
    "Sign in and change your password after your first login.",
    "",
    "If you have questions, contact the management company that invited you.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b; max-width: 560px;">
      <h2 style="color: #3476ef; margin-bottom: 16px;">Vendor portal invitation</h2>
      <p>Hello${input.vendorName ? ` ${escapeHtml(input.vendorName)}` : ""},</p>
      <p><strong>${escapeHtml(input.companyName)}</strong> has invited you to access the vendor portal on EasyPortal.</p>
      <p>Use the login details below to sign in:</p>
      <table style="margin: 16px 0; border-collapse: collapse;">
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Portal</strong></td><td><a href="${escapeHtml(input.portalUrl)}">${escapeHtml(input.portalUrl)}</a></td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Email</strong></td><td>${escapeHtml(input.inviteEmail)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Temporary password</strong></td><td>${escapeHtml(input.temporaryPassword)}</td></tr>
      </table>
      <p>Please change your password after your first login.</p>
      <p style="color: #64748b; font-size: 13px;">If you have questions, contact the management company that invited you.</p>
    </div>
  `.trim();

  return { subject, html, text };
}

export function certificateResendEmail(input: CertificateResendTemplateInput) {
  const subject = `Status certificate update — ${input.requestNumber || "your request"}`;
  const text = [
    "Your status certificate request has been updated.",
    "",
    `Building: ${input.buildingName}`,
    `Unit: ${input.unitLabel}`,
    `Request #: ${input.requestNumber || "—"}`,
    "",
    `View details in the resident portal: ${input.portalUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b; max-width: 560px;">
      <h2 style="color: #3476ef; margin-bottom: 16px;">Status certificate update</h2>
      <p>Your status certificate request has been updated.</p>
      <ul>
        <li><strong>Building:</strong> ${escapeHtml(input.buildingName)}</li>
        <li><strong>Unit:</strong> ${escapeHtml(input.unitLabel)}</li>
        <li><strong>Request #:</strong> ${escapeHtml(input.requestNumber || "—")}</li>
      </ul>
      <p><a href="${escapeHtml(input.portalUrl)}" style="display: inline-block; background: #3476ef; color: #fff; padding: 10px 16px; border-radius: 4px; text-decoration: none;">View in resident portal</a></p>
    </div>
  `.trim();

  return { subject, html, text };
}

export function newsNoticeEmail(input: NewsNoticeTemplateInput) {
  const subject = input.title.trim();
  const body = input.body.trim();
  const name = input.recipientName?.trim();
  const intro = name ? `Hi ${name},\n\n` : "";
  const text = [
    `${intro}${body}`,
    "",
    `Building: ${input.buildingName}`,
    "",
    `View in the resident portal: ${input.portalUrl}`,
  ].join("\n");

  const htmlIntro = name ? `<p>Hi ${escapeHtml(name)},</p>` : "";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b; max-width: 560px;">
      <h2 style="color: #3476ef; margin-bottom: 16px;">${escapeHtml(subject)}</h2>
      ${htmlIntro}
      <p style="white-space: pre-wrap;">${escapeHtml(body)}</p>
      <p style="color: #64748b; font-size: 13px;">Building: ${escapeHtml(input.buildingName)}</p>
      <p><a href="${escapeHtml(input.portalUrl)}" style="display: inline-block; background: #3476ef; color: #fff; padding: 10px 16px; border-radius: 4px; text-decoration: none;">View in resident portal</a></p>
    </div>
  `.trim();

  return { subject, html, text };
}

export function customMessageEmail(input: CustomMessageTemplateInput) {
  const subject = input.subject.trim();
  const body = input.body.trim();
  const name = input.recipientName?.trim();
  const intro = name ? `Hi ${name},\n\n` : "";
  const text = `${intro}${body}`;
  const htmlIntro = name ? `<p>Hi ${escapeHtml(name)},</p>` : "";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b; max-width: 560px;">
      ${htmlIntro}
      <p style="white-space: pre-wrap;">${escapeHtml(body)}</p>
    </div>
  `.trim();

  return { subject, html, text };
}

export function vendorComplianceExpiringSoonEmail(input: VendorComplianceEmailInput) {
  const subject = `${input.documentLabel} expiring soon — ${input.vendorCompanyName}`;
  const text =
    input.audience === "vendor"
      ? [
          "Hello,",
          "",
          `Your ${input.documentLabel.toLowerCase()} for ${input.vendorCompanyName} expires on ${input.expiryDate}.`,
          "",
          `Please upload an updated certificate in the vendor portal: ${input.portalUrl}`,
        ].join("\n")
      : [
          `The ${input.documentLabel.toLowerCase()} for vendor ${input.vendorCompanyName} expires on ${input.expiryDate}.`,
          "",
          `Vendor portal: ${input.portalUrl}`,
        ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b; max-width: 560px;">
      <h2 style="color: #3476ef; margin-bottom: 16px;">${escapeHtml(input.documentLabel)} expiring soon</h2>
      <p>${
        input.audience === "vendor"
          ? `Your <strong>${escapeHtml(input.documentLabel.toLowerCase())}</strong> expires on <strong>${escapeHtml(input.expiryDate)}</strong>.`
          : `Vendor <strong>${escapeHtml(input.vendorCompanyName)}</strong> has a ${escapeHtml(input.documentLabel.toLowerCase())} expiring on <strong>${escapeHtml(input.expiryDate)}</strong>.`
      }</p>
      ${
        input.audience === "vendor"
          ? `<p><a href="${escapeHtml(input.portalUrl)}" style="display: inline-block; background: #0d9488; color: #fff; padding: 10px 16px; border-radius: 4px; text-decoration: none;">Upload updated certificate</a></p>`
          : "<p>Please follow up with the vendor to ensure an updated certificate is on file.</p>"
      }
    </div>
  `.trim();

  return { subject, html, text };
}

export function vendorComplianceExpiredEmail(input: VendorComplianceEmailInput) {
  const subject = `${input.documentLabel} expired — ${input.vendorCompanyName}`;
  const text =
    input.audience === "vendor"
      ? [
          "Hello,",
          "",
          `Your ${input.documentLabel.toLowerCase()} for ${input.vendorCompanyName} expired on ${input.expiryDate}.`,
          "",
          `Upload a new certificate immediately: ${input.portalUrl}`,
        ].join("\n")
      : [
          `The ${input.documentLabel.toLowerCase()} for vendor ${input.vendorCompanyName} expired on ${input.expiryDate}.`,
          "",
          "Please ensure the vendor uploads an updated certificate.",
        ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b; max-width: 560px;">
      <h2 style="color: #dc2626; margin-bottom: 16px;">${escapeHtml(input.documentLabel)} expired</h2>
      <p>${
        input.audience === "vendor"
          ? `Your <strong>${escapeHtml(input.documentLabel.toLowerCase())}</strong> expired on <strong>${escapeHtml(input.expiryDate)}</strong>.`
          : `Vendor <strong>${escapeHtml(input.vendorCompanyName)}</strong> has an expired ${escapeHtml(input.documentLabel.toLowerCase())} (expired ${escapeHtml(input.expiryDate)}).`
      }</p>
      ${
        input.audience === "vendor"
          ? `<p><a href="${escapeHtml(input.portalUrl)}" style="display: inline-block; background: #dc2626; color: #fff; padding: 10px 16px; border-radius: 4px; text-decoration: none;">Upload new certificate</a></p>`
          : "<p>Please follow up with the vendor and confirm compliance before assigning new work.</p>"
      }
    </div>
  `.trim();

  return { subject, html, text };
}

type VendorInvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type VendorInvoiceEmailInput = {
  invoiceNumber: string;
  poNumber: string;
  vendorCompanyName: string;
  vendorContactName: string;
  hstNumber: string;
  buildingName: string;
  buildingAddress: string;
  corpNumber: string;
  lineItems: VendorInvoiceLineItem[];
  subtotal: number;
  hstRate: number;
  hstAmount: number;
  total: number;
  preferredPaymentMethod: "bank_transfer" | "interac_etransfer" | "sparcpay";
  paymentDetails: Record<string, string>;
};

function paymentMethodEmailLabel(method: VendorInvoiceEmailInput["preferredPaymentMethod"]): string {
  if (method === "bank_transfer") return "Bank Transfer";
  if (method === "interac_etransfer") return "Interac e-Transfer";
  return "SPARCPay";
}

function buildPaymentInfoEmailSections(input: VendorInvoiceEmailInput): {
  textLines: string[];
  htmlBlock: string;
} {
  const methodLabel = paymentMethodEmailLabel(input.preferredPaymentMethod);
  const textLines = ["", "Payment Information", `Preferred Payment Method: ${methodLabel}`];
  let htmlBlock = "";

  if (input.preferredPaymentMethod === "bank_transfer") {
    const d = input.paymentDetails;
    textLines.push(
      "Bank Transfer",
      d.bankName ? `Bank: ${d.bankName}` : "",
      d.accountName ? `Account Name: ${d.accountName}` : "",
      d.accountNumber ? `Account Number: ${d.accountNumber}` : "",
      d.institutionNumber ? `Institution: ${d.institutionNumber}` : "",
      d.transitNumber ? `Transit: ${d.transitNumber}` : "",
      d.swiftBic ? `SWIFT: ${d.swiftBic}` : ""
    );
    htmlBlock = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Payment Information</strong></p>
        <p style="margin: 0 0 4px;"><strong>Preferred Payment Method:</strong> Bank Transfer</p>
        ${d.bankName ? `<p style="margin: 0;">Bank: ${escapeHtml(d.bankName)}</p>` : ""}
        ${d.accountName ? `<p style="margin: 0;">Account Name: ${escapeHtml(d.accountName)}</p>` : ""}
        ${d.accountNumber ? `<p style="margin: 0;">Account Number: ${escapeHtml(d.accountNumber)}</p>` : ""}
        ${d.institutionNumber ? `<p style="margin: 0;">Institution: ${escapeHtml(d.institutionNumber)}</p>` : ""}
        ${d.transitNumber ? `<p style="margin: 0;">Transit: ${escapeHtml(d.transitNumber)}</p>` : ""}
        ${d.swiftBic ? `<p style="margin: 0;">SWIFT: ${escapeHtml(d.swiftBic)}</p>` : ""}
      </div>
    `.trim();
  } else if (input.preferredPaymentMethod === "interac_etransfer") {
    const d = input.paymentDetails;
    textLines.push(
      "Interac e-Transfer",
      d.recipientName ? `Recipient: ${d.recipientName}` : "",
      d.email ? `Email: ${d.email}` : ""
    );
    htmlBlock = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Payment Information</strong></p>
        <p style="margin: 0 0 4px;"><strong>Preferred Payment Method:</strong> Interac e-Transfer</p>
        ${d.recipientName ? `<p style="margin: 0;">Recipient: ${escapeHtml(d.recipientName)}</p>` : ""}
        ${d.email ? `<p style="margin: 0;">Email: ${escapeHtml(d.email)}</p>` : ""}
      </div>
    `.trim();
  } else {
    textLines.push("SPARCPay", "Coming Soon", "Payments through SPARCPay are not yet available.");
    htmlBlock = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Payment Information</strong></p>
        <p style="margin: 0 0 4px;"><strong>Preferred Payment Method:</strong> SPARCPay</p>
        <p style="margin: 8px 0 4px; display: inline-block; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Coming Soon</p>
        <p style="margin: 8px 0 0; color: #64748b;">Payments through SPARCPay are not yet available.</p>
      </div>
    `.trim();
  }

  return { textLines: textLines.filter(Boolean), htmlBlock };
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatHstRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function vendorInvoiceSubmitEmail(input: VendorInvoiceEmailInput) {
  const subject = `Invoice ${input.invoiceNumber} — ${input.vendorCompanyName} (PO ${input.poNumber})`;
  const paymentSections = buildPaymentInfoEmailSections(input);
  const lineRows = input.lineItems
    .map(
      (li) =>
        `<tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(li.description)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${li.quantity}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(li.unitPrice)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(li.lineTotal)}</td>
        </tr>`
    )
    .join("");

  const text = [
    "Vendor invoice submitted for payment",
    "",
    `Invoice: ${input.invoiceNumber}`,
    `Purchase order: ${input.poNumber}`,
    `Vendor: ${input.vendorCompanyName}`,
    `Contact: ${input.vendorContactName}`,
    `HST number: ${input.hstNumber}`,
    "",
    `Bill to: ${input.buildingName}`,
    input.buildingAddress,
    input.corpNumber ? `Corp #: ${input.corpNumber}` : "",
    "",
    "Line items:",
    ...input.lineItems.map(
      (li) =>
        `- ${li.description} | Qty ${li.quantity} | Unit ${formatMoney(li.unitPrice)} | ${formatMoney(li.lineTotal)}`
    ),
    "",
    `Subtotal: ${formatMoney(input.subtotal)}`,
    `HST (${formatHstRate(input.hstRate)}): ${formatMoney(input.hstAmount)}`,
    `Total: ${formatMoney(input.total)}`,
    ...paymentSections.textLines,
    "",
    "Please process this invoice for payment in SPARC.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b; max-width: 640px;">
      <h2 style="color: #0d9488; margin-bottom: 8px;">Invoice submitted for payment</h2>
      <p style="margin-top: 0;">A vendor has submitted an invoice for SPARC payment processing.</p>
      <table style="margin: 16px 0; border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Invoice #</strong></td><td>${escapeHtml(input.invoiceNumber)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>PO #</strong></td><td>${escapeHtml(input.poNumber)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Vendor</strong></td><td>${escapeHtml(input.vendorCompanyName)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Contact</strong></td><td>${escapeHtml(input.vendorContactName)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>HST #</strong></td><td>${escapeHtml(input.hstNumber)}</td></tr>
      </table>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; margin: 16px 0;">
        <p style="margin: 0 0 4px;"><strong>Bill to</strong></p>
        <p style="margin: 0;">${escapeHtml(input.buildingName)}</p>
        <p style="margin: 0;">${escapeHtml(input.buildingAddress)}</p>
        ${input.corpNumber ? `<p style="margin: 4px 0 0;">Corp #: ${escapeHtml(input.corpNumber)}</p>` : ""}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 6px 8px; text-align: left;">Description</th>
            <th style="padding: 6px 8px; text-align: right;">Qty</th>
            <th style="padding: 6px 8px; text-align: right;">Unit</th>
            <th style="padding: 6px 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>
      <table style="margin-left: auto; border-collapse: collapse;">
        <tr><td style="padding: 4px 12px; text-align: right;">Subtotal</td><td style="padding: 4px 0; text-align: right;">${formatMoney(input.subtotal)}</td></tr>
        <tr><td style="padding: 4px 12px; text-align: right;">HST (${formatHstRate(input.hstRate)})</td><td style="padding: 4px 0; text-align: right;">${formatMoney(input.hstAmount)}</td></tr>
        <tr><td style="padding: 4px 12px; text-align: right;"><strong>Total</strong></td><td style="padding: 4px 0; text-align: right;"><strong>${formatMoney(input.total)}</strong></td></tr>
      </table>
      ${paymentSections.htmlBlock}
      <p style="margin-top: 24px; color: #64748b; font-size: 13px;">Please process this invoice for payment in SPARC.</p>
    </div>
  `.trim();

  return { subject, html, text };
}
