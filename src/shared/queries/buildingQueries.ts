import { useQuery } from "@tanstack/react-query";
import { adminRepository } from "../../admin/data/adminRepository";
import { loadPortalConfig } from "../../resident/data/portalConfig";
import { getEffectiveBuildingAdminModuleAccessForUser } from "../../data/supabase/portalModulePermissions";
import { queryKeys } from "../queryKeys";
import { useTenantContext } from "./useTenantContext";

const BADGE_STALE = 3 * 60_000;
const NAV_ACCESS_STALE = 5 * 60_000;
const PORTAL_CONFIG_STALE = 10 * 60_000;

export function useBuildingBadgeCounts() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.badgeCounts(userId!, buildingId!),
    queryFn: () => adminRepository.getDashboardMessages(),
    enabled: isBuildingReady,
    staleTime: BADGE_STALE,
  });
}

export function useAdminDashboardMessages(navAccess?: Map<string, boolean> | null) {
  const { data: messages = [], ...query } = useBuildingBadgeCounts();
  const visibleMessages = messages.filter(
    (message) => !navAccess || navAccess.get(message.moduleKey) !== false
  );
  return { messages: visibleMessages, ...query };
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
