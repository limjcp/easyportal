import type { LoginPortalRole } from "../resident/data/types";
import {
  companyBuildingAdminPrefix,
  standaloneAdminPrefix,
} from "../routing/adminRoutePaths";

export function portalDefaultPath(
  portal: LoginPortalRole,
  buildingId?: string | null
): string {
  if (portal === "company") return "/company/buildings";
  if (portal === "building") {
    return buildingId ? standaloneAdminPrefix(buildingId) : "/admin";
  }
  if (portal === "vendor") return "/vendor";
  return "/resident";
}

export function companyBuildingPath(buildingId: string, adminSubPath = ""): string {
  const base = companyBuildingAdminPrefix(buildingId);
  return adminSubPath ? `${base}/${adminSubPath.replace(/^\/+/, "")}` : base;
}
