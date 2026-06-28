import type {
  AdminUser,
  ProfileCompletionPolicy,
  ProfileFieldOption,
  ResidentDetailSection,
  ResidentProfileDetails,
  UnitsUsersUnitDetail,
  UnitsUsersUserDetail,
  UpdateAdminUserInput,
} from "../resident/data/types";

type ModulePermissionRow = { moduleId?: string; moduleKey?: string; enabled: boolean };

const PROFILE_DETAIL_SECTIONS: ResidentDetailSection[] = [
  "parkingSpots",
  "lockers",
  "bikeSpaces",
  "keyFobs",
  "vehicles",
  "guestList",
  "pets",
  "purchaseDateMaintFees",
];

function jsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function profileDetailsEqual(
  left: ResidentProfileDetails | undefined,
  right: ResidentProfileDetails | undefined
): boolean {
  return jsonEqual(left, right);
}

export function changedProfileSections(
  baseline: ResidentProfileDetails | undefined,
  draft: ResidentProfileDetails | undefined
): ResidentDetailSection[] {
  if (!draft) return [];
  return PROFILE_DETAIL_SECTIONS.filter(
    (section) => !jsonEqual(baseline?.[section], draft[section])
  );
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

export type UserDetailScalarPatch = Partial<
  Pick<
    UnitsUsersUserDetail,
    | "firstName"
    | "lastName"
    | "email"
    | "timezone"
    | "type"
    | "buzzerCode"
    | "homePhone"
    | "mobilePhone"
    | "businessPhone"
    | "canAccessResidentPortal"
    | "canAccessBuildingAdmin"
    | "buildingAdminRoleLabel"
  >
>;

export type UserDetailSavePlan = {
  scalar: UserDetailScalarPatch;
  changedProfileSections: ResidentDetailSection[];
  portalModulesChanged: boolean;
  buildingAdminModulesChanged: boolean;
};

export function buildUserDetailSavePlan(
  baseline: UnitsUsersUserDetail | null,
  draft: UnitsUsersUserDetail | null
): UserDetailSavePlan | null {
  if (!baseline || !draft) return null;

  const scalar: UserDetailScalarPatch = {};
  const nameChanged =
    baseline.firstName !== draft.firstName || baseline.lastName !== draft.lastName;
  if (nameChanged) {
    scalar.firstName = draft.firstName;
    scalar.lastName = draft.lastName;
  }
  if (baseline.email !== draft.email) scalar.email = draft.email;
  if (baseline.timezone !== draft.timezone) scalar.timezone = draft.timezone;
  if (baseline.type !== draft.type) scalar.type = draft.type;
  if ((baseline.buzzerCode ?? "") !== (draft.buzzerCode ?? "")) scalar.buzzerCode = draft.buzzerCode ?? "";
  if ((baseline.homePhone ?? "") !== (draft.homePhone ?? "")) scalar.homePhone = draft.homePhone ?? "";
  if ((baseline.mobilePhone ?? "") !== (draft.mobilePhone ?? "")) scalar.mobilePhone = draft.mobilePhone ?? "";
  if ((baseline.businessPhone ?? "") !== (draft.businessPhone ?? "")) {
    scalar.businessPhone = draft.businessPhone ?? "";
  }
  if ((baseline.canAccessResidentPortal ?? true) !== (draft.canAccessResidentPortal ?? true)) {
    scalar.canAccessResidentPortal = draft.canAccessResidentPortal ?? true;
  }
  if ((baseline.canAccessBuildingAdmin ?? false) !== (draft.canAccessBuildingAdmin ?? false)) {
    scalar.canAccessBuildingAdmin = draft.canAccessBuildingAdmin ?? false;
  }
  if (
    (baseline.buildingAdminRoleLabel ?? "Resident (Admin)") !==
    (draft.buildingAdminRoleLabel ?? "Resident (Admin)")
  ) {
    scalar.buildingAdminRoleLabel = draft.buildingAdminRoleLabel ?? "Resident (Admin)";
  }

  return {
    scalar,
    changedProfileSections: changedProfileSections(baseline.profileDetails, draft.profileDetails),
    portalModulesChanged: modulesPermissionDirty(baseline.portalModules, draft.portalModules),
    buildingAdminModulesChanged: modulesPermissionDirty(
      baseline.buildingAdminModules,
      draft.buildingAdminModules
    ),
  };
}

export function userDetailSavePlanHasChanges(plan: UserDetailSavePlan): boolean {
  return (
    Object.keys(plan.scalar).length > 0 ||
    plan.changedProfileSections.length > 0 ||
    plan.portalModulesChanged ||
    plan.buildingAdminModulesChanged
  );
}

export function userDetailListFieldsChanged(
  baseline: UnitsUsersUserDetail | null,
  draft: UnitsUsersUserDetail | null
): boolean {
  if (!baseline || !draft) return false;
  const listEqual = (left: string[] | undefined, right: string[] | undefined) =>
    jsonEqual(left ?? [], right ?? []);
  return (
    !listEqual(baseline.parkingSpots, draft.parkingSpots) ||
    !listEqual(baseline.lockers, draft.lockers) ||
    !listEqual(baseline.bikeSpaces, draft.bikeSpaces) ||
    !listEqual(baseline.guestList, draft.guestList) ||
    (baseline.purchaseDateMaintFees ?? "") !== (draft.purchaseDateMaintFees ?? "")
  );
}

export type UnitDetailSavePlan = {
  parkingSpotsChanged: boolean;
  lockersChanged: boolean;
  bikeSpacesChanged: boolean;
  changedProfileSections: ResidentDetailSection[];
};

export function buildUnitDetailSavePlan(
  baseline: UnitsUsersUnitDetail | null,
  draft: UnitsUsersUnitDetail | null
): UnitDetailSavePlan | null {
  if (!baseline || !draft) return null;
  const listEqual = (left: string[] | undefined, right: string[] | undefined) =>
    jsonEqual(left ?? [], right ?? []);

  return {
    parkingSpotsChanged: !listEqual(baseline.parkingSpots, draft.parkingSpots),
    lockersChanged: !listEqual(baseline.lockers, draft.lockers),
    bikeSpacesChanged: !listEqual(baseline.bikeSpaces, draft.bikeSpaces),
    changedProfileSections: changedProfileSections(baseline.profileDetails, draft.profileDetails),
  };
}

export function unitDetailSavePlanHasChanges(plan: UnitDetailSavePlan): boolean {
  return (
    plan.parkingSpotsChanged ||
    plan.lockersChanged ||
    plan.bikeSpacesChanged ||
    plan.changedProfileSections.length > 0
  );
}

export function buildAdminUserUpdates(
  baseline: AdminUser,
  draft: UpdateAdminUserInput
): Partial<UpdateAdminUserInput> {
  const updates: Partial<UpdateAdminUserInput> = {};
  if (baseline.firstName !== draft.firstName) updates.firstName = draft.firstName;
  if (baseline.lastName !== draft.lastName) updates.lastName = draft.lastName;
  if (baseline.email !== draft.email) updates.email = draft.email;
  if (baseline.timezone !== draft.timezone) updates.timezone = draft.timezone;
  if ((baseline.telHome ?? "") !== (draft.telHome ?? "")) updates.telHome = draft.telHome ?? "";
  if ((baseline.telMobile ?? "") !== (draft.telMobile ?? "")) updates.telMobile = draft.telMobile ?? "";
  if ((baseline.telBusiness ?? "") !== (draft.telBusiness ?? "")) {
    updates.telBusiness = draft.telBusiness ?? "";
  }
  if ((baseline.avatarUrl ?? "") !== (draft.avatarUrl ?? "")) updates.avatarUrl = draft.avatarUrl;
  return updates;
}

export function profileCompletionPolicyDirty(
  baseline: ProfileCompletionPolicy,
  draft: ProfileCompletionPolicy
): boolean {
  return !jsonEqual(baseline, draft);
}

export function changedProfileFieldOptions(
  baseline: ProfileFieldOption[],
  draft: ProfileFieldOption[]
): ProfileFieldOption[] {
  const baselineByKey = new Map(baseline.map((field) => [field.fieldKey, field]));
  return draft.filter((field) => {
    const previous = baselineByKey.get(field.fieldKey);
    if (!previous) return true;
    return (
      previous.show !== field.show ||
      previous.editable !== field.editable ||
      (previous.requiredForCompletion ?? false) !== (field.requiredForCompletion ?? false)
    );
  });
}

export function employeePermissionsDirty(
  baseline: Array<{
    moduleKey: string;
    create: boolean;
    view: boolean;
    edit: boolean;
    delete: boolean;
    archive: boolean;
  }>,
  draft: Array<{
    moduleKey: string;
    create: boolean;
    view: boolean;
    edit: boolean;
    delete: boolean;
    archive: boolean;
  }>
): boolean {
  if (baseline.length !== draft.length) return true;
  const baselineByKey = new Map(baseline.map((row) => [row.moduleKey, row]));
  return draft.some((row) => {
    const previous = baselineByKey.get(row.moduleKey);
    if (!previous) return true;
    return (
      previous.create !== row.create ||
      previous.view !== row.view ||
      previous.edit !== row.edit ||
      previous.delete !== row.delete ||
      previous.archive !== row.archive
    );
  });
}
