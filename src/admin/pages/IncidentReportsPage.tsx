import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormAlert } from "../../shared/FormAlert";
import { ConfirmModal } from "../../shared/ConfirmModal";
import { CrudPanel } from "../../shared/CrudPanel";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useAdminIncidentReports } from "../../shared/queries/adminListQueries";
import { useBuildingListRefresh } from "../../shared/queries/mutationHelpers";
import { queryKeys } from "../../shared/queryKeys";
import { useInvalidatePortalQueries } from "../../shared/queries/useInvalidatePortalQueries";
import { useTenantContext } from "../../shared/queries/useTenantContext";
import { isQueryPageLoading } from "../../shared/useQueryPageBusy";
import {
  OptionsDropdown,
  SeverityBadge,
  StatusBadge,
  UnreadBadge,
} from "../components/AdminBadges";
import { AdminPanelTable, AdminTabs } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AddIncidentReportModal } from "../modals/AddIncidentReportModal";
import { IncidentCategoryModal } from "../modals/IncidentCategoryModal";
import { IncidentColumnPrefsModal } from "../modals/IncidentColumnPrefsModal";
import { IncidentContactModal } from "../modals/IncidentContactModal";
import { IncidentReportDetailModal } from "../modals/IncidentReportDetailModal";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type {
  AdminIncidentReport,
  IncidentContactEmail,
  IncidentReportCategory,
  IncidentReportStatus,
} from "../../resident/data/types";

const SEVERITY_FILTER_OPTIONS = [
  { value: "all", label: "View All" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "View All" },
  { value: "Draft", label: "Draft" },
  { value: "Pending", label: "Pending" },
  { value: "Resolved", label: "Resolved" },
];

const PENDING_REPLY_FILTER_OPTIONS = [
  { value: "all", label: "View All" },
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "N/A", label: "N/A" },
];

