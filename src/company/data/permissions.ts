import type { CompanyRole, PermissionModuleRow, RoleNameOverride } from "../../resident/data/types";
import {
  BUILDING_PERMISSION_MODULES,
  createDefaultBuildingPermissionsForRole,
} from "../../admin/data/buildingPermissions";

export const DEFAULT_ROLE_NAMES: RoleNameOverride[] = [
  { defaultRole: "Company Owner", customName: "" },
  { defaultRole: "Company Administrator", customName: "" },
  { defaultRole: "Company Accountant", customName: "" },
  { defaultRole: "Property Manager", customName: "" },
  { defaultRole: "Property Administrator", customName: "" },
  { defaultRole: "Board Member", customName: "" },
  { defaultRole: "Board Member (Director, Secretary, Treasurer, Vice President, President)", customName: "" },
  { defaultRole: "Resident (Admin)", customName: "" },
  { defaultRole: "Concierge", customName: "" },
  { defaultRole: "Gatehouse Keeper", customName: "" },
  { defaultRole: "Superintendent", customName: "" },
  { defaultRole: "Resident", customName: "" },
];

/** Full module catalog for company employee and role permission defaults. */
export const PERMISSION_MODULES: { moduleKey: string; label: string }[] = BUILDING_PERMISSION_MODULES;

function accountantDefaults(): PermissionModuleRow[] {
  return PERMISSION_MODULES.map((m) => ({
    moduleKey: m.moduleKey,
    label: m.label,
    create: m.moduleKey.includes("purchase") || m.moduleKey.includes("subscription"),
    view: true,
    edit: m.moduleKey.includes("purchase") || m.moduleKey.includes("subscription"),
    delete: false,
    archive: false,
  }));
}

export function createDefaultPermissionsForRole(role: CompanyRole): PermissionModuleRow[] {
  if (role === "Company Accountant") {
    return accountantDefaults();
  }
  return createDefaultBuildingPermissionsForRole(role);
}
