import { useEffect, useState } from "react";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { UnreadBadge } from "../components/AdminBadges";
import { adminRepository } from "../data/adminRepository";
import { useAdminSuggestions } from "../../shared/queries/adminListQueries";
import { useInvalidatePortalQueries } from "../../shared/queries/useInvalidatePortalQueries";
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
  const { invalidateBuilding } = useInvalidatePortalQueries();
  const { data: items = [] } = useAdminSuggestions();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  void refreshKey;

  const handleRefresh = () => {
    invalidateBuilding();
    onRefresh();
  };

  const filtered =
    visibilityFilter === "all"
      ? items
      : items.filter((i) => i.visibility.toLowerCase().includes(visibilityFilter.toLowerCase()));

  return (
    <>
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
              <span>
                {row.id}
                {row.unread && <UnreadBadge />}
              </span>
            ),
          },
          { key: "visibility", header: "Visibility", render: (row) => row.visibility },
          { key: "date", header: "Date", render: (row) => row.createdAt },
          {
            key: "suggestion",
            header: "Suggestion",
            render: (row) => (
              <p className="line-clamp-2 max-w-md text-sm">{row.text}</p>
            ),
          },
          { key: "createdBy", header: "Created By", render: (row) => row.createdBy },
          { key: "unit", header: "Unit", render: (row) => row.unit },
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <button
                type="button"
                onClick={() => onNavigate({ page: "suggestion-detail", id: row.id })}
                className="rounded bg-[#3476ef] px-3 py-1 text-xs text-white"
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
          await adminRepository.createSuggestion(input);
          handleRefresh();
        }}
      />
    </>
  );
}
