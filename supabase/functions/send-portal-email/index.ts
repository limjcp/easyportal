import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  certificateResendEmail,
  loginDetailsEmail,
  vendorInviteEmail,
} from "../_shared/emailTemplates.ts";
import { generateTempPassword, getPortalAppUrl, sendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SendPortalEmailPayload =
  | { type: "employee_login_details"; membershipId: string }
  | { type: "building_admin_login_details"; membershipId: string }
  | { type: "vendor_invite"; vendorId: string; email: string }
  | { type: "certificate_resend"; certificateId: string };

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
}) {
  const temporaryPassword = generateTempPassword();
  const { error: updateError } = await input.adminClient.auth.admin.updateUserById(input.profileId, {
    password: temporaryPassword,
  });
  if (updateError) {
    throw new Error(updateError.message);
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
  if (!(await hasCompanyAccess(adminClient, callerId, companyId, isSuperAdmin))) {
    throw new Error("Not allowed to invite vendors for this company.");
  }

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
    vendorName: (vendor.contact_name as string)?.trim() || "",
  });

  await sendEmail({
    to: inviteEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return { email: inviteEmail, message: `Invitation sent to ${inviteEmail}.` };
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
