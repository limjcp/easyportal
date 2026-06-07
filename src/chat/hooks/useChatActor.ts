import type { AdminUser, ChatActor, CompanyUser, ResidentUser } from "../../resident/data/types";
import { getActiveBuildingId } from "../../data/supabase/buildingContext";
import { canMessageAnyBuilding } from "../utils/access";

function requireBuildingId(buildingId?: string): string {
  const resolved = buildingId ?? getActiveBuildingId();
  if (!resolved) {
    throw new Error("No active building selected.");
  }
  return resolved;
}

export function buildResidentChatActor(user: ResidentUser, buildingId?: string): ChatActor {
  return {
    contactId: user.id,
    name: user.name,
    role: user.role,
    buildingId: requireBuildingId(buildingId),
    canMessageAnyBuilding: false,
  };
}

export function buildAdminChatActor(
  user: AdminUser,
  buildingId?: string,
  companyRole?: string
): ChatActor {
  const crossBuilding = companyRole ? canMessageAnyBuilding(companyRole) : false;
  return {
    contactId: user.id,
    name: user.displayName,
    role: companyRole ?? user.role,
    buildingId: requireBuildingId(buildingId),
    canMessageAnyBuilding: crossBuilding,
  };
}

export function buildCompanyChatActor(user: CompanyUser, buildingId?: string): ChatActor {
  return {
    contactId: user.id,
    name: user.displayName,
    role: user.role,
    buildingId: requireBuildingId(buildingId),
    canMessageAnyBuilding: canMessageAnyBuilding(user.role),
  };
}
