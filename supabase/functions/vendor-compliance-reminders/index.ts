import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  vendorComplianceExpiredEmail,
  vendorComplianceExpiringSoonEmail,
} from "../_shared/emailTemplates.ts";
import { getPortalAppUrl, sendEmail } from "../_shared/resend.ts";
import {
  addDaysIso,
  documentLabel,
  namesLooselyMatch,
  normalizeUnitForMatch,
  todayIsoDate,
} from "../_shared/vendorCompliance.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXPIRING_SOON_DAYS = 7;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getPmEmails(adminClient: SupabaseClient, buildingIds: string[]): Promise<string[]> {
  if (buildingIds.length === 0) return [];

  const { data: assignments } = await adminClient
    .from("company_member_buildings")
    .select("membership_id, building_id")
    .in("building_id", buildingIds);

  const membershipIds = Array.from(
    new Set((assignments ?? []).map((row) => row.membership_id as string))
  );
  if (membershipIds.length === 0) return [];

  const { data: memberships } = await adminClient
    .from("company_memberships")
    .select("profile:profiles(email)")
    .in("id", membershipIds);

  const emails = new Set<string>();
  for (const row of memberships ?? []) {
    const email = (row.profile as { email?: string } | null)?.email?.trim();
    if (email) emails.add(email);
  }
  return Array.from(emails);
}

async function getBoardEmails(adminClient: SupabaseClient, buildingIds: string[]): Promise<string[]> {
  if (buildingIds.length === 0) return [];
  const emails = new Set<string>();

  for (const buildingId of buildingIds) {
    const { data: boardMembers } = await adminClient
      .from("board_members")
      .select("name, unit")
      .eq("building_id", buildingId);

    const { data: occupancies } = await adminClient
      .from("unit_occupancies")
      .select("resident_name, email, profile:profiles(email), unit:units(label)")
      .eq("building_id", buildingId)
      .is("archived_at", null);

    for (const member of boardMembers ?? []) {
      const memberUnit = normalizeUnitForMatch(member.unit as string);
      const memberName = member.name as string;
      for (const occ of occupancies ?? []) {
        const unitLabel = (occ.unit as { label?: string } | null)?.label ?? "";
        if (normalizeUnitForMatch(unitLabel) !== memberUnit) continue;
        if (!namesLooselyMatch(memberName, occ.resident_name as string)) continue;
        const profileEmail = (occ.profile as { email?: string } | null)?.email?.trim();
        const occEmail = (occ.email as string)?.trim();
        const resolved = profileEmail || occEmail;
        if (resolved) emails.add(resolved);
      }
    }
  }

  return Array.from(emails);
}

async function getVendorBuildingIds(
  adminClient: SupabaseClient,
  vendorId: string
): Promise<string[]> {
  const { data } = await adminClient
    .from("vendor_buildings")
    .select("building_id")
    .eq("vendor_id", vendorId);
  return (data ?? []).map((row) => row.building_id as string);
}

async function reminderAlreadySent(
  adminClient: SupabaseClient,
  documentId: string,
  reminderType: "expiring_soon" | "expired"
): Promise<boolean> {
  const { data } = await adminClient
    .from("vendor_compliance_reminder_log")
    .select("id")
    .eq("document_id", documentId)
    .eq("reminder_type", reminderType)
    .maybeSingle();
  return Boolean(data);
}

async function logReminder(
  adminClient: SupabaseClient,
  vendorId: string,
  documentId: string,
  reminderType: "expiring_soon" | "expired",
  recipientEmails: string[]
): Promise<void> {
  await adminClient.from("vendor_compliance_reminder_log").insert({
    vendor_id: vendorId,
    document_id: documentId,
    reminder_type: reminderType,
    recipient_emails: recipientEmails,
  });
}

async function insertVendorNotification(
  adminClient: SupabaseClient,
  vendorId: string,
  notificationType: "compliance_expiring" | "compliance_expired",
  message: string
): Promise<void> {
  await adminClient.from("vendor_notifications").insert({
    vendor_id: vendorId,
    notification_type: notificationType,
    message,
    read: false,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const cronSecret = Deno.env.get("CRON_SECRET")?.trim();
    if (!cronSecret) {
      return jsonResponse({ error: "CRON_SECRET is not configured." }, 500);
    }
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const today = todayIsoDate();
    const expiringSoonDate = addDaysIso(today, EXPIRING_SOON_DAYS);
    const portalUrl = `${getPortalAppUrl()}/vendor`;

    const { data: vendors, error: vendorsError } = await adminClient
      .from("vendors")
      .select("id, company_name, email, wsib_required")
      .eq("status", "active");
    if (vendorsError) throw vendorsError;

    let expiringSoonSent = 0;
    let expiredSent = 0;

    for (const vendor of vendors ?? []) {
      const vendorId = vendor.id as string;
      const wsibRequired = (vendor.wsib_required as boolean) ?? true;
      const buildingIds = await getVendorBuildingIds(adminClient, vendorId);

      const { data: documents } = await adminClient
        .from("vendor_compliance_documents")
        .select("*")
        .eq("vendor_id", vendorId)
        .is("superseded_at", null);

      for (const doc of documents ?? []) {
        const documentType = doc.document_type as string;
        if (documentType === "wsib" && !wsibRequired) continue;

        const expiryDate = doc.expiry_date as string;
        const label = documentLabel(documentType);
        const documentId = doc.id as string;
        const vendorEmail = (vendor.email as string)?.trim();

        if (expiryDate === expiringSoonDate && vendorEmail) {
          if (await reminderAlreadySent(adminClient, documentId, "expiring_soon")) continue;

          const template = vendorComplianceExpiringSoonEmail({
            vendorCompanyName: vendor.company_name as string,
            documentLabel: label,
            expiryDate,
            portalUrl,
            audience: "vendor",
          });

          await sendEmail({ to: vendorEmail, ...template });
          await logReminder(adminClient, vendorId, documentId, "expiring_soon", [vendorEmail]);
          await insertVendorNotification(
            adminClient,
            vendorId,
            "compliance_expiring",
            `Your ${label.toLowerCase()} expires on ${expiryDate}. Please upload an updated certificate.`
          );
          expiringSoonSent += 1;
        }

        if (expiryDate < today) {
          if (await reminderAlreadySent(adminClient, documentId, "expired")) continue;

          const recipients = new Set<string>();
          if (vendorEmail) recipients.add(vendorEmail);

          const pmEmails = await getPmEmails(adminClient, buildingIds);
          const boardEmails = await getBoardEmails(adminClient, buildingIds);
          for (const email of [...pmEmails, ...boardEmails]) recipients.add(email);

          if (recipients.size === 0) continue;

          for (const email of recipients) {
            const audience = email === vendorEmail ? "vendor" : "stakeholder";
            const template = vendorComplianceExpiredEmail({
              vendorCompanyName: vendor.company_name as string,
              documentLabel: label,
              expiryDate,
              portalUrl,
              audience,
            });
            await sendEmail({ to: email, ...template });
          }

          await logReminder(
            adminClient,
            vendorId,
            documentId,
            "expired",
            Array.from(recipients)
          );
          await insertVendorNotification(
            adminClient,
            vendorId,
            "compliance_expired",
            `Your ${label.toLowerCase()} expired on ${expiryDate}. Upload a new certificate immediately.`
          );
          expiredSent += 1;
        }
      }
    }

    return jsonResponse({
      ok: true,
      today,
      expiringSoonSent,
      expiredSent,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Reminder job failed." },
      500
    );
  }
});
