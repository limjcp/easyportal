import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionButton } from "../../shared/ActionButton";
import { CrudPanel } from "../../shared/CrudPanel";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useLocalList } from "../../shared/useLocalList";
import { DeliveryBadge, OptionsDropdown, StatusBadge } from "../components/AdminBadges";
import { AdminPanelTable, AdminTabs } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import { EmailNoticesReportModal } from "../modals/EmailNoticesReportModal";
import type { AdminRoute } from "../navigation";
import type { AdminNewsItem } from "../../resident/data/types";

function bodyPreview(body: string) {
  const plain = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length <= 48 ? plain : `${plain.slice(0, 48)}...`;
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "View All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
];

type NewsNoticesPageProps = {
  route: AdminRoute & { page: "news-notices" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function NewsNoticesPage({ route, onNavigate, refreshKey, onRefresh }: NewsNoticesPageProps) {
  const { data: items, reload, loading } = useLocalList(
    useCallback(() => adminRepository.getNews(route.tab), [route.tab]),
    refreshKey
  );
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [emailReportItem, setEmailReportItem] = useState<AdminNewsItem | null>(null);
  const pendingIdRef = useRef<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [route.tab, refreshKey]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
  }, [items, statusFilter]);

  const openEdit = (row: AdminNewsItem) => {
    onNavigate({ page: "news-notice-edit", id: row.id });
  };

  const { run: archiveNewsRun } = useAsyncAction(
    useCallback(async () => {
      const id = pendingIdRef.current;
      if (!id) return;
      await adminRepository.archiveNews(id);
      onRefresh();
      await reload();
    }, [onRefresh, reload]),
    { successMessage: "Notice archived." }
  );

  const { run: restoreNewsRun } = useAsyncAction(
    useCallback(async () => {
      const id = pendingIdRef.current;
      if (!id) return;
      await adminRepository.unarchiveNews(id);
      onRefresh();
      await reload();
    }, [onRefresh, reload]),
    { successMessage: "Notice restored." }
  );

  const { run: createNewsRun, loading: creating, error: createError } = useAsyncAction(
    useCallback(async () => {
      const item = await adminRepository.createNews("New News/Notice");
      onRefresh();
      await reload();
      onNavigate({ page: "news-notice-edit", id: item.id });
    }, [onRefresh, onNavigate, reload]),
    { successMessage: "News/notice created." }
  );

  const handleArchive = (id: string) => {
    pendingIdRef.current = id;
    void archiveNewsRun();
  };

  const handleRestore = (id: string) => {
    pendingIdRef.current = id;
    void restoreNewsRun();
  };

  return (
    <CrudPanel loading={loading}>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <>
            {createError ? <FormAlert message={createError} className="mb-2 w-full" /> : null}
            <ActionButton
              label="+ Add News/Notice"
              loading={creating}
              loadingLabel="Creating…"
              onClick={() => void createNewsRun()}
            />
          </>
        }
      />
      <AdminTabs
        tabs={[
          { id: "current", label: "Current" },
          { id: "archived", label: "Archived" },
        ]}
        activeTab={route.tab}
        onChange={(tab) =>
          onNavigate({ page: "news-notices", tab: tab as "current" | "archived" })
        }
      />
      <AdminPanelTable
        title="News & Notices"
        data={filtered}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        filters={
          route.tab === "current"
            ? [
                {
                  id: "status",
                  label: "Status",
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: STATUS_FILTER_OPTIONS,
                },
              ]
            : []
        }
        columns={[
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
          { key: "date", header: "Date", render: (row) => row.date },
          { key: "expires", header: "Expires", render: (row) => row.expires ?? "" },
          {
            key: "title",
            header: "Title/Body",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-800">{row.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{bodyPreview(row.body)}</p>
              </div>
            ),
          },
          {
            key: "email",
            header: "Email Notices",
            render: (row) =>
              row.emailTotal > 0 ? (
                <button
                  type="button"
                  onClick={() => setEmailReportItem(row)}
                  className="inline-block"
                >
                  <DeliveryBadge delivered={row.emailDelivered} total={row.emailTotal} />
                </button>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            key: "options",
            header: "Options",
            render: (row) => (
              <OptionsDropdown
                options={[
                  {
                    label: row.status === "draft" ? "View" : "View/Edit Notice",
                    onClick: () => openEdit(row),
                  },
                  ...(row.emailTotal > 0
                    ? [
                        {
                          label: "View Email Notices Report",
                          onClick: () => setEmailReportItem(row),
                        },
                      ]
                    : []),
                  ...(route.tab === "current"
                    ? [{ label: "Archive", onClick: () => handleArchive(row.id) }]
                    : [{ label: "Restore", onClick: () => handleRestore(row.id) }]),
                ]}
              />
            ),
          },
        ]}
      />

      <EmailNoticesReportModal
        open={!!emailReportItem}
        item={emailReportItem}
        onClose={() => setEmailReportItem(null)}
      />
    </CrudPanel>
  );
}