type IncidentReportsPageProps = {
  route: AdminRoute & { page: "incident-reports" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function IncidentReportsPage({
  route,
  onNavigate,
  refreshKey,
  onRefresh,
}: IncidentReportsPageProps) {
  const { queryClient } = useInvalidatePortalQueries();
  const { userId, buildingId } = useTenantContext();
  const isListTab = route.tab === "current" || route.tab === "archived";
  const listQueryKey =
    userId && buildingId && isListTab
      ? queryKeys.building.adminIncidentReports(userId, buildingId, route.tab)
      : null;
  const incidentQuery = useAdminIncidentReports(route.tab);
  const { data: tabData = [], refetch } = incidentQuery;
  const { refreshList } = useBuildingListRefresh<AdminIncidentReport>(
    queryClient,
    buildingId,
    listQueryKey,
    refetch
  );
  const reports =
    route.tab === "current" || route.tab === "archived"
      ? (tabData as AdminIncidentReport[])
      : [];
  const categories = route.tab === "categories" ? (tabData as IncidentReportCategory[]) : [];
  const emails = route.tab === "contact-emails" ? (tabData as IncidentContactEmail[]) : [];
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingReplyFilter, setPendingReplyFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [contactEdit, setContactEdit] = useState<IncidentContactEmail | null | "new">(null);
  const [categoryEdit, setCategoryEdit] = useState<IncidentReportCategory | null | "new">(null);
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  const pendingIdRef = useRef<string | null>(null);
  const pendingCreateRef = useRef<Parameters<typeof adminRepository.createIncidentReport>[0] | null>(null);
  const pendingContactRef = useRef<{ email: string; status: "active" | "inactive"; id?: string; isNew: boolean } | null>(null);
  const pendingCategorySubmitRef = useRef<{ name: string; status: "active" | "inactive"; id?: string; isNew: boolean } | null>(null);

  const syncFromRefreshKey = useCallback(() => {
    void refreshList();
  }, [refreshList]);

  const handleRefresh = useCallback(async () => {
    await refreshList();
    onRefresh();
  }, [onRefresh, refreshList]);

  const patchListItem = useCallback(
    (updated: AdminIncidentReport) => {
      void refreshList(updated);
    },
    [refreshList]
  );

  useEffect(() => {
    if (refreshKey === 0) return;
    syncFromRefreshKey();
  }, [refreshKey, syncFromRefreshKey]);

  useEffect(() => {
    setPage(1);
  }, [route.tab]);

  const { run: archiveReportRun, error: archiveError } = useAsyncAction(
    useCallback(async () => {
      const id = pendingIdRef.current;
      if (!id) return;
      await adminRepository.archiveIncidentReport(id);
      handleRefresh();
    }, [handleRefresh]),
    { successMessage: "Report archived." }
  );

  const { run: deleteContactRun, loading: deletingContact, error: contactDeleteError } = useAsyncAction(
    useCallback(async () => {
      const id = pendingIdRef.current;
      if (!id) return;
      await adminRepository.deleteIncidentContactEmail(id);
      setDeleteContactOpen(false);
      pendingIdRef.current = null;
      handleRefresh();
    }, [handleRefresh]),
    { successMessage: "Contact deleted." }
  );

  const { run: createReportRun } = useAsyncAction(
    useCallback(async () => {
      const input = pendingCreateRef.current;
      if (!input) return;
      await adminRepository.createIncidentReport(input);
      handleRefresh();
    }, [handleRefresh]),
    { successMessage: "Incident report created." }
  );

  const { run: submitContactRun } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingContactRef.current;
      if (!pending) return;
      if (pending.isNew) {
        await adminRepository.createIncidentContactEmail(pending.email);
      } else if (pending.id) {
        await adminRepository.updateIncidentContactEmail(pending.id, {
          email: pending.email,
          status: pending.status,
        });
      }
      handleRefresh();
    }, [handleRefresh]),
    { successMessage: "Contact saved." }
  );

  const { run: submitCategoryRun } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingCategorySubmitRef.current;
      if (!pending) return;
      if (pending.isNew) {
        await adminRepository.createIncidentCategory(pending.name, pending.status);
      } else if (pending.id) {
        await adminRepository.updateIncidentCategory(pending.id, { name: pending.name, status: pending.status });
      }
      handleRefresh();
    }, [handleRefresh]),
    { successMessage: "Category saved." }
  );

  const actionError = archiveError ?? contactDeleteError;

  const filteredReports = useMemo(() => {
    return reports.filter((row) => {
      if (severityFilter !== "all" && row.severity !== severityFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (pendingReplyFilter !== "all" && row.pendingReply !== pendingReplyFilter) return false;
      if (unitFilter !== "all" && row.unit !== unitFilter) return false;
      if (ownerFilter !== "all" && row.resident !== ownerFilter) return false;
      return true;
    });
  }, [reports, severityFilter, statusFilter, pendingReplyFilter, unitFilter, ownerFilter]);

  const unitOptions = useMemo(
    () => [
      { value: "all", label: "View All" },
      ...Array.from(new Set(reports.map((r) => r.unit).filter((v): v is string => !!v)))
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ],
    [reports]
  );

  const ownerOptions = useMemo(
    () => [
      { value: "all", label: "View All" },
      ...Array.from(new Set(reports.map((r) => r.resident).filter((v): v is string => !!v)))
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ],
    [reports]
  );

  const tabs = [
    { id: "current" as const, label: "Current Reports" },
    { id: "archived" as const, label: "Archived Reports" },
    { id: "contact-emails" as const, label: "Contact Emails" },
    { id: "categories" as const, label: "Report Categories" },
  ];

  const openDetail = (row: AdminIncidentReport) => {
    if (row.unread) {
      adminRepository.markIncidentReportRead(row.id).then(handleRefresh);
    }
    setDetailId(row.id);
  };

  const reportPanelTitle =
    route.tab === "archived" ? "Archived Incident Reports" : "Incident Reports";

  const showReportActions = route.tab === "current" || route.tab === "archived";

  return (
    <CrudPanel loading={isQueryPageLoading(incidentQuery)}>
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          showReportActions ? (
            <div className="flex flex-wrap gap-2">
              {route.tab === "current" && (
                <button
                  type="button"
                  onClick={() => setPrefsOpen(true)}
                  className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:opacity-90"
                >
                  Change Column Display Defaults
                </button>
              )}
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
              >
                + Add an Incident Report
              </button>
            </div>
          ) : route.tab === "contact-emails" ? (
            <button
              type="button"
              onClick={() => setContactEdit("new")}
              className="inline-flex items-center gap-2 rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
            >
              + Add a Contact
            </button>
          ) : route.tab === "categories" ? (
            <button
              type="button"
              onClick={() => setCategoryEdit("new")}
              className="inline-flex items-center gap-2 rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
            >
              + Add a Category
            </button>
          ) : undefined
        }
      />

      {actionError ? <FormAlert message={actionError} className="mb-3" /> : null}

      <AdminTabs
        tabs={tabs}
        activeTab={route.tab}
        onChange={(tab) =>
          onNavigate({
            page: "incident-reports",
            tab: tab as typeof route.tab,
          })
        }
      />

      {showReportActions && (
        <AdminPanelTable
          title={reportPanelTitle}
          headerColor="red"
          data={filteredReports}
          search={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          filters={[
            {
              id: "severity",
              label: "Severity",
              value: severityFilter,
              onChange: setSeverityFilter,
              options: SEVERITY_FILTER_OPTIONS,
            },
            {
              id: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: STATUS_FILTER_OPTIONS,
            },
            {
              id: "pendingReply",
              label: "Pending Reply",
              value: pendingReplyFilter,
              onChange: setPendingReplyFilter,
              options: PENDING_REPLY_FILTER_OPTIONS,
            },
            {
              id: "unit",
              label: "Unit",
              value: unitFilter,
              onChange: setUnitFilter,
              options: unitOptions,
            },
            {
              id: "owner",
              label: "Owner",
              value: ownerFilter,
              onChange: setOwnerFilter,
              options: ownerOptions,
            },
          ]}
          columns={[
            {
              key: "id",
              header: "ID",
              className: "whitespace-nowrap",
              render: (row) => (
                <div className={row.unread ? "font-semibold" : undefined}>
                  {row.id}
                  {row.unread && (
                    <div className="mt-1">
                      <UnreadBadge />
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "severity",
              header: "Severity",
              render: (row) => <SeverityBadge severity={row.severity} />,
            },
            {
              key: "date",
              header: "Incident Date",
              className: "whitespace-nowrap",
              render: (row) => row.incidentDate,
            },
            {
              key: "assigned",
              header: "Assigned",
              hideBelow: "lg",
              className: "whitespace-nowrap text-xs",
              render: (row) => row.assignedToAdmin ?? "—",
            },
            {
              key: "user",
              header: "User",
              render: (row) => (
                <span className={row.unread ? "font-semibold" : ""}>{row.createdBy}</span>
              ),
            },
            {
              key: "unit",
              header: "Unit",
              hideBelow: "lg",
              render: (row) => row.unit ?? "—",
            },
            {
              key: "type",
              header: "Type",
              render: (row) => row.reportType,
            },
            {
              key: "location",
              header: "Location",
              hideBelow: "xl",
              render: (row) => (
                <span className="line-clamp-2 text-xs">{row.location}</span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatusBadge status={row.status as IncidentReportStatus} />,
            },
            {
              key: "pendingReply",
              header: "Pending Reply",
              render: (row) => row.pendingReply ?? "N/A",
            },
            {
              key: "resolution",
              header: "Resolution Time",
              hideBelow: "xl",
              className: "whitespace-nowrap text-xs",
              render: (row) => row.resolutionTime ?? "—",
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
              key: "actions",
              header: "",
              className:
                "sticky right-0 z-[1] whitespace-nowrap bg-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.12)] [.group:hover_&]:bg-slate-50",
              render: (row) => (
                <OptionsDropdown
                  options={[
                    { label: "View", onClick: () => openDetail(row) },
                    ...(route.tab === "current"
                      ? [
                          {
                            label: "Archive",
                            onClick: () => {
                              pendingIdRef.current = row.id;
                              void archiveReportRun();
                            },
                          },
                        ]
                      : []),
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {route.tab === "contact-emails" && (
        <>
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-slate-700">
            <p className="font-semibold">Incident Report Contacts</p>
            <p className="mt-1 text-xs">
              Any addresses entered here will be available for selection when emailing Incident Reports.
            </p>
          </div>
          <AdminPanelTable
            title="Incident Report Contacts"
            headerColor="red"
            data={emails}
            search={search}
            onSearchChange={setSearch}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            page={page}
            onPageChange={setPage}
            columns={[
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <StatusBadge status={row.status === "active" ? "Active" : "inactive"} />
                ),
              },
              { key: "email", header: "Email Address", render: (row) => row.email },
              {
                key: "actions",
                header: "",
                render: (row) => (
                  <OptionsDropdown
                    options={[
                      {
                        label: "Edit",
                        onClick: () => setContactEdit(row),
                      },
                      {
                        label: "Delete",
                        onClick: () => {
                          pendingIdRef.current = row.id;
                          setDeleteContactOpen(true);
                        },
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        </>
      )}

      {route.tab === "categories" && (
        <AdminPanelTable
          title="Incident Report Categories"
          headerColor="red"
          data={categories}
          search={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          columns={[
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <StatusBadge status={row.status === "active" ? "Active" : "inactive"} />
              ),
            },
            {
              key: "name",
              header: "Category",
              render: (row) => <span className="font-medium">{row.name}</span>,
            },
            {
              key: "usage",
              header: "Usage",
              render: (row) => row.usageCount,
            },
            {
              key: "actions",
              header: "",
              render: (row) => (
                <button
                  type="button"
                  onClick={() => setCategoryEdit(row)}
                  className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
                >
                  Edit
                </button>
              ),
            },
          ]}
        />
      )}

      <AddIncidentReportModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (input) => {
          pendingCreateRef.current = input;
          await createReportRun();
        }}
      />

      <IncidentColumnPrefsModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />

      <IncidentReportDetailModal
        open={!!detailId}
        reportId={detailId}
        onClose={() => setDetailId(null)}
        onUpdated={patchListItem}
        archived={route.tab === "archived"}
        onViewRelated={(unit, owner) => {
          setUnitFilter(unit);
          setOwnerFilter(owner);
          setPage(1);
          setDetailId(null);
        }}
      />

      <IncidentContactModal
        open={contactEdit !== null}
        contact={contactEdit === "new" ? null : contactEdit}
        onClose={() => setContactEdit(null)}
        onSubmit={async (email, status) => {
          pendingContactRef.current = {
            email,
            status,
            id: contactEdit === "new" ? undefined : contactEdit?.id,
            isNew: contactEdit === "new",
          };
          await submitContactRun();
        }}
      />

      <IncidentCategoryModal
        open={categoryEdit !== null}
        category={categoryEdit === "new" ? null : categoryEdit}
        onClose={() => setCategoryEdit(null)}
        onSubmit={async (name, status) => {
          pendingCategorySubmitRef.current = {
            name,
            status,
            id: categoryEdit === "new" ? undefined : categoryEdit?.id,
            isNew: categoryEdit === "new",
          };
          await submitCategoryRun();
        }}
      />

      <ConfirmModal
        open={deleteContactOpen}
        onClose={() => {
          if (deletingContact) return;
          setDeleteContactOpen(false);
          pendingIdRef.current = null;
        }}
        title="Delete Contact Email"
        message="Delete this contact email?"
        variant="danger"
        loading={deletingContact}
        onConfirm={() => void deleteContactRun()}
      />
    </>
    </CrudPanel>
  );
}
