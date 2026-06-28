import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const COMPANY_ADMIN_CC_TYPES = new Set([
  "Company Owner",
  "Company Administrator",
  "Company Accountant",
]);

const BUILDING_ADMIN_CC_TYPES = new Set([
  "Property Manager",
  "Property Administrator",
  "Board Member",
  "Resident (Admin)",
  "Concierge",
  "Gatehouse Keeper",
  "Superintendent",
  "Other",
]);

export type NewsNoticeRecipient = {
  email: string;
  profileId: string | null;
  residentName: string;
  unitLabel: string;
};

function normalizeResidentTypeLabel(label: string): string {
  const map: Record<string, string> = {
    "Absentee Owners": "Absentee Owner",
    Owners: "Owner",
    Tenants: "Tenant",
    Occupants: "Occupant",
    "Unit Managers": "Unit Manager",
  };
  return map[label] ?? label;
}

function residentTypeMatches(selectedTypes: string[], dbType: string): boolean {
  if (selectedTypes.length === 0) return false;
  const normalizedSelected = new Set(selectedTypes.map(normalizeResidentTypeLabel));
  return normalizedSelected.has(dbType);
}

function buildingRoleMatches(selectedCcTypes: string[], roleLabel: string): boolean {
  if (selectedCcTypes.length === 0) return false;
  for (const selected of selectedCcTypes) {
    if (selected === "Board Member" && roleLabel.startsWith("Board Member")) return true;
    if (selected === "Other") {
      const isKnown =
        roleLabel.startsWith("Board Member") ||
        [...BUILDING_ADMIN_CC_TYPES, ...COMPANY_ADMIN_CC_TYPES].some(
          (known) => known !== "Other" && known !== "Board Member" && roleLabel === known
        );
      if (!isKnown) return true;
      continue;
    }
    if (roleLabel === selected) return true;
  }
  return false;
}

export async function resolveNewsNoticeResidents(
  adminClient: SupabaseClient,
  buildingId: string,
  selectedResidentTypes: string[]
): Promise<NewsNoticeRecipient[]> {
  const { data, error } = await adminClient
    .from("unit_occupancies")
    .select("id, profile_id, resident_name, email, resident_type, account_status, unit:units(label)")
    .eq("building_id", buildingId)
    .eq("account_status", "Activated")
    .is("archived_at", null);
  if (error) throw error;

  const recipients: NewsNoticeRecipient[] = [];
  const seenEmails = new Set<string>();

  for (const row of data ?? []) {
    const residentType = row.resident_type as string;
    if (!residentTypeMatches(selectedResidentTypes, residentType)) continue;

    const email = (row.email as string | null)?.trim().toLowerCase();
    if (!email || seenEmails.has(email)) continue;

    seenEmails.add(email);
    recipients.push({
      email,
      profileId: (row.profile_id as string | null) ?? null,
      residentName: (row.resident_name as string)?.trim() || email,
      unitLabel: (row.unit as { label?: string } | null)?.label?.trim() || "—",
    });
  }

  return recipients;
}

async function companyMemberHasBuildingAccess(
  adminClient: SupabaseClient,
  membershipId: string,
  companyId: string,
  role: string,
  buildingId: string
): Promise<boolean> {
  const isOwnerOrAdmin = role === "Company Owner" || role === "Company Administrator";
  const { data: assignments, error: assignmentsError } = await adminClient
    .from("company_member_buildings")
    .select("building_id")
    .eq("membership_id", membershipId);
  if (assignmentsError) throw assignmentsError;

  const assignedIds = (assignments ?? []).map((row) => row.building_id as string);
  if (assignedIds.length === 0 && isOwnerOrAdmin) {
    const { data: building, error: buildingError } = await adminClient
      .from("buildings")
      .select("company_id")
      .eq("id", buildingId)
      .maybeSingle();
    if (buildingError) throw buildingError;
    return building?.company_id === companyId;
  }

  return assignedIds.includes(buildingId);
}

export async function resolveNewsNoticeAdminCcEmails(
  adminClient: SupabaseClient,
  buildingId: string,
  selectedAdminCcTypes: string[]
): Promise<string[]> {
  if (selectedAdminCcTypes.length === 0) return [];

  const selectedCompanyTypes = selectedAdminCcTypes.filter((type) => COMPANY_ADMIN_CC_TYPES.has(type));
  const selectedBuildingTypes = selectedAdminCcTypes.filter((type) => BUILDING_ADMIN_CC_TYPES.has(type));

  const emails = new Set<string>();

  if (selectedBuildingTypes.length > 0) {
    const { data: memberships, error } = await adminClient
      .from("building_memberships")
      .select("role_label, profile:profiles(email)")
      .eq("building_id", buildingId)
      .eq("status", "active");
    if (error) throw error;

    for (const row of memberships ?? []) {
      const roleLabel = (row.role_label as string)?.trim() ?? "";
      if (!buildingRoleMatches(selectedBuildingTypes, roleLabel)) continue;
      const email = (row.profile as { email?: string } | null)?.email?.trim().toLowerCase();
      if (email) emails.add(email);
    }
  }

  if (selectedCompanyTypes.length > 0) {
    const { data: building, error: buildingError } = await adminClient
      .from("buildings")
      .select("company_id")
      .eq("id", buildingId)
      .maybeSingle();
    if (buildingError) throw buildingError;
    const companyId = building?.company_id as string | undefined;
    if (!companyId) return Array.from(emails);

    const { data: memberships, error } = await adminClient
      .from("company_memberships")
      .select("id, role, profile:profiles(email)")
      .eq("company_id", companyId)
      .in("role", selectedCompanyTypes);
    if (error) throw error;

    for (const row of memberships ?? []) {
      const role = row.role as string;
      const membershipId = row.id as string;
      const hasAccess = await companyMemberHasBuildingAccess(
        adminClient,
        membershipId,
        companyId,
        role,
        buildingId
      );
      if (!hasAccess) continue;
      const email = (row.profile as { email?: string } | null)?.email?.trim().toLowerCase();
      if (email) emails.add(email);
    }
  }

  return Array.from(emails);
}
