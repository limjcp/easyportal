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

export async function ensureActiveBuildingForUser(userId: string): Promise<string> {
  const occupancyBuildingIds = await resolveOccupancyBuildingIdsForUser(userId);

  if (activeBuildingId && occupancyBuildingIds.includes(activeBuildingId)) {
    return activeBuildingId;
  }

  const buildingId = occupancyBuildingIds[0] ?? null;
  if (!buildingId) {
    throw new Error("No building assigned to this account.");
  }

  activeBuildingId = buildingId;
  return buildingId;
}
