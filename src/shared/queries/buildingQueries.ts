import { useQuery } from "@tanstack/react-query";
import { adminRepository } from "../../admin/data/adminRepository";
import { loadPortalConfig } from "../../resident/data/portalConfig";
import { getEffectiveBuildingAdminModuleAccessForUser } from "../../data/supabase/portalModulePermissions";
import { queryKeys } from "../queryKeys";
import { useTenantContext } from "./useTenantContext";

const BADGE_STALE = 30_000;
const NAV_ACCESS_STALE = 0;
const PORTAL_CONFIG_STALE = 5 * 60_000;

export function useBuildingBadgeCounts() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.badgeCounts(userId!, buildingId!),
    queryFn: async () => {
      const [unreadSuggestions, pendingApprovals, unreadBoardApplications, unreadConsultationLeads] =
        await Promise.all([
          adminRepository.getUnreadSuggestionCount(),
          adminRepository.getPendingBoardApprovalCount(),
          adminRepository.getUnreadBoardApplicationCount(),
          adminRepository.getUnreadConsultationLeadCount(),
        ]);
      return { unreadSuggestions, pendingApprovals, unreadBoardApplications, unreadConsultationLeads };
    },
    enabled: isBuildingReady,
    staleTime: BADGE_STALE,
  });
}

export function useBuildingNavAccess() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.navAccess(userId!, buildingId!),
    queryFn: () => getEffectiveBuildingAdminModuleAccessForUser(userId!, buildingId!),
    enabled: isBuildingReady,
    staleTime: NAV_ACCESS_STALE,
  });
}

export function usePortalConfigQuery(buildingKey: string | null) {
  const { userId } = useTenantContext();
  const buildingId = buildingKey;
  return useQuery({
    queryKey: queryKeys.building.portalConfig(userId ?? "anonymous", buildingId ?? "none"),
    queryFn: () => loadPortalConfig(),
    enabled: Boolean(userId && buildingId),
    staleTime: PORTAL_CONFIG_STALE,
  });
}
