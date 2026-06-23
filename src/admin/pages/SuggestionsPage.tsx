import { useCallback, useEffect, useState } from "react";
import { CrudPanel } from "../../shared/CrudPanel";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { UnreadBadge } from "../components/AdminBadges";
import { adminRepository } from "../data/adminRepository";
import { useAdminSuggestions } from "../../shared/queries/adminListQueries";
import { prependBuildingQueryListItem, useBuildingListRefresh } from "../../shared/queries/mutationHelpers";
import { queryKeys } from "../../shared/queryKeys";
import { useInvalidatePortalQueries } from "../../shared/queries/useInvalidatePortalQueries";
import { useTenantContext } from "../../shared/queries/useTenantContext";
import { isQueryInitiallyLoading } from "../../shared/useQueryPageBusy";
import { AddSuggestionModal } from "../modals/AddSuggestionModal";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { AdminSuggestion } from "../../resident/data/types";

type SuggestionsPageProps = {
  route: AdminRoute & { page: "suggestions" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function SuggestionsPage({ route, onNavigate, refreshKey, onRefresh }: SuggestionsPageProps) {
  const { queryClient } = useInvalidatePortalQueries();
  const { userId, buildingId } = useTenantContext();
  const listQueryKey =
    userId && buildingId ? queryKeys.building.adminSuggestions(userId, buildingId) : null;
  const suggestionsQuery = useAdminSuggestions();
  const { data: items = [], refetch } = suggestionsQuery;
  const { refreshList } = useBuildingListRefresh<AdminSuggestion>(
    queryClient,
    buildingId,
    listQueryKey,
    refetch
  );
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const syncFromRefreshKey = useCallback(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (refreshKey === 0) return;
    syncFromRefreshKey();
  }, [refreshKey, syncFromRefreshKey]);

  const filtered =
    visibilityFilter === "all"
      ? items
      : items.filter((i) => i.visibility.toLowerCase().includes(visibilityFilter.toLowerCase()));

  return (
    <CrudPanel loading={isQueryInitiallyLoading(suggestionsQuery)}>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded bg-[#89c64c] px-3 py-1.5 text-sm text-white hover:bg-[#7ab543]"
          >
            + Add a new Suggestion
          </button>
        }
      />
      <AdminPanelTable
        title="Suggestion(s)"
        headerColor="green"
        data={filtered}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        filters={[
          {
            id: "visibility",
            label: "Visibility",
            value: visibilityFilter,
            onChange: setVisibilityFilter,
            options: [
              { value: "all", label: "View All" },
              { value: "private", label: "Private" },
              { value: "public", label: "Public" },
            ],
          },
        ]}
        columns={[
          {
            key: "id",
            header: "ID",
            render: (row) => (
              <span className="flex items-center gap-2">
                {row.unread && <UnreadBadge />}
                {row.id}
              </span>
            ),
          },
          { key: "text", header: "Suggestion", render: (row) => row.text },
          { key: "visibility", header: "Visibility", render: (row) => row.visibility },
          { key: "createdAt", header: "Created", render: (row) => row.createdAt },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <button
                type="button"
                onClick={() => onNavigate({ page: "suggestion-detail", id: row.id })}
                className="rounded bg-[#3476ef] px-2 py-1 text-xs text-white hover:bg-[#2d68cf]"
              >
                View
              </button>
            ),
          },
        ]}
      />

      <AddSuggestionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (input) => {
          const created = await adminRepository.createSuggestion(input);
          if (listQueryKey) prependBuildingQueryListItem(queryClient, listQueryKey, created);
        }}
      />
    </CrudPanel>
  );
}
