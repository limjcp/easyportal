import type {
  ProfileCompletionPolicy,
  ProfileFieldOption,
  ResidentProfileDetails,
  UnitsUsersResidentType,
} from "../../resident/data/types";
import { mapDbError, nowIso, sb } from "./base";
import { ensureActiveBuildingForUser } from "./buildingContext";
import { getFieldDef } from "./profileCompletionFields";
import { resolveProfileFieldOptions } from "./profileFieldOptions";
import { loadOccupancyProfileDetails } from "./occupancyProfileDetails";

export type ProfileCompletionPhase = "none" | "soft" | "hard";

export type ProfileCompletionStatus = {
  phase: ProfileCompletionPhase;
  missingFields: { fieldKey: string; label: string }[];
  loginCount: number;
  policyEnabled: boolean;
  appliesToUser: boolean;
};

type ProfileRow = {
  first_name: string;
  last_name: string;
  email: string;
  timezone: string;
  tel_home: string | null;
  tel_mobile: string | null;
  tel_business: string | null;
  birth_month: number | null;
  birth_day: number | null;
};

export function isProfileFieldComplete(
  fieldKey: string,
  profile: ProfileRow,
  details: ResidentProfileDetails
): boolean {
  switch (fieldKey) {
    case "firstName":
      return profile.first_name.trim().length > 0;
    case "lastName":
      return profile.last_name.trim().length > 0;
    case "email":
      return profile.email.trim().length > 0;
    case "timezone":
      return profile.timezone.trim().length > 0;
    case "homePhone":
      return Boolean(profile.tel_home?.trim());
    case "cellPhone":
      return Boolean(profile.tel_mobile?.trim());
    case "workPhone":
      return Boolean(profile.tel_business?.trim());
    case "birthday":
      return profile.birth_month != null && profile.birth_day != null;
    case "vehicles":
      return details.vehicles.some((v) => v.make.trim() && v.plate.trim());
    case "pets":
      return details.pets.some((p) => p.name.trim() && p.type.trim());
    case "guestList":
    case "emergency":
      return details.guestList.some((g) => g.name.trim() && g.phone.trim());
    case "parkingSpots":
      return details.parkingSpots.some((s) => s.trim());
    case "lockers":
      return details.lockers.some((s) => s.trim());
    case "keyFobs":
      return details.keyFobs.some((f) => f.fobNumber.trim());
    case "bikeSpaces":
      return details.bikeSpaces.some((s) => s.trim());
    case "purchaseDateMaintFees":
      return Boolean(details.purchaseDateMaintFees.purchaseDate?.trim());
    default:
      return true;
  }
}

export function resolveProfileCompletionStatus(input: {
  policy: ProfileCompletionPolicy;
  residentType: string;
  loginCount: number;
  profileCompletedAt: string | null;
  requiredFields: ProfileFieldOption[];
  profile: ProfileRow;
  details: ResidentProfileDetails;
}): ProfileCompletionStatus {
  const appliesToUser =
    input.policy.enabled && input.policy.residentTypes.includes(input.residentType as UnitsUsersResidentType);

  const required = input.requiredFields.filter(
    (f) => f.requiredForCompletion && f.show && f.editable && getFieldDef(f.fieldKey)?.completable
  );

  const missingFields = required
    .filter((f) => !isProfileFieldComplete(f.fieldKey, input.profile, input.details))
    .map((f) => ({ fieldKey: f.fieldKey, label: f.label }));

  if (!appliesToUser || missingFields.length === 0) {
    return {
      phase: "none",
      missingFields: [],
      loginCount: input.loginCount,
      policyEnabled: input.policy.enabled,
      appliesToUser,
    };
  }

  const phase: ProfileCompletionPhase =
    input.loginCount >= input.policy.blockLoginCount ? "hard" : "soft";

  return {
    phase,
    missingFields,
    loginCount: input.loginCount,
    policyEnabled: input.policy.enabled,
    appliesToUser,
  };
}

export function profileCompletionBlocksPortal(status: ProfileCompletionStatus): boolean {
  return status.phase === "hard";
}

