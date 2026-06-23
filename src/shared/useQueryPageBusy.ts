import type { UseQueryResult } from "@tanstack/react-query";
import { usePageContentBusy } from "./usePageContentBusy";

/** True only during the initial fetch for a query key (not background refetches or disabled queries). */
export function isQueryPageLoading(
  result: Pick<UseQueryResult, "isLoading" | "isPending" | "fetchStatus">
) {
  if (result.isPending && result.fetchStatus === "idle") return false;
  return result.isLoading;
}

/** @deprecated Use isQueryPageLoading */
export const isQueryInitiallyLoading = isQueryPageLoading;

export function useQueryPageBusy(
  result: Pick<UseQueryResult, "isLoading" | "isPending" | "fetchStatus">
) {
  usePageContentBusy(isQueryPageLoading(result));
}
