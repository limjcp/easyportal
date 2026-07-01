import type { PortalModuleConfig } from "../../resident/data/types";
import type { UnitsUsersResidentType } from "../../resident/data/types";
import { createDefaultPermissionsForRole, PERMISSION_MODULES } from "../../company/data/permissions";
import {
  BUILDING_SIDEBAR_MODULES,
  createDefaultBuildingPermissionsForRole,
} from "../../admin/data/buildingPermissions";
import type { CompanyRole, PermissionModuleRow } from "../../resident/data/types";
import { mapDbError, sb } from "./base";
import { buildingIdOrThrow } from "./base";
import { DEFAULT_PORTAL_MODULES } from "../defaults/portalModules";

export type PermissionDbRow = {
  module_key: string;
  can_create: boolean;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_archive: boolean;
};

export function mapCompanyPermissionDbRows(
  dbRows: PermissionDbRow[],
  catalog: ReadonlyArray<{ moduleKey: string; label: string }> = PERMISSION_MODULES
): PermissionModuleRow[] {
  const byKey = new Map(dbRows.map((row) => [row.module_key, row]));
  return catalog.map((module) => {
    const row = byKey.get(module.moduleKey);
    return {
      moduleKey: module.moduleKey,
      label: module.label,
      create: row?.can_create ?? false,
      view: row?.can_view ?? false,
      edit: row?.can_edit ?? false,
      delete: row?.can_delete ?? false,
      archive: row?.can_archive ?? false,
    };
  });
}

export type ResidentPortalModulePermission = {
  moduleId: string;
  name: string;
  tileLabel: string;
  /** Effective visibility after type/occupancy merge (UI checkbox state). */
  enabled: boolean;
  /** Whether the module is enabled at building level in portal_modules. */
  buildingEnabled: boolean;
};

const BOARD_MODULES = new Set(["boardMember", "boardElections"]);
const OCCUPANT_RESTRICTED = new Set(["statusCerts", "boardMember", "boardElections"]);

export function defaultResidentTypeModuleEnabled(
  moduleId: string,
  residentType: UnitsUsersResidentType
): boolean {
  if (moduleId === "home") return true;
  if (residentType === "Occupant" && OCCUPANT_RESTRICTED.has(moduleId)) return false;
  if (residentType === "Unit Manager" && BOARD_MODULES.has(moduleId)) return false;
  return true;
}

function mapBuildingModule(row: Record<string, unknown>): ResidentPortalModulePermission {
  const buildingEnabled = row.enabled as boolean;
  return {
    moduleId: row.module_id as string,
    name: row.name as string,
    tileLabel: row.tile_label as string,
    enabled: buildingEnabled,
    buildingEnabled,
  };
}

export function mergeEffectivePortalModules(
  buildingModules: ResidentPortalModulePermission[],
  typeDefaults: Array<{ module_id: string; enabled: boolean }>,
  occupancyOverrides: Array<{ module_id: string; enabled: boolean }>
): ResidentPortalModulePermission[] {
  const typeMap = new Map(typeDefaults.map((row) => [row.module_id, row.enabled]));
  const occMap = new Map(occupancyOverrides.map((row) => [row.module_id, row.enabled]));

  return buildingModules
    .filter((module) => module.moduleId !== "home")
    .map((module) => {
      const buildingEnabled = module.buildingEnabled ?? module.enabled;
      if (!buildingEnabled) {
        return { ...module, buildingEnabled, enabled: false };
      }
      let enabled = typeMap.has(module.moduleId) ? typeMap.get(module.moduleId)! : true;
      if (occMap.has(module.moduleId)) {
        enabled = occMap.get(module.moduleId)!;
      }
      return { ...module, buildingEnabled, enabled };
    });
}

