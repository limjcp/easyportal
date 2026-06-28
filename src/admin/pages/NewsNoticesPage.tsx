import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaChevronDown,
  FaEdit,
  FaNewspaper,
  FaPlus,
  FaQuestionCircle,
} from "react-icons/fa";
import { ActionButton } from "../../shared/ActionButton";
import { CrudPanel } from "../../shared/CrudPanel";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useLocalList } from "../../shared/useLocalList";
import { DeliveryBadge, OptionsDropdown, StatusBadge } from "../components/AdminBadges";
import { AdminPanelTable, AdminModuleTabs, type SortDirection } from "../components/AdminPanelTable";
import { AdminMobileCard } from "../components/AdminMobileCard";
import { adminRepository } from "../data/adminRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import { EmailNoticesReportModal } from "../modals/EmailNoticesReportModal";
import type { AdminRoute } from "../navigation";
import type { AdminNewsItem } from "../../resident/data/types";

const NEWS_TEMPLATES = [{ id: "907", name: "News & Notices with MVP Logo" }];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "View All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
];

const TAB_OPTIONS = [
  { id: "current", label: "Current" },
  { id: "archived", label: "Archived" },
] as const;

function bodyPreview(body: string) {
  const plain = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length <= 48 ? plain : `${plain.slice(0, 48)}...`;
}

function isNewsExpired(item: AdminNewsItem): boolean {
  if (!item.expires) return false;
  const today = new Date().toISOString().slice(0, 10);
  return item.expires < today;
}

function getNewsDisplayStatus(item: AdminNewsItem): string {
  if (item.status === "draft") return "draft";
  if (item.status === "archived") return "archived";
  if (isNewsExpired(item)) return "expired";
  return item.status;
}

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
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [emailReportItem, setEmailReportItem] = useState<AdminNewsItem | null>(null);
  const pendingIdRef = useRef<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [route.tab, refreshKey, statusFilter]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === "all") return true;
      return getNewsDisplayStatus(item) === statusFilter;
    });
  }, [items, statusFilter]);

  const handleSortChange = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

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

  const handleTabChange = (tab: string) => {
    onNavigate({ page: "news-notices", tab: tab as "current" | "archived" });
  };

  return (
    <CrudPanel loading={loading}>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {createError ? <FormAlert message={createError} className="w-full" /> : null}
            <EditTemplatesDropdown />
            <ActionButton
              label="Add a New News/Notice"
              loading={creating}
              loadingLabel="Creating…"
              onClick={() => void createNewsRun()}
              className="!bg-[#7D5DA7] hover:!bg-[#6b4f94]"
            />
          </div>
        }
      />

      <AdminModuleTabs tabs={[...TAB_OPTIONS]} activeTab={route.tab} onChange={handleTabChange} />

      <AdminPanelTable
        title="News & Notices"
        titleIcon={<FaNewspaper aria-hidden />}
        data={filtered}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="search"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        pageSizeChoices={[10, 25, 50, -1]}
        page={page}
        onPageChange={setPage}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        filters={
          route.tab === "current"
            ? [
                {
                  id: "status",
                  label: "Status:",
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
            className: "text-center",
            sortable: true,
            sortValue: (row) => getNewsDisplayStatus(row),
            render: (row) => (
              <div className="text-center">
                <StatusBadge status={getNewsDisplayStatus(row)} />
              </div>
            ),
          },
          {
            key: "date",
            header: "Date",
            className: "text-center",
            sortable: true,
            sortValue: (row) => row.date,
            render: (row) => <div className="text-center">{row.date}</div>,
          },
          {
            key: "expires",
            header: "Expires",
            className: "text-center",
            sortable: true,
            sortValue: (row) => row.expires ?? "",
            render: (row) => <div className="text-center">{row.expires ?? ""}</div>,
          },
          {
            key: "title",
            header: "Title/Body",
            sortable: true,
            sortValue: (row) => row.title,
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-800">{row.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{bodyPreview(row.body)}</p>
              </div>
            ),
          },
          {
            key: "email",
            header: (
              <span className="inline-flex items-center justify-center gap-1">
                Email Notices
                <FaQuestionCircle
                  className="cursor-help text-[#3476ef]"
                  title="Please allow several minutes after submitting the post for this data to be collected. This data is only displayed for postings submitted on/after 05-02-2023."
                  aria-hidden
                />
              </span>
            ),
            className: "text-center",
            render: (row) =>
              row.emailTotal > 0 ? (
                <div className="text-center">
                  <button type="button" onClick={() => setEmailReportItem(row)} className="inline-block">
                    <DeliveryBadge delivered={row.emailDelivered} total={row.emailTotal} />
                  </button>
                </div>
              ) : (
                <div className="text-center text-slate-400">—</div>
              ),
          },
          {
            key: "options",
            header: "",
            className: "text-center",
            render: (row) => (
              <div className="text-center">
                <OptionsDropdown
                  options={[
                    {
                      label: "View/Edit Notice",
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
              </div>
            ),
          },
        ]}
        getRowKey={(row) => row.id}
        mobileCard={(row) => (
          <AdminMobileCard
            title={row.title}
            subtitle={row.date}
            badges={<StatusBadge status={getNewsDisplayStatus(row)} />}
            fields={[
              ...(row.expires ? [{ label: "Expires", value: row.expires }] : []),
              { label: "Preview", value: bodyPreview(row.body) || "—" },
              {
                label: "Email",
                value:
                  row.emailTotal > 0 ? (
                    <DeliveryBadge delivered={row.emailDelivered} total={row.emailTotal} />
                  ) : (
                    "—"
                  ),
              },
            ]}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="flex-1 rounded bg-[#3476ef] px-3 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
                >
                  View / edit
                </button>
                {row.emailTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => setEmailReportItem(row)}
                    className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Email report
                  </button>
                )}
                {route.tab === "current" ? (
                  <button
                    type="button"
                    onClick={() => handleArchive(row.id)}
                    className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Archive
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRestore(row.id)}
                    className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Restore
                  </button>
                )}
              </>
            }
            highlight={getNewsDisplayStatus(row) === "draft"}
          />
        )}
      />

      <EmailNoticesReportModal
        open={!!emailReportItem}
        item={emailReportItem}
        onClose={() => setEmailReportItem(null)}
      />
    </CrudPanel>
  );
}

function EditTemplatesDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleTemplateAction = (action: "add" | "edit", name?: string) => {
    setOpen(false);
    if (action === "add") {
      window.alert("Add template — coming soon.");
      return;
    }
    window.alert(`Edit template "${name}" — coming soon.`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <FaEdit aria-hidden />
        Edit Templates
        <FaChevronDown className="text-[10px]" aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 min-w-[240px] rounded border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleTemplateAction("add")}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <FaPlus className="text-xs" aria-hidden />
            Add a New Template
          </button>
          <div className="my-1 border-t border-slate-200" />
          {NEWS_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              role="menuitem"
              onClick={() => handleTemplateAction("edit", template.name)}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <FaEdit className="text-xs" aria-hidden />
              {template.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
