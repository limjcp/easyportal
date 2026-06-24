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