export async function loadBuildingPortalModulePermissions(
  buildingId: string
): Promise<ResidentPortalModulePermission[]> {
  const { data, error } = await sb()
    .from("portal_modules")
    .select("module_id, name, tile_label, enabled, locked")
    .eq("building_id", buildingId)
    .order("sort_order", { ascending: true });
  mapDbError(error);
  const rows = data ?? [];
  if (rows.length === 0) {
    return DEFAULT_PORTAL_MODULES.filter((m) => !m.locked && m.moduleId !== "home").map((m) => ({
      moduleId: m.moduleId,
      name: m.name,
      tileLabel: m.tileLabel,
      enabled: m.enabled,
      buildingEnabled: m.enabled,
    }));
  }
  return rows
    .filter((row) => !(row.locked as boolean) && row.module_id !== "home")
    .map((row) => mapBuildingModule(row as Record<string, unknown>));
}

export async function ensureResidentTypePortalModules(
  buildingId: string,
  residentType: UnitsUsersResidentType
): Promise<void> {
  try {
    const modules = await loadBuildingPortalModulePermissions(buildingId);
    const { data: existing, error: existingError } = await sb()
      .from("resident_type_portal_modules")
      .select("module_id")
      .eq("building_id", buildingId)
      .eq("resident_type", residentType);
    if (existingError) return;
    const existingIds = new Set((existing ?? []).map((row) => row.module_id as string));
    const toInsert = modules
      .filter((module) => !existingIds.has(module.moduleId))
      .map((module) => ({
        building_id: buildingId,
        resident_type: residentType,
        module_id: module.moduleId,
        enabled: defaultResidentTypeModuleEnabled(module.moduleId, residentType) && module.enabled,
      }));
    if (toInsert.length === 0) return;
    const { error } = await sb().from("resident_type_portal_modules").insert(toInsert);
    if (error) return;
  } catch {
    // Table may be missing or RLS may block seeding; callers fall back to building defaults.
  }
}

export async function getEffectivePortalModuleAccessForUser(
  userId: string,
  buildingId: string
): Promise<Map<string, boolean> | null> {
  const { data: occupancy, error } = await sb()
    .from("unit_occupancies")
    .select("id, resident_type, can_access_resident_portal")
    .eq("profile_id", userId)
    .eq("building_id", buildingId)
    .is("archived_at", null)
    .maybeSingle();
  mapDbError(error);
  if (!occupancy) return null;
  if (occupancy.can_access_resident_portal === false) return null;

  const residentType = occupancy.resident_type as UnitsUsersResidentType;
  await ensureResidentTypePortalModules(buildingId, residentType);

  const buildingModules = await loadBuildingPortalModulePermissions(buildingId);
  const { data: typeRows } = await sb()
    .from("resident_type_portal_modules")
    .select("module_id, enabled")
    .eq("building_id", buildingId)
    .eq("resident_type", residentType);
  const { data: occRows } = await sb()
    .from("occupancy_portal_modules")
    .select("module_id, enabled")
    .eq("occupancy_id", occupancy.id as string);

  const effective = mergeEffectivePortalModules(
    buildingModules,
    (typeRows ?? []) as Array<{ module_id: string; enabled: boolean }>,
    (occRows ?? []) as Array<{ module_id: string; enabled: boolean }>
  );

  const access = new Map<string, boolean>();
  access.set("home", true);
  for (const module of effective) {
    access.set(module.moduleId, module.enabled);
  }
  return access;
}

export function applyPortalModuleAccess(
  modules: PortalModuleConfig[],
  access: Map<string, boolean> | null
): PortalModuleConfig[] {
  if (!access) return modules;
  return modules.map((module) => {
    if (module.locked || module.moduleId === "home") return module;
    const allowed = access.get(module.moduleId);
    if (allowed === undefined) return { ...module, enabled: false };
    return { ...module, enabled: module.enabled && allowed };
  });
}

export function mergePermissionRows(
  roleDefaults: PermissionModuleRow[],
  overrides: PermissionModuleRow[]
): PermissionModuleRow[] {
  const overrideMap = new Map(overrides.map((row) => [row.moduleKey, row]));
  return roleDefaults.map((row) => overrideMap.get(row.moduleKey) ?? row);
}

