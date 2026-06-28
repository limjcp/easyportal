import { useCallback, useEffect, useRef, useState } from "react";
import { FormAlert } from "../../shared/FormAlert";
import { usePageContentBusy } from "../../shared/usePageContentBusy";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { FaCheck, FaTimes } from "react-icons/fa";
import {
  OptionsDropdown,
  StatusBadge,
  UnreadBadge,
} from "../components/AdminBadges";
import { AdminPanelTable, AdminTabs } from "../components/AdminPanelTable";
import { AdminMobileCard } from "../components/AdminMobileCard";
import { adminRepository } from "../data/adminRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import { BoardApprovalDetailModal } from "../modals/BoardApprovalDetailModal";
import { BoardApprovalExportModal } from "../modals/BoardApprovalExportModal";
import { BoardApprovalTopicModal } from "../modals/BoardApprovalTopicModal";
import type { AdminRoute } from "../navigation";
import type { BoardApproval, BoardApprovalVoteStatus } from "../../resident/data/types";

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "View All" },
  { value: "Approved", label: "Approved" },
  { value: "Disapproved", label: "Disapproved" },
  { value: "Tie Vote", label: "Tie Vote" },
  { value: "Pending", label: "Pending" },
  { value: "No Votes Required", label: "No Votes Required" },
];

