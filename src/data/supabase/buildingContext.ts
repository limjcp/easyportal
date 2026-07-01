import { requireSupabase } from "../../lib/supabaseClient";

let activeBuildingId: string | null = null;
let activeCompanyId: string | null = null;

export function setActiveBuildingId(id: string | null) {
  activeBuildingId = id;
}

export function setActiveCompanyId(id: string | null) {
  activeCompanyId = id;
}

export function getActiveBuildingId(): string | null {
  return activeBuildingId;
}

export function getActiveCompanyId(): string | null {
  return activeCompanyId;
}

export function requireActiveBuildingId(): string {
  if (!activeBuildingId) {
    throw new Error("No active building selected. Open a building from the company portal first.");
  }
  return activeBuildingId;
}

export function requireActiveCompanyId(): string {
  if (!activeCompanyId) {
    throw new Error("No active company context. Sign in as a company user first.");
  }
  return activeCompanyId;
}

export async function resolveOccupancyBuildingIdsForUser(userId: string): Promise<string[]> {
  const { data, error } = await requireSupabase()
    .from("unit_occupancies")
    .select("building_id, account_status")
    .eq("profile_id", userId)
    .is("archived_at", null);
  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  const activated = data
    .filter((row) => row.account_status === "Activated" && row.building_id)
    .map((row) => row.building_id as string);
  const other = data
    .filter((row) => row.account_status !== "Activated" && row.building_id)
    .map((row) => row.building_id as string);
  return [...new Set([...activated, ...other])];
}

export async function resolvePrimaryBuildingIdForUser(userId: string): Promise<string | null> {
  const buildingIds = await resolveOccupancyBuildingIdsForUser(userId);
  return buildingIds[0] ?? null;
}

async function userHasBuildingPortalAccess(userId: string, buildingId: string): Promise<boolean> {
  const client = requireSupabase();

  const { data: profile } = await client
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.is_super_admin) return true;

  const { data: building } = await client
    .from("buildings")
    .select("company_id")
    .eq("id", buildingId)
    .maybeSingle();
  if (!building) return false;

  const [{ data: occupancy }, { data: staffMembership }, { data: companyMemberships }] =
    await Promise.all([
      client
        .from("unit_occupancies")
        .select("id")
        .eq("profile_id", userId)
        .eq("building_id", buildingId)
        .is("archived_at", null)
        .maybeSingle(),
      client
        .from("building_memberships")
        .select("id")
        .eq("profile_id", userId)
        .eq("building_id", buildingId)
        .eq("status", "active")
        .maybeSingle(),
      client.from("company_memberships").select("id, role, company_id").eq("profile_id", userId),
    ]);

  if (occupancy || staffMembership) return true;

  const companyMembership = companyMemberships?.find(
    (row) => row.company_id === building.company_id
  );
  if (!companyMembership) return false;

  const { data: assignments } = await client
    .from("company_member_buildings")
    .select("building_id")
    .eq("membership_id", companyMembership.id as string);

  const assignedIds = (assignments ?? []).map((row) => row.building_id as string);
  const isOwnerOrAdmin =
    companyMembership.role === "Company Owner" ||
    companyMembership.role === "Company Administrator";

  if (assignedIds.length === 0 && isOwnerOrAdmin) return true;
  return assignedIds.includes(buildingId);
}

export async function ensureActiveBuildingForUser(userId: string): Promise<string> {
  const occupancyBuildingIds = await resolveOccupancyBuildingIdsForUser(userId);

  if (activeBuildingId) {
    if (occupancyBuildingIds.includes(activeBuildingId)) {
      return activeBuildingId;
    }
    if (await userHasBuildingPortalAccess(userId, activeBuildingId)) {
      return activeBuildingId;
    }
  }

  const occupancyBuildingId = occupancyBuildingIds[0] ?? null;
  if (occupancyBuildingId) {
    activeBuildingId = occupancyBuildingId;
    return occupancyBuildingId;
  }

  if (activeBuildingId && (await userHasBuildingPortalAccess(userId, activeBuildingId))) {
    return activeBuildingId;
  }

  throw new Error("No building assigned to this account.");
}