export async function ensureCompanyRolePermissions(
  companyId: string,
  role: CompanyRole
): Promise<void> {
  try {
    const defaults = createDefaultPermissionsForRole(role);
    const { data: existing, error: existingError } = await sb()
      .from("role_permission_defaults")
      .select("module_key")
      .eq("company_id", companyId)
      .eq("role", role);
    if (existingError) return;
    const existingKeys = new Set((existing ?? []).map((row) => row.module_key as string));
    const toInsert = defaults
      .filter((row) => !existingKeys.has(row.moduleKey))
      .map((row) => ({
        company_id: companyId,
        role,
        module_key: row.moduleKey,
        can_create: row.create,
        can_view: row.view,
        can_edit: row.edit,
        can_delete: row.delete,
        can_archive: row.archive,
      }));
    if (toInsert.length === 0) return;
    const { error } = await sb().from("role_permission_defaults").insert(toInsert);
    if (error) return;
  } catch {
    // RLS or missing table; callers fall back to in-app defaults.
  }
}

export async function buildingIdForPermissions(): Promise<string> {
  return buildingIdOrThrow();
}

export type BuildingAdminModulePermission = {
  moduleKey: string;
  label: string;
  enabled: boolean;
};

export async function loadBuildingRolePermissionDefaults(roleLabel: string): Promise<PermissionModuleRow[]> {
  const buildingId = await buildingIdOrThrow();
  const { data, error } = await sb()
    .from("building_role_permission_defaults")
    .select("module_key, can_create, can_view, can_edit, can_delete, can_archive")
    .eq("building_id", buildingId)
    .eq("role_label", roleLabel);
  mapDbError(error);
  if (!data?.length) {
    return createDefaultBuildingPermissionsForRole(roleLabel).filter(
      (row) => !row.moduleKey.startsWith("company-")
    );
  }
  return mapCompanyPermissionDbRows(data, BUILDING_SIDEBAR_MODULES);
}

function permissionRowsToViewAccessMap(rows: PermissionModuleRow[]): Map<string, boolean> {
  const access = new Map<string, boolean>();
  for (const row of rows) {
    access.set(row.moduleKey, row.view);
  }
  return access;
}

export async function loadEffectiveCompanyMemberPermissions(
  membershipId: string,
  companyId: string,
  role: CompanyRole
): Promise<PermissionModuleRow[]> {
  try {
    await ensureCompanyRolePermissions(companyId, role);
  } catch {
    // Seed may fail under RLS; fall back to query or mock defaults below.
  }

  const { data: roleRows, error: roleError } = await sb()
    .from("role_permission_defaults")
    .select("module_key, can_create, can_view, can_edit, can_delete, can_archive")
    .eq("company_id", companyId)
    .eq("role", role);
  mapDbError(roleError);

  const roleDefaults = roleRows?.length
    ? mapCompanyPermissionDbRows(roleRows)
    : createDefaultPermissionsForRole(role);

  const { data: overrides, error: overrideError } = await sb()
    .from("company_membership_permissions")
    .select("module_key, can_create, can_view, can_edit, can_delete, can_archive")
    .eq("membership_id", membershipId);
  mapDbError(overrideError);
  if (!overrides?.length) return roleDefaults;

  return mergePermissionRows(roleDefaults, mapCompanyPermissionDbRows(overrides));
}

export async function getEffectiveCompanyMemberModuleAccessForUser(
  userId: string,
  companyId: string
): Promise<Map<string, boolean> | null> {
  const { data: profile, error: profileError } = await sb()
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .maybeSingle();
  mapDbError(profileError);
  if (profile?.is_super_admin) return null;

  const { data: membership, error: membershipError } = await sb()
    .from("company_memberships")
    .select("id, role")
    .eq("profile_id", userId)
    .eq("company_id", companyId)
    .maybeSingle();
  mapDbError(membershipError);
  if (!membership) return null;

  const permissions = await loadEffectiveCompanyMemberPermissions(
    membership.id as string,
    companyId,
    membership.role as CompanyRole
  );
  return permissionRowsToViewAccessMap(permissions);
}