type BoardApprovalsPageProps = {
  route: AdminRoute & { page: "board-approvals" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function BoardApprovalsPage({
  route,
  onNavigate,
  refreshKey,
  onRefresh,
}: BoardApprovalsPageProps) {
  const [items, setItems] = useState<BoardApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [topicOpen, setTopicOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<BoardApproval | null>(null);
  const pendingIdRef = useRef<string | null>(null);
  const pendingCreateRef = useRef<Parameters<typeof adminRepository.createBoardApproval>[0] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminRepository
      .getBoardApprovals(route.tab === "archived")
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    setPage(1);
    return () => {
      cancelled = true;
    };
  }, [route.tab, refreshKey]);

  usePageContentBusy(loading);

  const { run: archiveApprovalRun, error: archiveError } = useAsyncAction(
    useCallback(async () => {
      const id = pendingIdRef.current;
      if (!id) return;
      await adminRepository.archiveBoardApproval(id);
      onRefresh();
    }, [onRefresh]),
    { successMessage: "Board approval archived." }
  );

  const { run: createTopicRun } = useAsyncAction(
    useCallback(async () => {
      const input = pendingCreateRef.current;
      if (!input) return;
      await adminRepository.createBoardApproval(input);
      onRefresh();
    }, [onRefresh]),
    { successMessage: "Board approval topic created." }
  );

  const filtered = items.filter((item) => {
    if (statusFilter !== "all" && item.status !== (statusFilter as BoardApprovalVoteStatus)) {
      return false;
    }
    return true;
  });

  const panelTitle =
    route.tab === "archived" ? "Archived Board Approvals" : "Current Board Approvals";

  const openDetail = (row: BoardApproval) => {
    if (row.unread) {
      adminRepository.markBoardApprovalRead(row.id).then(onRefresh);
    }
    setDetailItem({ ...row, unread: false });
  };

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 rounded bg-slate-700 px-3 py-1.5 text-sm text-white hover:opacity-90"
            >
              Export Board Approvals
            </button>
            <button
              type="button"
              onClick={() => setTopicOpen(true)}
              className="inline-flex items-center gap-2 rounded bg-[#7D5DA7] px-3 py-1.5 text-sm text-white hover:opacity-90"
            >
              + Begin A Topic
            </button>
          </div>
        }
      />

      {archiveError ? <FormAlert message={archiveError} className="mb-3" /> : null}

      <AdminTabs
        tabs={[
          { id: "current", label: "Current Board Approvals" },
          { id: "archived", label: "Archived Board Approvals" },
        ]}
        activeTab={route.tab}
        onChange={(tab) =>
          onNavigate({
            page: "board-approvals",
            tab: tab as "current" | "archived",
          })
        }
      />

      <AdminPanelTable
        title={panelTitle}
        headerColor="purple"
        data={filtered}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        filters={[
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
        columns={[
          {
            key: "created",
            header: "Created",
            className: "whitespace-nowrap",
            render: (row) => (
              <div className={row.unread ? "font-semibold" : undefined}>
                {row.created}
                {row.unread && (
                  <div className="mt-1">
                    <UnreadBadge />
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: "approved",
            header: "✓",
            render: (row) => (
              <span className="flex justify-center text-green-600" title="Approved votes">
                <FaCheck />
                <span className="sr-only">{row.approvedVotes}</span>
                <span className="ml-1 text-xs text-slate-700">{row.approvedVotes}</span>
              </span>
            ),
          },
          {
            key: "disapproved",
            header: "✕",
            render: (row) => (
              <span className="flex justify-center text-red-600" title="Disapproved votes">
                <FaTimes />
                <span className="sr-only">{row.disapprovedVotes}</span>
                <span className="ml-1 text-xs text-slate-700">{row.disapprovedVotes}</span>
              </span>
            ),
          },
          {
            key: "votes",
            header: "Votes",
            hideBelow: "md",
            className: "whitespace-nowrap",
            render: (row) => <span className="text-xs">{row.votes}</span>,
          },
          {
            key: "title",
            header: "Title",
            render: (row) => (
              <button
                type="button"
                onClick={() => openDetail(row)}
                className={`max-w-[10rem] text-left text-[#3476ef] hover:underline sm:max-w-[14rem] lg:max-w-none ${row.unread ? "font-semibold" : ""}`}
              >
                <span className="line-clamp-2 sm:line-clamp-none">{row.title}</span>
              </button>
            ),
          },
          {
            key: "description",
            header: "Description",
            hideBelow: "xl",
            render: (row) => (
              <p className="line-clamp-2 text-xs text-slate-600">{row.description}</p>
            ),
          },
          {
            key: "vendor",
            header: "Vendor",
            hideBelow: "xl",
            render: (row) => row.vendor || "—",
          },
          {
            key: "type",
            header: "Type",
            hideBelow: "xl",
            render: (row) => row.type || "—",
          },
          {
            key: "amount",
            header: "Amount",
            hideBelow: "xl",
            render: (row) => row.amount || "—",
          },
          {
            key: "items",
            header: "Items",
            hideBelow: "xl",
            render: (row) => (
              <p className="line-clamp-1 text-xs">{row.items || "—"}</p>
            ),
          },
          {
            key: "closed",
            header: "Closed",
            hideBelow: "lg",
            className: "whitespace-nowrap",
            render: (row) => row.closed ?? "—",
          },
          {
            key: "actions",
            header: "",
            className:
              "sticky right-0 z-[1] whitespace-nowrap bg-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.12)] [.group:hover_&]:bg-slate-50",
            render: (row) => (
              <OptionsDropdown
                options={[
                  {
                    label: "View",
                    onClick: () => openDetail(row),
                  },
                  ...(route.tab === "current"
                    ? [
                        {
                          label: "Archive",
                          onClick: () => {
                            pendingIdRef.current = row.id;
                            void archiveApprovalRun();
                          },
                        },
                      ]
                    : []),
                ]}
              />
            ),
          },
        ]}
        mobileCard={(row) => (
          <AdminMobileCard
            title={
              <span className={row.unread ? "font-semibold" : undefined}>
                {row.title}
                {row.unread ? (
                  <span className="ml-2 inline-block align-middle">
                    <UnreadBadge />
                  </span>
                ) : null}
              </span>
            }
            subtitle={row.created}
            badges={<StatusBadge status={row.status} />}
            fields={[
              {
                label: "Votes",
                value: (
                  <span className="inline-flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <FaCheck />
                      {row.approvedVotes}
                    </span>
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <FaTimes />
                      {row.disapprovedVotes}
                    </span>
                  </span>
                ),
              },
              { label: "Summary", value: row.votes },
              ...(row.amount ? [{ label: "Amount", value: row.amount }] : []),
              ...(row.vendor ? [{ label: "Vendor", value: row.vendor }] : []),
            ]}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => openDetail(row)}
                  className="flex-1 rounded bg-[#3476ef] px-3 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
                >
                  View approval
                </button>
                {route.tab === "current" && (
                  <button
                    type="button"
                    onClick={() => {
                      pendingIdRef.current = row.id;
                      void archiveApprovalRun();
                    }}
                    className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Archive
                  </button>
                )}
              </>
            }
            highlight={row.unread}
          />
        )}
      />

      <BoardApprovalTopicModal
        open={topicOpen}
        onClose={() => setTopicOpen(false)}
        onSubmit={async (input) => {
          pendingCreateRef.current = input;
          await createTopicRun();
        }}
      />

      <BoardApprovalExportModal open={exportOpen} onClose={() => setExportOpen(false)} items={items} />

      <BoardApprovalDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
    </>
  );
}
