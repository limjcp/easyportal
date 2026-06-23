import { useCallback, useRef, useState } from "react";
import { CrudPanel } from "../../shared/CrudPanel";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useLocalList } from "../../shared/useLocalList";
import { StatusBadge } from "../components/AdminBadges";
import { AdminPanelTable } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AddPollModal } from "../modals/AddPollModal";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { Poll } from "../../resident/data/types";

type PollsPageProps = {
  route: AdminRoute & { page: "polls" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function PollsPage({ route, onNavigate, refreshKey, onRefresh }: PollsPageProps) {
  const { data: items, reload, loading } = useLocalList(
    useCallback(() => adminRepository.getPolls(), []),
    refreshKey
  );
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const pendingTitleRef = useRef("");

  const { run: createPollRun, error: createError } = useAsyncAction(
    useCallback(async () => {
      const title = pendingTitleRef.current;
      if (!title) return;
      const poll = await adminRepository.createPoll({ title });
      setAddOpen(false);
      onRefresh();
      await reload();
      onNavigate({ page: "poll-edit", id: poll.id });
    }, [onRefresh, onNavigate, reload]),
    { successMessage: "Poll created.", showErrorToast: false }
  );

  return (
    <CrudPanel loading={loading}>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:bg-[#2d68cf]"
          >
            + Add a New Poll
          </button>
        }
      />
      {createError ? <FormAlert message={createError} className="mb-3" /> : null}
      <AdminPanelTable
        title="Polls"
        data={items}
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
            options: [{ value: "all", label: "View All" }],
          },
        ]}
        columns={[
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: "title",
            header: "Title",
            render: (row) => (
              <button
                type="button"
                onClick={() => onNavigate({ page: "poll-edit", id: row.id })}
                className="text-[#3476ef] hover:underline"
              >
                {row.title}
              </button>
            ),
          },
          { key: "created", header: "Created", render: (row) => row.createdAt },
          { key: "published", header: "Published", render: (row) => row.publishedAt ?? "" },
          { key: "expires", header: "Expires", render: (row) => row.expiresAt ?? "" },
          { key: "responses", header: "Responses", render: (row) => row.responseCount },
          {
            key: "results",
            header: "Results",
            render: (row) => (
              <button
                type="button"
                onClick={() => onNavigate({ page: "poll-edit", id: row.id })}
                className="text-[#3476ef] hover:underline"
              >
                View
              </button>
            ),
          },
        ]}
      />

      <AddPollModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onContinue={async (title) => {
          pendingTitleRef.current = title;
          await createPollRun();
        }}
      />
    </CrudPanel>
  );
}
