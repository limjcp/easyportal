import type { LoginPortalRole } from "../resident/data/types";
import type { PortalAccess } from "./supabaseAuth";

export type PortalAppView = "resident" | "admin" | "company" | "vendor";

export function portalRoleToView(role: LoginPortalRole): PortalAppView {
  if (role === "company") return "company";
  if (role === "building") return "admin";
  if (role === "vendor") return "vendor";
  return "resident";
}

export function resolvePortalForUser(input: {
  activePortal: LoginPortalRole | null;
  portalAccess: PortalAccess | null;
  preferCompanyPortal?: boolean;
}): LoginPortalRole | null {
  const access = input.portalAccess;
  if (!access?.portals.length) return null;

  if (input.preferCompanyPortal && access.portals.includes("company")) {
    return "company";
  }

  if (input.activePortal && access.portals.includes(input.activePortal)) {
    return input.activePortal;
  }
  if (access.defaultPortal && access.portals.includes(access.defaultPortal)) {
    return access.defaultPortal;
  }
  return access.portals[0] ?? null;
}
