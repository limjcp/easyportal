import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "../queryKeys";
import { invalidateCompanyQueries } from "../queryInvalidation";
import { useTenantContext } from "./useTenantContext";

export function useInvalidatePortalQueries() {
  const queryClient = useQueryClient();
  const { userId, companyId, buildingId } = useTenantContext();

  const invalidateBuilding = useCallback(() => {
    if (!buildingId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.building.root(buildingId) });
  }, [queryClient, buildingId]);

  const invalidateCompany = useCallback(() => {
    if (!userId || !companyId) return;
    invalidateCompanyQueries(userId, companyId);
  }, [userId, companyId]);

  const invalidateAll = useCallback(() => {
    invalidateBuilding();
    invalidateCompany();
  }, [invalidateBuilding, invalidateCompany]);

  return { invalidateBuilding, invalidateCompany, invalidateAll, queryClient };
}
