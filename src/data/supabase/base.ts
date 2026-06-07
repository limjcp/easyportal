import { requireSupabase } from "../../lib/supabaseClient";
import { getActiveBuildingId, requireActiveBuildingId } from "./buildingContext";

export function sb() {
  return requireSupabase();
}

export function buildingIdOrThrow(): string {
  return requireActiveBuildingId();
}

export function buildingIdOrNull(): string | null {
  return getActiveBuildingId();
}

export function mapDbError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}
