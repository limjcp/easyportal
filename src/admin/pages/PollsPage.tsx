import { useEffect, useState } from "react";
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
  const [items, setItems] = useState<Poll[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    adminRepository.getPolls().then(setItems);
  }, [refreshKey]);

  return (
    <>
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
        ]}
      />

      <AddPollModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onContinue={async (title) => {
          const poll = await adminRepository.createPoll({ title });
          setAddOpen(false);
          onRefresh();
          onNavigate({ page: "poll-edit", id: poll.id });
        }}
      />
    </>
  );
}
