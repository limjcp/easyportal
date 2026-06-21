import { queryClient } from "./queryClient";
import { queryKeys } from "./queryKeys";

export function clearAllQueries(): void {
  queryClient.clear();
}

export function invalidateAuthQueries(): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
}

export function invalidateCompanyQueries(userId: string, companyId: string): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.company.all(userId, companyId) });
}

export function removeBuildingQueries(buildingId: string): void {
  queryClient.removeQueries({ queryKey: queryKeys.building.root(buildingId) });
}

export function invalidateBuildingBadgeCounts(userId: string, buildingId: string): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.building.badgeCounts(userId, buildingId) });
}
