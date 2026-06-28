import { useCallback } from "react";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";

type Identifiable = { id: string };

function stableQueryKeyHash(key: QueryKey | null): string | null {
  return key ? JSON.stringify(key) : null;
}

export function patchBuildingQueryListItem<T extends Identifiable>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  id: string,
  patch: Partial<T> | ((item: T) => T)
) {
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return old;
    return old.map((item) => {
      if (item.id !== id) return item;
      return typeof patch === "function" ? patch(item) : { ...item, ...patch };
    });
  });
}

export function prependBuildingQueryListItem<T extends Identifiable>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  item: T
) {
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return [item];
    if (old.some((row) => row.id === item.id)) return old;
    return [item, ...old];
  });
}

export function removeBuildingQueryListItem(
  queryClient: QueryClient,
  queryKey: QueryKey,
  id: string
) {
  queryClient.setQueryData<Identifiable[]>(queryKey, (old) => {
    if (!old) return old;
    return old.filter((item) => item.id !== id);
  });
}

export async function invalidateBuildingQueries(
  queryClient: QueryClient,
  buildingId: string,
  refetchType: "active" | "inactive" | "all" | "none" = "active"
) {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.building.root(buildingId),
    refetchType,
  });
}

export function useBuildingListRefresh<T extends Identifiable>(
  queryClient: QueryClient,
  buildingId: string | undefined,
  listQueryKey: QueryKey | null,
  refetch: () => Promise<unknown>
) {
  const listQueryKeyHash = stableQueryKeyHash(listQueryKey);

  const refreshList = useCallback(
    async (updatedItem?: T) => {
      if (updatedItem && listQueryKey) {
        patchBuildingQueryListItem<T>(queryClient, listQueryKey, updatedItem.id, updatedItem);
        return;
      }
      await refetch();
    },
    [listQueryKey, listQueryKeyHash, queryClient, refetch]
  );

  return { refreshList, patchItem: patchBuildingQueryListItem, prependItem: prependBuildingQueryListItem };
}
