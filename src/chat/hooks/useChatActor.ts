import type { AdminUser, ChatActor, CompanyUser, ResidentUser } from "../../resident/data/types";
import { DEMO_BUILDING_ID } from "../../resident/data/types";
import { canMessageAnyBuilding } from "../utils/access";

export const RESIDENT_CONTACT_ID = "contact-resident-claudio";
export const ADMIN_CONTACT_ID = "contact-admin-claudio";
export const COMPANY_CONTACT_ID = "contact-company-claudio";

export function buildResidentChatActor(user: ResidentUser): ChatActor {
  return {
    contactId: RESIDENT_CONTACT_ID,
    name: user.name,
    role: user.role,
    buildingId: DEMO_BUILDING_ID,
    canMessageAnyBuilding: false,
  };
}

export function buildAdminChatActor(
  user: AdminUser,
  buildingId: string = DEMO_BUILDING_ID,
  companyRole?: string
): ChatActor {
  const crossBuilding = companyRole ? canMessageAnyBuilding(companyRole) : false;
  return {
    contactId: ADMIN_CONTACT_ID,
    name: user.displayName,
    role: companyRole ?? user.role,
    buildingId,
    canMessageAnyBuilding: crossBuilding,
  };
}

export function buildCompanyChatActor(user: CompanyUser): ChatActor {
  return {
    contactId: COMPANY_CONTACT_ID,
    name: user.displayName,
    role: user.role,
    buildingId: DEMO_BUILDING_ID,
    canMessageAnyBuilding: canMessageAnyBuilding(user.role),
  };
}
