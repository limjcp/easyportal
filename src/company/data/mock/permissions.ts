import type { CompanyRole, PermissionModuleRow, RoleNameOverride } from "../../../resident/data/types";

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

export const PERMISSION_MODULES: { moduleKey: string; label: string }[] = [
  { moduleKey: "company-condos", label: "Company: Condos" },
  { moduleKey: "company-employees", label: "Company: Employees" },
  { moduleKey: "company-subscriptions", label: "Company: Subscriptions" },
  { moduleKey: "company-master-reports", label: "Company: Master Reports" },
  { moduleKey: "company-vendors", label: "Company: Vendors" },
  { moduleKey: "company-purchase-orders", label: "Company: Purchase Orders" },
  { moduleKey: "admins", label: "Admins" },
  { moduleKey: "amenities", label: "Amenities" },
  { moduleKey: "board-approvals", label: "Board Approvals" },
  { moduleKey: "building-definitions", label: "Building Definitions" },
  { moduleKey: "incident-reports", label: "Incident Reports" },
  { moduleKey: "service-requests", label: "Service Request" },
  { moduleKey: "units-users", label: "Units & Users" },
];

function fullAccess(): PermissionModuleRow[] {
  return PERMISSION_MODULES.map((m) => ({
    moduleKey: m.moduleKey,
    label: m.label,
    create: true,
    view: true,
    edit: true,
    delete: true,
    archive: true,
  }));
}

function viewOnly(): PermissionModuleRow[] {
  return PERMISSION_MODULES.map((m) => ({
    moduleKey: m.moduleKey,
    label: m.label,
    create: false,
    view: true,
    edit: false,
    delete: false,
    archive: false,
  }));
}

export function createDefaultPermissionsForRole(role: CompanyRole): PermissionModuleRow[] {
  if (role === "Company Owner" || role === "Company Administrator") {
    return fullAccess();
  }
  if (role === "Company Accountant") {
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
  return viewOnly();
}