export async function incrementProfileCompletionLoginCount(
  occupancyId: string,
  buildingId: string
): Promise<number> {
  const { data: row, error: readError } = await sb()
    .from("unit_occupancies")
    .select("profile_completion_login_count")
    .eq("id", occupancyId)
    .eq("building_id", buildingId)
    .single();
  mapDbError(readError);

  const nextCount = (row.profile_completion_login_count ?? 0) + 1;
  const { data, error } = await sb()
    .from("unit_occupancies")
    .update({ profile_completion_login_count: nextCount })
    .eq("id", occupancyId)
    .eq("building_id", buildingId)
    .select("profile_completion_login_count")
    .single();
  mapDbError(error);
  return data.profile_completion_login_count;
}

export async function markProfileCompleted(occupancyId: string, buildingId: string): Promise<void> {
  const { error } = await sb()
    .from("unit_occupancies")
    .update({ profile_completed_at: nowIso() })
    .eq("id", occupancyId)
    .eq("building_id", buildingId);
  mapDbError(error);
}

export async function clearProfileCompletedIfIncomplete(
  occupancyId: string,
  buildingId: string,
  incomplete: boolean
): Promise<void> {
  if (!incomplete) return;
  const { error } = await sb()
    .from("unit_occupancies")
    .update({ profile_completed_at: null })
    .eq("id", occupancyId)
    .eq("building_id", buildingId);
  mapDbError(error);
}

async function loadProfileCompletionPolicy(buildingId: string): Promise<ProfileCompletionPolicy> {
  const { data, error } = await sb()
    .from("portal_settings")
    .select(
      "profile_completion_enabled, profile_completion_resident_types, profile_completion_soft_login_count, profile_completion_block_login_count"
    )
    .eq("building_id", buildingId)
    .maybeSingle();
  mapDbError(error);
  return {
    enabled: data?.profile_completion_enabled ?? false,
    residentTypes: (data?.profile_completion_resident_types ?? ["Owner", "Absentee Owner"]) as UnitsUsersResidentType[],
    softLoginCount: data?.profile_completion_soft_login_count ?? 2,
    blockLoginCount: data?.profile_completion_block_login_count ?? 3,
  };
}

async function loadProfileFieldOptions(buildingId: string): Promise<ProfileFieldOption[]> {
  const { data, error } = await sb()
    .from("profile_field_options")
    .select("*")
    .eq("building_id", buildingId);
  mapDbError(error);
  return resolveProfileFieldOptions(data ?? []);
}

export async function maybeIncrementProfileCompletionLogin(userId: string): Promise<void> {
  const buildingId = await ensureActiveBuildingForUser(userId);

  const { data: occupancy, error: occupancyError } = await sb()
    .from("unit_occupancies")
    .select("id, resident_type, profile_completion_login_count, profile_completed_at")
    .eq("profile_id", userId)
    .eq("building_id", buildingId)
    .is("archived_at", null)
    .maybeSingle();
  mapDbError(occupancyError);
  if (!occupancy) return;

  const [policy, requiredFields, profileResult, details] = await Promise.all([
    loadProfileCompletionPolicy(buildingId),
    loadProfileFieldOptions(buildingId),
    sb()
      .from("profiles")
      .select(
        "first_name, last_name, email, timezone, tel_home, tel_mobile, tel_business, birth_month, birth_day"
      )
      .eq("id", userId)
      .single(),
    loadOccupancyProfileDetails(occupancy.id as string, buildingId),
  ]);
  mapDbError(profileResult.error);
  if (!profileResult.data) return;

  const profile: ProfileRow = {
    first_name: profileResult.data.first_name ?? "",
    last_name: profileResult.data.last_name ?? "",
    email: profileResult.data.email ?? "",
    timezone: profileResult.data.timezone ?? "",
    tel_home: profileResult.data.tel_home,
    tel_mobile: profileResult.data.tel_mobile,
    tel_business: profileResult.data.tel_business,
    birth_month: profileResult.data.birth_month,
    birth_day: profileResult.data.birth_day,
  };

  const status = resolveProfileCompletionStatus({
    policy,
    residentType: occupancy.resident_type as string,
    loginCount: occupancy.profile_completion_login_count ?? 0,
    profileCompletedAt: occupancy.profile_completed_at as string | null,
    requiredFields,
    profile,
    details,
  });

  if (!status.appliesToUser || status.missingFields.length === 0) return;

  await incrementProfileCompletionLoginCount(occupancy.id as string, buildingId);
}
