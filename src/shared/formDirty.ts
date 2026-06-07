import type {
  ResidentProfileDetails,
  UnitsUsersUnitDetail,
  UnitsUsersUserDetail,
} from "../resident/data/types";

type ModulePermissionRow = { moduleId?: string; moduleKey?: string; enabled: boolean };

function profileDetailsEqual(
  left: ResidentProfileDetails | undefined,
  right: ResidentProfileDetails | undefined
): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export function modulesPermissionDirty(
  baseline: ModulePermissionRow[] | undefined,
  draft: ModulePermissionRow[] | undefined
): boolean {
  const a = baseline ?? [];
  const b = draft ?? [];
  if (a.length !== b.length) return true;
  const key = (row: ModulePermissionRow) => row.moduleId ?? row.moduleKey ?? "";
  const mapA = new Map(a.map((row) => [key(row), row.enabled]));
  return b.some((row) => mapA.get(key(row)) !== row.enabled);
}

export function userDetailDirty(
  baseline: UnitsUsersUserDetail | null,
  draft: UnitsUsersUserDetail | null
): boolean {
  if (!baseline || !draft) return false;

  const scalarEqual =
    baseline.firstName === draft.firstName &&
    baseline.lastName === draft.lastName &&
    baseline.email === draft.email &&
    baseline.timezone === draft.timezone &&
    baseline.type === draft.type &&
    (baseline.buzzerCode ?? "") === (draft.buzzerCode ?? "") &&
    (baseline.homePhone ?? "") === (draft.homePhone ?? "") &&
    (baseline.mobilePhone ?? "") === (draft.mobilePhone ?? "") &&
    (baseline.businessPhone ?? "") === (draft.businessPhone ?? "") &&
    (baseline.canAccessResidentPortal ?? true) === (draft.canAccessResidentPortal ?? true) &&
    (baseline.canAccessBuildingAdmin ?? false) === (draft.canAccessBuildingAdmin ?? false) &&
    (baseline.buildingAdminRoleLabel ?? "Resident (Admin)") ===
      (draft.buildingAdminRoleLabel ?? "Resident (Admin)");

  if (!scalarEqual) return true;

  const listEqual = (left: string[] | undefined, right: string[] | undefined) =>
    JSON.stringify(left ?? []) === JSON.stringify(right ?? []);

  if (
    !listEqual(baseline.parkingSpots, draft.parkingSpots) ||
    !listEqual(baseline.lockers, draft.lockers) ||
    !listEqual(baseline.bikeSpaces, draft.bikeSpaces) ||
    !listEqual(baseline.guestList, draft.guestList) ||
    (baseline.purchaseDateMaintFees ?? "") !== (draft.purchaseDateMaintFees ?? "")
  ) {
    return true;
  }

  if (!profileDetailsEqual(baseline.profileDetails, draft.profileDetails)) return true;

  if (modulesPermissionDirty(baseline.portalModules, draft.portalModules)) return true;
  if (modulesPermissionDirty(baseline.buildingAdminModules, draft.buildingAdminModules)) return true;

  return false;
}

export function unitDetailDirty(
  baseline: UnitsUsersUnitDetail | null,
  draft: UnitsUsersUnitDetail | null
): boolean {
  if (!baseline || !draft) return false;

  const listEqual = (left: string[] | undefined, right: string[] | undefined) =>
    JSON.stringify(left ?? []) === JSON.stringify(right ?? []);

  if (
    !listEqual(baseline.parkingSpots, draft.parkingSpots) ||
    !listEqual(baseline.lockers, draft.lockers) ||
    !listEqual(baseline.bikeSpaces, draft.bikeSpaces) ||
    (baseline.purchaseDateMaintFees ?? "") !== (draft.purchaseDateMaintFees ?? "")
  ) {
    return true;
  }

  if (!profileDetailsEqual(baseline.profileDetails, draft.profileDetails)) return true;

  return false;
}

export function portalModulesSnapshot(
  modules: Array<{ moduleId: string; enabled: boolean }> | undefined
): string {
  return JSON.stringify(
    (modules ?? []).map((module) => ({ moduleId: module.moduleId, enabled: module.enabled }))
  );
}