export function mergeEffectiveBuildingAdminModules(
  roleDefaults: PermissionModuleRow[],
  occupancyOverrides: Array<{ module_key: string; enabled: boolean }>
): BuildingAdminModulePermission[] {
  const occMap = new Map(occupancyOverrides.map((row) => [row.module_key, row.enabled]));

  return roleDefaults
    .filter((row) => !row.moduleKey.startsWith("company-"))
    .map((row) => {
      let enabled = row.view;
      if (occMap.has(row.moduleKey)) {
        enabled = occMap.get(row.moduleKey)!;
      }
      return {
        moduleKey: row.moduleKey,
        label: row.label,
        enabled,
      };
    });
}

export async function getEffectiveBuildingAdminModuleAccessForUser(
  userId: string,
  buildingId: string
): Promise<Map<string, boolean> | null> {
  const { data: profile, error: profileError } = await sb()
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .maybeSingle();
  mapDbError(profileError);
  if (profile?.is_super_admin) return null;

  const { data: building, error: buildingError } = await sb()
    .from("buildings")
    .select("company_id")
    .eq("id", buildingId)
    .maybeSingle();
  mapDbError(buildingError);

  if (building?.company_id) {
    const { data: companyMembership, error: companyError } = await sb()
      .from("company_memberships")
      .select("id, role")
      .eq("profile_id", userId)
      .eq("company_id", building.company_id as string)
      .maybeSingle();
    mapDbError(companyError);

    if (companyMembership) {
      const permissions = await loadEffectiveCompanyMemberPermissions(
        companyMembership.id as string,
        building.company_id as string,
        companyMembership.role as CompanyRole
      );
      const access = new Map<string, boolean>();
      for (const row of permissions) {
        if (!row.moduleKey.startsWith("company-")) {
          access.set(row.moduleKey, row.view);
        }
      }
      return access;
    }
  }

  const { data: occupancy, error: occupancyError } = await sb()
    .from("unit_occupancies")
    .select("id, building_admin_role_label, can_access_building_admin")
    .eq("profile_id", userId)
    .eq("building_id", buildingId)
    .is("archived_at", null)
    .maybeSingle();
  mapDbError(occupancyError);

  let roleLabel: string | null = null;
  let occupancyId: string | null = null;
  let occupancyOverrides: Array<{ module_key: string; enabled: boolean }> = [];

  if (occupancy?.can_access_building_admin === true) {
    roleLabel = (occupancy.building_admin_role_label as string) || "Resident";
    occupancyId = occupancy.id as string;
  } else {
    const { data: membership, error: membershipError } = await sb()
      .from("building_memberships")
      .select("role_label, status")
      .eq("profile_id", userId)
      .eq("building_id", buildingId)
      .eq("status", "active")
      .maybeSingle();
    mapDbError(membershipError);
    if (!membership?.role_label) return null;
    roleLabel = membership.role_label as string;
  }

  const roleDefaults = await loadBuildingRolePermissionDefaultsForBuilding(buildingId, roleLabel);

  if (occupancyId) {
    const { data: occRows, error: occError } = await sb()
      .from("occupancy_building_admin_modules")
      .select("module_key, enabled")
      .eq("occupancy_id", occupancyId);
    mapDbError(occError);
    occupancyOverrides = (occRows ?? []) as Array<{ module_key: string; enabled: boolean }>;
  }

  const effective = mergeEffectiveBuildingAdminModules(roleDefaults, occupancyOverrides);
  const access = new Map<string, boolean>();
  for (const module of effective) {
    access.set(module.moduleKey, module.enabled);
  }
  return access;
}

async function loadBuildingRolePermissionDefaultsForBuilding(
  buildingId: string,
  roleLabel: string
): Promise<PermissionModuleRow[]> {
  const { data, error } = await sb()
    .from("building_role_permission_defaults")
    .select("module_key, can_create, can_view, can_edit, can_delete, can_archive")
    .eq("building_id", buildingId)
    .eq("role_label", roleLabel);
  mapDbError(error);
  if (!data?.length) {
    return createDefaultBuildingPermissionsForRole(roleLabel).filter(
      (row) => !row.moduleKey.startsWith("company-")
    );
  }
  return mapCompanyPermissionDbRows(data, BUILDING_SIDEBAR_MODULES);
}
