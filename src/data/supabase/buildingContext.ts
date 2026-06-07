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

export async function resolvePrimaryBuildingIdForUser(userId: string): Promise<string | null> {
  const { data, error } = await requireSupabase()
    .from("unit_occupancies")
    .select("building_id, account_status")
    .eq("profile_id", userId)
    .is("archived_at", null);
  if (error) throw new Error(error.message);
  if (!data?.length) return null;

  const activated = data.find((row) => row.account_status === "Activated");
  if (activated?.building_id) return activated.building_id as string;
  return (data[0].building_id as string) ?? null;
}

export async function ensureActiveBuildingForUser(userId: string): Promise<string> {
  if (activeBuildingId) return activeBuildingId;

  const buildingId = await resolvePrimaryBuildingIdForUser(userId);
  if (!buildingId) {
    throw new Error("No building assigned to this account.");
  }

  activeBuildingId = buildingId;
  return buildingId;
}
