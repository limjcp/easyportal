import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  certificateResendEmail,
  customMessageEmail,
  loginDetailsEmail,
  newsNoticeEmail,
  vendorInviteEmail,
  vendorInvoiceSubmitEmail,
} from "../_shared/emailTemplates.ts";
import {
  resolveNewsNoticeAdminCcEmails,
  resolveNewsNoticeResidents,
} from "../_shared/newsNoticeRecipients.ts";
import { generateTempPassword, getPortalAppUrl, sendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SendPortalEmailPayload =
  | { type: "employee_login_details"; membershipId: string }
  | { type: "building_admin_login_details"; membershipId: string }
  | { type: "occupancy_login_details"; occupancyId: string }
  | { type: "occupancy_activate"; occupancyId: string }
  | { type: "occupancy_custom_email"; occupancyId: string; subject: string; body: string }
  | { type: "vendor_invite"; vendorId: string; email: string }
  | { type: "certificate_resend"; certificateId: string }
  | { type: "news_notice_blast"; newsItemId: string }
  | { type: "vendor_invoice_submit"; invoiceId: string };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function createClients(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    throw new Error("Server configuration error.");
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing authorization.");
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await userClient.auth.getUser();
  if (callerError || !caller) {
    throw new Error("Unauthorized.");
  }

  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("is_super_admin")
    .eq("id", caller.id)
    .maybeSingle();
  const isSuperAdmin = callerProfile?.is_super_admin === true;

  return { caller, isSuperAdmin, adminClient };
}

async function isCompanyOwnerOrAdmin(
  adminClient: SupabaseClient,
  userId: string,
  companyId: string,
  isSuperAdmin: boolean
): Promise<boolean> {
  if (isSuperAdmin) return true;
  const { data, error } = await adminClient.rpc("is_company_owner_or_admin", {
    p_user_id: userId,
    p_company_id: companyId,
  });
  if (error) throw error;
  return data === true;
}

async function hasBuildingAccess(
  adminClient: SupabaseClient,
  userId: string,
  buildingId: string,
  isSuperAdmin: boolean
): Promise<boolean> {
  if (isSuperAdmin) return true;
  const { data, error } = await adminClient.rpc("is_building_member", {
    p_user_id: userId,
    p_building_id: buildingId,
  });
  if (error) throw error;
  return data === true;
}

async function hasCompanyAccess(
  adminClient: SupabaseClient,
  userId: string,
  companyId: string,
  isSuperAdmin: boolean
): Promise<boolean> {
  if (isSuperAdmin) return true;
  const { data, error } = await adminClient
    .from("company_memberships")
    .select("id")
    .eq("company_id", companyId)
    .eq("profile_id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function sendLoginDetailsEmail(input: {
  adminClient: SupabaseClient;
  profileId: string;
  email: string;
  firstName: string;
  temporaryPassword?: string;
}) {
  const temporaryPassword = input.temporaryPassword ?? generateTempPassword();
  if (!input.temporaryPassword) {
    const { error: updateError } = await input.adminClient.auth.admin.updateUserById(input.profileId, {
      password: temporaryPassword,
    });
    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  const portalUrl = `${getPortalAppUrl()}/login`;
  const template = loginDetailsEmail({
    firstName: input.firstName,
    portalUrl,
    email: input.email,
    temporaryPassword,
  });

  await sendEmail({
    to: input.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  const { error: profileError } = await input.adminClient
    .from("profiles")
    .update({
      must_change_password: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.profileId);
  if (profileError) {
    throw new Error(profileError.message);
  }

  return { email: input.email, message: `Login details sent to ${input.email}.` };
}

async function handleEmployeeLoginDetails(
  adminClient: SupabaseClient,
  callerId: string,
  isSuperAdmin: boolean,
  membershipId: string
) {
  const { data: membership, error } = await adminClient
    .from("company_memberships")
    .select("company_id, profile_id, profiles(first_name, last_name, email)")
    .eq("id", membershipId)
    .maybeSingle();
  if (error) throw error;
  if (!membership) throw new Error("Employee not found.");

  const companyId = membership.company_id as string;
  if (!(await isCompanyOwnerOrAdmin(adminClient, callerId, companyId, isSuperAdmin))) {
    throw new Error("Not allowed to email login details for this employee.");
  }

  const profile = membership.profiles as {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  if (!profile?.email?.trim()) {
    throw new Error("Employee does not have an email address.");
  }

  return sendLoginDetailsEmail({
    adminClient,
    profileId: membership.profile_id as string,
    email: profile.email.trim(),
    firstName: profile.first_name?.trim() || profile.last_name?.trim() || "",
  });
}

async function handleBuildingAdminLoginDetails(
  adminClient: SupabaseClient,
  callerId: string,
  isSuperAdmin: boolean,
  membershipId: string
) {
  const { data: membership, error } = await adminClient
    .from("building_memberships")
    .select("building_id, profile_id, profiles(first_name, last_name, email)")
    .eq("id", membershipId)
    .maybeSingle();
  if (error) throw error;
  if (!membership) throw new Error("Building admin not found.");

  const buildingId = membership.building_id as string;
  if (!(await hasBuildingAccess(adminClient, callerId, buildingId, isSuperAdmin))) {
    throw new Error("Not allowed to email login details for this admin.");
  }

  const profile = membership.profiles as {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  if (!profile?.email?.trim()) {
    throw new Error("Admin does not have an email address.");
  }

  return sendLoginDetailsEmail({
    adminClient,
    profileId: membership.profile_id as string,
    email: profile.email.trim(),
    firstName: profile.first_name?.trim() || profile.last_name?.trim() || "",
  });
}

async function handleOccupancyLoginDetails(
  adminClient: SupabaseClient,
  callerId: string,
  isSuperAdmin: boolean,
  occupancyId: string
) {
  const { data: occupancy, error } = await adminClient
    .from("unit_occupancies")
    .select("building_id, profile_id, account_status, profiles(first_name, last_name, email)")
    .eq("id", occupancyId)
    .maybeSingle();
  if (error) throw error;
  if (!occupancy) throw new Error("User not found.");

  if (occupancy.account_status !== "Activated") {
    throw new Error("This user does not have an activated login account yet.");
  }

  const profileId = occupancy.profile_id as string | null;
  if (!profileId) {
    throw new Error("This user does not have a login account yet.");
  }

  const buildingId = occupancy.building_id as string;
  if (!(await hasBuildingAccess(adminClient, callerId, buildingId, isSuperAdmin))) {
    throw new Error("Not allowed to email login details for this user.");
  }

  const profile = occupancy.profiles as {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  if (!profile?.email?.trim()) {
    throw new Error("User does not have an email address.");
  }

  return sendLoginDetailsEmail({
    adminClient,
    profileId,
    email: profile.email.trim(),
    firstName: profile.first_name?.trim() || profile.last_name?.trim() || "",
  });
}

async function handleOccupancyActivate(
  adminClient: SupabaseClient,
  callerId: string,
  isSuperAdmin: boolean,
  occupancyId: string
) {
  const { data: occupancy, error } = await adminClient
    .from("unit_occupancies")
    .select(
      "building_id, resident_name, email, account_status, profiles(first_name, last_name, email)"
    )
    .eq("id", occupancyId)
    .maybeSingle();
  if (error) throw error;
  if (!occupancy) throw new Error("User not found.");

  if (occupancy.account_status !== "Awaiting Activation") {
    throw new Error("This user is not awaiting activation.");
  }

  const occupancyEmail = (occupancy.email as string | null)?.trim().toLowerCase();
  if (!occupancyEmail) {
    throw new Error("User does not have an email address.");
  }

  const buildingId = occupancy.building_id as string;
  if (!(await hasBuildingAccess(adminClient, callerId, buildingId, isSuperAdmin))) {
    throw new Error("Not allowed to activate this user.");
  }

  const profile = occupancy.profiles as {
    first_name: string;
    last_name: string;
    email: string;
  } | null;

  const residentName = (occupancy.resident_name as string)?.trim() ?? "";
  let firstName = profile?.first_name?.trim() ?? "";
  let lastName = profile?.last_name?.trim() ?? "";
  if (!firstName && !lastName) {
    const split = splitContactName(residentName);
    firstName = split.firstName;
    lastName = split.lastName;
  }
  const displayName =
    `${firstName} ${lastName}`.trim() || residentName || occupancyEmail.split("@")[0] || "Resident";

  const temporaryPassword = generateTempPassword();
  const profileId = await ensureVendorProfile(
    adminClient,
    occupancyEmail,
    displayName,
    temporaryPassword
  );

  const { error: occError } = await adminClient
    .from("unit_occupancies")
    .update({
      profile_id: profileId,
      account_status: "Activated",
      resident_name: displayName,
      email: occupancyEmail,
    })
    .eq("id", occupancyId)
    .eq("building_id", buildingId);
  if (occError) throw new Error(occError.message);

  return sendLoginDetailsEmail({
    adminClient,
    profileId,
    email: occupancyEmail,
    firstName: firstName || lastName || displayName,
    temporaryPassword,
  });
}

async function handleOccupancyCustomEmail(
  adminClient: SupabaseClient,
  callerId: string,
  isSuperAdmin: boolean,
  occupancyId: string,
  subject: string,
  body: string
) {
  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();
  if (!trimmedSubject) {
    throw new Error("Subject is required.");
  }
  if (!trimmedBody) {
    throw new Error("Message is required.");
  }

  const { data: occupancy, error } = await adminClient
    .from("unit_occupancies")
    .select("building_id, email, resident_name, profile_id")
    .eq("id", occupancyId)
    .maybeSingle();
  if (error) throw error;
  if (!occupancy) throw new Error("User not found.");

  const recipientEmail = (occupancy.email as string | null)?.trim();
  if (!recipientEmail) {
    throw new Error("User does not have an email address.");
  }

  const buildingId = occupancy.building_id as string;
  if (!(await hasBuildingAccess(adminClient, callerId, buildingId, isSuperAdmin))) {
    throw new Error("Not allowed to email this user.");
  }

  const recipientName = (occupancy.resident_name as string | null)?.trim() || undefined;
  const template = customMessageEmail({
    subject: trimmedSubject,
    body: trimmedBody,
    recipientName,
  });

  await sendEmail({
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  const profileId = occupancy.profile_id as string | null;
  const { error: recordError } = await adminClient.from("email_records").insert({
    building_id: buildingId,
    profile_id: profileId,
    subject: trimmedSubject,
    body: trimmedBody,
    status: "delivered",
  });
  if (recordError) {
    throw new Error(recordError.message);
  }

  return { email: recipientEmail, message: `Email sent to ${recipientEmail}.` };
}

async function hasCompanyVendorEditAccess(
  adminClient: SupabaseClient,
  userId: string,
  companyId: string,
  isSuperAdmin: boolean
): Promise<boolean> {
  if (isSuperAdmin) return true;
  const { data, error } = await adminClient.rpc("has_company_permission", {
    p_user_id: userId,
    p_company_id: companyId,
    p_module_key: "company-vendors",
    p_action: "edit",
  });
  if (error) throw error;
  return data === true;
}

function splitContactName(contactName: string): { firstName: string; lastName: string } {
  const trimmed = contactName.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1]!,
  };
}

async function ensureVendorProfile(
  adminClient: SupabaseClient,
  inviteEmail: string,
  contactName: string,
  temporaryPassword: string
): Promise<string> {
  const { firstName, lastName } = splitContactName(contactName);
  const displayName = contactName.trim() || firstName || inviteEmail.split("@")[0] || "Vendor";

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .ilike("email", inviteEmail)
    .maybeSingle();

  let profileId = existingProfile?.id as string | undefined;

  if (!profileId) {
    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email: inviteEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
      },
    });
    if (createError) throw new Error(createError.message);
    profileId = createdUser.user.id;
  } else {
    const { error: updateError } = await adminClient.auth.admin.updateUserById(profileId, {
      password: temporaryPassword,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
      },
    });
    if (updateError) throw new Error(updateError.message);
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      email: inviteEmail,
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      must_change_password: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);
  if (profileError) throw new Error(profileError.message);

  return profileId;
}

async function linkVendorUser(
  adminClient: SupabaseClient,
  profileId: string,
  vendorId: string
): Promise<void> {
  const { data: existingLink, error: linkError } = await adminClient
    .from("vendor_users")
    .select("vendor_id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (linkError) throw linkError;

  if (existingLink && existingLink.vendor_id !== vendorId) {
    throw new Error("This email is already linked to another vendor account.");
  }

  if (!existingLink) {
    const { error: insertError } = await adminClient.from("vendor_users").insert({
      profile_id: profileId,
      vendor_id: vendorId,
    });
    if (insertError) throw new Error(insertError.message);
  }
}

async function handleVendorInvite(
  adminClient: SupabaseClient,
  callerId: string,
  isSuperAdmin: boolean,
  vendorId: string,
  email: string
) {
  const inviteEmail = email.trim().toLowerCase();
  if (!inviteEmail) throw new Error("Vendor email is required.");

  const { data: vendor, error } = await adminClient
    .from("vendors")
    .select("company_name, contact_name, company_id")
    .eq("id", vendorId)
    .maybeSingle();
  if (error) throw error;
  if (!vendor) throw new Error("Vendor not found.");

  const companyId = vendor.company_id as string;
  if (!(await hasCompanyVendorEditAccess(adminClient, callerId, companyId, isSuperAdmin))) {
    throw new Error("Not allowed to invite vendors for this company.");
  }

  const temporaryPassword = generateTempPassword();
  const contactName = (vendor.contact_name as string)?.trim() || "";
  const profileId = await ensureVendorProfile(
    adminClient,
    inviteEmail,
    contactName,
    temporaryPassword
  );
  await linkVendorUser(adminClient, profileId, vendorId);

  const { data: company } = await adminClient
    .from("management_companies")
    .select("name")
    .eq("id", companyId)
    .maybeSingle();

  const companyName =
    company?.name?.trim() ||
    (vendor.company_name as string)?.trim() ||
    "Your management company";
  const portalUrl = `${getPortalAppUrl()}/login`;
  const template = vendorInviteEmail({
    companyName,
    portalUrl,
    inviteEmail,
    vendorName: contactName,
    temporaryPassword,
  });

  await sendEmail({
    to: inviteEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return {
    email: inviteEmail,
    message: `Invitation and login details sent to ${inviteEmail}.`,
  };
}

async function handleCertificateResend(
  adminClient: SupabaseClient,
  callerId: string,
  isSuperAdmin: boolean,
  certificateId: string
) {
  const { data: certificate, error } = await adminClient
    .from("status_certificates")
    .select("building_id, unit, request_number, requested_by_profile_id, requested_by_name, detail")
    .eq("id", certificateId)
    .maybeSingle();
  if (error) throw error;
  if (!certificate) throw new Error("Certificate not found.");

  const buildingId = certificate.building_id as string;
  if (!(await hasBuildingAccess(adminClient, callerId, buildingId, isSuperAdmin))) {
    throw new Error("Not allowed to resend this certificate.");
  }

  let recipientEmail = "";
  const detail = (certificate.detail as Record<string, unknown> | null) ?? {};
  if (typeof detail.requestedByEmail === "string" && detail.requestedByEmail.trim()) {
    recipientEmail = detail.requestedByEmail.trim();
  }

  if (!recipientEmail && certificate.requested_by_profile_id) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("email")
      .eq("id", certificate.requested_by_profile_id as string)
      .maybeSingle();
    recipientEmail = profile?.email?.trim() ?? "";
  }

  if (!recipientEmail) {
    throw new Error("No recipient email is available for this certificate.");
  }

  const buildingRecord = await adminClient
    .from("buildings")
    .select("name")
    .eq("id", buildingId)
    .maybeSingle();
  const portalUrl = `${getPortalAppUrl()}/login`;
  const template = certificateResendEmail({
    unitLabel: (certificate.unit as string) || "—",
    portalUrl,
    requestNumber: (certificate.request_number as string) || "",
    buildingName: buildingRecord.data?.name?.trim() || "Your building",
  });

  await sendEmail({
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return {
    email: recipientEmail,
    message: `Certificate notification sent to ${recipientEmail}.`,
  };
}

async function isVendorUser(
  adminClient: SupabaseClient,
  userId: string,
  vendorId: string,
  isSuperAdmin: boolean
): Promise<boolean> {
  if (isSuperAdmin) return true;
  const { data, error } = await adminClient
    .from("vendor_users")
    .select("vendor_id")
    .eq("profile_id", userId)
    .eq("vendor_id", vendorId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

type VendorInvoiceLineItemRow = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

async function handleVendorInvoiceSubmit(
  adminClient: SupabaseClient,
  callerId: string,
  isSuperAdmin: boolean,
  invoiceId: string
) {
  const { data: invoice, error } = await adminClient
    .from("vendor_invoices")
    .select(
      "id, vendor_id, building_id, invoice_number, hst_number, subtotal, hst_rate, hst_amount, total, line_items, status, preferred_payment_method, payment_details, purchase_orders(po_number), vendors(company_name, contact_name), buildings(name, address, corp_number, sparc_email, accounting_email)"
    )
    .eq("id", invoiceId)
    .maybeSingle();
  if (error) throw error;
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status !== "draft") {
    throw new Error("This invoice has already been submitted.");
  }

  const vendorId = invoice.vendor_id as string;
  if (!(await isVendorUser(adminClient, callerId, vendorId, isSuperAdmin))) {
    throw new Error("Not allowed to submit this invoice.");
  }

  const building = invoice.buildings as {
    name: string;
    address: string;
    corp_number: string;
    sparc_email: string;
    accounting_email: string;
  } | null;
  const vendor = invoice.vendors as {
    company_name: string;
    contact_name: string;
  } | null;
  const purchaseOrder = invoice.purchase_orders as { po_number: string } | null;

  const sparcEmail = building?.sparc_email?.trim() ?? "";
  if (!sparcEmail) {
    throw new Error(
      "This building does not have a SPARC bill email configured. Contact property management."
    );
  }

  const lineItems = ((invoice.line_items as VendorInvoiceLineItemRow[] | null) ?? []).map((li) => ({
    description: String(li.description ?? ""),
    quantity: Number(li.quantity ?? 0),
    unitPrice: Number(li.unitPrice ?? 0),
    lineTotal: Number(li.lineTotal ?? 0),
  }));

  const paymentDetailsRaw = (invoice.payment_details as Record<string, unknown> | null) ?? {};
  const paymentDetails = Object.fromEntries(
    Object.entries(paymentDetailsRaw).map(([key, value]) => [key, String(value ?? "")])
  );

  const template = vendorInvoiceSubmitEmail({
    invoiceNumber: invoice.invoice_number as string,
    poNumber: purchaseOrder?.po_number ?? "—",
    vendorCompanyName: vendor?.company_name?.trim() || "Vendor",
    vendorContactName: vendor?.contact_name?.trim() || "—",
    hstNumber: (invoice.hst_number as string)?.trim() || "—",
    buildingName: building?.name?.trim() || "Building",
    buildingAddress: building?.address?.trim() || "",
    corpNumber: building?.corp_number?.trim() || "",
    lineItems,
    subtotal: Number(invoice.subtotal ?? 0),
    hstRate: Number(invoice.hst_rate ?? 0.13),
    hstAmount: Number(invoice.hst_amount ?? 0),
    total: Number(invoice.total ?? 0),
    preferredPaymentMethod:
      (invoice.preferred_payment_method as "bank_transfer" | "interac_etransfer" | "sparcpay") ??
      "bank_transfer",
    paymentDetails,
  });

  const accountingEmail = building?.accounting_email?.trim();
  await sendEmail({
    to: sparcEmail,
    cc: accountingEmail && accountingEmail !== sparcEmail ? accountingEmail : undefined,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  const { error: updateError } = await adminClient
    .from("vendor_invoices")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      sparc_recipient_email: sparcEmail,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .eq("status", "draft");
  if (updateError) throw new Error(updateError.message);

  return {
    email: sparcEmail,
    message: `Invoice submitted for payment to ${sparcEmail}.`,
  };
}

async function handleNewsNoticeBlast(
  adminClient: SupabaseClient,
  callerId: string,
  isSuperAdmin: boolean,
  newsItemId: string
) {
  const { data: newsItem, error } = await adminClient
    .from("news_items")
    .select(
      "id, building_id, title, body, status, no_notifications, resident_types, admin_cc_types"
    )
    .eq("id", newsItemId)
    .maybeSingle();
  if (error) throw error;
  if (!newsItem) throw new Error("News/notice not found.");

  if (newsItem.no_notifications) {
    throw new Error("Notifications are disabled for this notice.");
  }
  if (newsItem.status !== "active") {
    throw new Error("Only active notices can send email notifications.");
  }

  const buildingId = newsItem.building_id as string;
  if (!(await hasBuildingAccess(adminClient, callerId, buildingId, isSuperAdmin))) {
    throw new Error("Not allowed to send notifications for this notice.");
  }

  const selectedResidentTypes = (newsItem.resident_types as string[]) ?? [];
  const selectedAdminCcTypes = (newsItem.admin_cc_types as string[]) ?? [];

  const [residents, adminCcEmails] = await Promise.all([
    resolveNewsNoticeResidents(adminClient, buildingId, selectedResidentTypes),
    resolveNewsNoticeAdminCcEmails(adminClient, buildingId, selectedAdminCcTypes),
  ]);

  if (residents.length === 0) {
    throw new Error("No activated residents match the selected resident types for this building.");
  }

  const { data: building } = await adminClient
    .from("buildings")
    .select("name")
    .eq("id", buildingId)
    .maybeSingle();
  const buildingName = (building?.name as string)?.trim() || "Your building";
  const portalUrl = `${getPortalAppUrl()}/login`;

  const residentEmailSet = new Set(residents.map((recipient) => recipient.email));
  const ccForResidents = adminCcEmails.filter((email) => !residentEmailSet.has(email));

  let delivered = 0;
  let failed = 0;

  for (const recipient of residents) {
    const template = newsNoticeEmail({
      title: newsItem.title as string,
      body: (newsItem.body as string) || "",
      buildingName,
      portalUrl,
      recipientName: recipient.residentName,
    });

    try {
      await sendEmail({
        to: recipient.email,
        cc: ccForResidents.length > 0 ? ccForResidents : undefined,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      delivered += 1;
      const { error: recordError } = await adminClient.from("email_records").insert({
        building_id: buildingId,
        profile_id: recipient.profileId,
        news_item_id: newsItemId,
        recipient_email: recipient.email,
        subject: template.subject,
        body: (newsItem.body as string) || "",
        status: "delivered",
      });
      if (recordError) throw new Error(recordError.message);
    } catch {
      failed += 1;
      await adminClient.from("email_records").insert({
        building_id: buildingId,
        profile_id: recipient.profileId,
        news_item_id: newsItemId,
        recipient_email: recipient.email,
        subject: template.subject,
        body: (newsItem.body as string) || "",
        status: "bounced",
      });
    }
  }

  const ccOnlyRecipients = adminCcEmails.filter((email) => !residentEmailSet.has(email));
  for (const ccEmail of ccOnlyRecipients) {
    const template = newsNoticeEmail({
      title: newsItem.title as string,
      body: (newsItem.body as string) || "",
      buildingName,
      portalUrl,
    });

    const { data: ccProfile } = await adminClient
      .from("profiles")
      .select("id")
      .ilike("email", ccEmail)
      .maybeSingle();

    try {
      await sendEmail({
        to: ccEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      delivered += 1;
      await adminClient.from("email_records").insert({
        building_id: buildingId,
        profile_id: (ccProfile?.id as string | undefined) ?? null,
        news_item_id: newsItemId,
        recipient_email: ccEmail,
        subject: template.subject,
        body: (newsItem.body as string) || "",
        status: "delivered",
      });
    } catch {
      failed += 1;
      await adminClient.from("email_records").insert({
        building_id: buildingId,
        profile_id: (ccProfile?.id as string | undefined) ?? null,
        news_item_id: newsItemId,
        recipient_email: ccEmail,
        subject: template.subject,
        body: (newsItem.body as string) || "",
        status: "bounced",
      });
    }
  }

  const sent = residents.length + ccOnlyRecipients.length;
  const emailStats = {
    sent,
    delivered,
    opened: 0,
    clicked: 0,
    bounced: failed,
    spamReports: 0,
    rejections: 0,
    delayed: 0,
  };

  const { error: updateError } = await adminClient
    .from("news_items")
    .update({
      email_total: sent,
      email_delivered: delivered,
      email_stats: emailStats,
      updated_at: new Date().toISOString(),
    })
    .eq("id", newsItemId);
  if (updateError) throw new Error(updateError.message);

  return {
    email: residents[0]?.email ?? adminCcEmails[0] ?? "",
    message: `Sent ${delivered} of ${sent} news/notice emails for "${newsItem.title as string}".`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as SendPortalEmailPayload;
    if (!payload?.type) {
      return jsonResponse({ error: "Missing email type." }, 400);
    }

    const { caller, isSuperAdmin, adminClient } = await createClients(req);
    let result: { email: string; message: string };

    switch (payload.type) {
      case "employee_login_details":
        if (!payload.membershipId?.trim()) {
          return jsonResponse({ error: "membershipId is required." }, 400);
        }
        result = await handleEmployeeLoginDetails(
          adminClient,
          caller.id,
          isSuperAdmin,
          payload.membershipId.trim()
        );
        break;
      case "building_admin_login_details":
        if (!payload.membershipId?.trim()) {
          return jsonResponse({ error: "membershipId is required." }, 400);
        }
        result = await handleBuildingAdminLoginDetails(
          adminClient,
          caller.id,
          isSuperAdmin,
          payload.membershipId.trim()
        );
        break;
      case "occupancy_login_details":
        if (!payload.occupancyId?.trim()) {
          return jsonResponse({ error: "occupancyId is required." }, 400);
        }
        result = await handleOccupancyLoginDetails(
          adminClient,
          caller.id,
          isSuperAdmin,
          payload.occupancyId.trim()
        );
        break;
      case "occupancy_activate":
        if (!payload.occupancyId?.trim()) {
          return jsonResponse({ error: "occupancyId is required." }, 400);
        }
        result = await handleOccupancyActivate(
          adminClient,
          caller.id,
          isSuperAdmin,
          payload.occupancyId.trim()
        );
        break;
      case "occupancy_custom_email":
        if (!payload.occupancyId?.trim()) {
          return jsonResponse({ error: "occupancyId is required." }, 400);
        }
        if (!payload.subject?.trim() || !payload.body?.trim()) {
          return jsonResponse({ error: "subject and body are required." }, 400);
        }
        result = await handleOccupancyCustomEmail(
          adminClient,
          caller.id,
          isSuperAdmin,
          payload.occupancyId.trim(),
          payload.subject,
          payload.body
        );
        break;
      case "vendor_invite":
        if (!payload.vendorId?.trim() || !payload.email?.trim()) {
          return jsonResponse({ error: "vendorId and email are required." }, 400);
        }
        result = await handleVendorInvite(
          adminClient,
          caller.id,
          isSuperAdmin,
          payload.vendorId.trim(),
          payload.email
        );
        break;
      case "certificate_resend":
        if (!payload.certificateId?.trim()) {
          return jsonResponse({ error: "certificateId is required." }, 400);
        }
        result = await handleCertificateResend(
          adminClient,
          caller.id,
          isSuperAdmin,
          payload.certificateId.trim()
        );
        break;
      case "news_notice_blast":
        if (!payload.newsItemId?.trim()) {
          return jsonResponse({ error: "newsItemId is required." }, 400);
        }
        result = await handleNewsNoticeBlast(
          adminClient,
          caller.id,
          isSuperAdmin,
          payload.newsItemId.trim()
        );
        break;
      case "vendor_invoice_submit":
        if (!payload.invoiceId?.trim()) {
          return jsonResponse({ error: "invoiceId is required." }, 400);
        }
        result = await handleVendorInvoiceSubmit(
          adminClient,
          caller.id,
          isSuperAdmin,
          payload.invoiceId.trim()
        );
        break;
      default:
        return jsonResponse({ error: "Invalid email type." }, 400);
    }

    return jsonResponse({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    const status = message === "Unauthorized." || message === "Missing authorization." ? 401 : 400;
    return jsonResponse({ error: message }, status);
  }
});
