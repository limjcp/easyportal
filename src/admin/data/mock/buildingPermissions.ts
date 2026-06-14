import type { PermissionModuleRow } from "../../../resident/data/types";

export const BUILDING_ADMIN_ROLES: { value: string; label: string }[] = [
  { value: "200", label: "Company Owner" },
  { value: "300", label: "Company Administrator" },
  { value: "301", label: "Company Accountant" },
  { value: "400", label: "Property Manager" },
  { value: "500", label: "Property Administrator" },
  { value: "510", label: "Board Member" },
  { value: "511", label: "Board Member (Director)" },
  { value: "512", label: "Board Member (Secretary)" },
  { value: "513", label: "Board Member (Treasurer)" },
  { value: "514", label: "Board Member (Vice President)" },
  { value: "515", label: "Board Member (President)" },
  { value: "520", label: "Resident (Admin)" },
  { value: "530", label: "Concierge" },
  { value: "540", label: "Gatehouse Keeper" },
  { value: "550", label: "Superintendent" },
  { value: "600", label: "Resident" },
];

export const BUILDING_PERMISSION_MODULES: { moduleKey: string; label: string }[] = [
  { moduleKey: "company-condos", label: "Company: Condos" },
  { moduleKey: "company-employees", label: "Company: Employees" },
  { moduleKey: "company-subscriptions", label: "Company: Subscriptions" },
  { moduleKey: "company-master-reports", label: "Company: Master Reports" },
  { moduleKey: "consultation-leads", label: "Consultation Leads" },
  { moduleKey: "admins", label: "Admins" },
  { moduleKey: "board-approvals", label: "Board Approvals" },
  { moduleKey: "board-members", label: "Board Members" },
  { moduleKey: "board-elections", label: "Board Elections" },
  { moduleKey: "agm", label: "AGM Meetings" },
  { moduleKey: "compliance-dashboard", label: "Compliance Dashboard" },
  { moduleKey: "fire-safety", label: "Fire Safety Plan" },
  { moduleKey: "building-definitions", label: "Building Definitions" },
  { moduleKey: "documents", label: "Documents" },
  { moduleKey: "events", label: "Events" },
  { moduleKey: "external-data", label: "ExternalData" },
  { moduleKey: "faq", label: "FAQ" },
  { moduleKey: "galleries", label: "Galleries" },
  { moduleKey: "incident-reports", label: "Incident Reports" },
  { moduleKey: "news-notices", label: "News & Notices" },
  { moduleKey: "newsletters", label: "Newsletters" },
  { moduleKey: "portal-settings", label: "Portal Settings" },
  { moduleKey: "service-requests", label: "Service Request" },
  { moduleKey: "status-certificates", label: "Status Certificates" },
  { moduleKey: "suggestions", label: "Suggestion" },
  { moduleKey: "polls", label: "Polls" },
  { moduleKey: "amenities", label: "Amenities" },
  { moduleKey: "chat", label: "Chat" },
  { moduleKey: "units-users", label: "Units & Users" },
];

export const BUILDING_SIDEBAR_MODULES = BUILDING_PERMISSION_MODULES.filter(
  (module) => !module.moduleKey.startsWith("company-")
);

function moduleRow(
  label: string,
  moduleKey: string,
  flags: Partial<Pick<PermissionModuleRow, "create" | "view" | "edit" | "delete" | "archive">>
): PermissionModuleRow {
  return {
    moduleKey,
    label,
    create: flags.create ?? false,
    view: flags.view ?? false,
    edit: flags.edit ?? false,
    delete: flags.delete ?? false,
    archive: flags.archive ?? false,
  };
}

function fullBuildingAccess(): PermissionModuleRow[] {
  return BUILDING_PERMISSION_MODULES.map((m) =>
    moduleRow(m.label, m.moduleKey, {
      create: true,
      view: true,
      edit: true,
      delete: true,
      archive: true,
    })
  );
}

export function createDefaultBuildingPermissionsForRole(role: string): PermissionModuleRow[] {
  if (role === "Company Owner" || role === "Company Administrator") {
    return fullBuildingAccess();
  }
  if (role === "Property Manager" || role === "Property Administrator") {
    return BUILDING_PERMISSION_MODULES.map((m) =>
      moduleRow(m.label, m.moduleKey, {
        create: !m.moduleKey.startsWith("company-"),
        view: true,
        edit: !m.moduleKey.startsWith("company-"),
        delete: false,
        archive: m.moduleKey === "news-notices" || m.moduleKey === "documents",
      })
    );
  }
  if (role.startsWith("Board Member")) {
    return BUILDING_PERMISSION_MODULES.map((m) =>
      moduleRow(m.label, m.moduleKey, {
        view:
          m.moduleKey === "board-approvals" ||
          m.moduleKey === "board-members" ||
          m.moduleKey === "board-elections" ||
          m.moduleKey === "documents" ||
          m.moduleKey === "incident-reports" ||
          m.moduleKey === "agm" ||
          m.moduleKey === "compliance-dashboard",
        edit: m.moduleKey === "board-approvals" || m.moduleKey === "board-elections",
      })
    );
  }
  return BUILDING_PERMISSION_MODULES.map((m) =>
    moduleRow(m.label, m.moduleKey, { view: m.moduleKey !== "company-subscriptions" })
  );
}

export function seedBuildingRolePermissions() {
  return BUILDING_ADMIN_ROLES.map((r) => ({
    role: r.label,
    permissions: createDefaultBuildingPermissionsForRole(r.label),
  }));
}
