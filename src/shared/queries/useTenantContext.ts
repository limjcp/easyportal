import { useAuth } from "../../auth/AuthProvider";
import { getActiveBuildingId } from "../../data/supabase/buildingContext";

export function useTenantContext() {
  const { session, portalAccess } = useAuth();
  const userId = session?.user?.id;
  const companyId = portalAccess?.companyId ?? undefined;
  const buildingId = getActiveBuildingId() ?? portalAccess?.buildingIds[0] ?? undefined;

  return {
    userId,
    companyId,
    buildingId,
    isReady: Boolean(userId),
    isCompanyReady: Boolean(userId && companyId),
    isBuildingReady: Boolean(userId && buildingId),
  };
}
