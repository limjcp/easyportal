import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import {
  useAdminServiceCategories,
  useAdminServiceRequestTerms,
  useAdminServiceRequests,
} from "../../shared/queries/adminListQueries";
import { useInvalidatePortalQueries } from "../../shared/queries/useInvalidatePortalQueries";
import {
  ActionRequiredBadge,
  SeverityBadge,
  StatusBadge,
} from "../components/AdminBadges";
import { AdminPanelTable, AdminTabs } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AdminServiceRequestModal } from "../modals/AdminServiceRequestModal";
import { ServiceRequestDetailModal } from "../modals/ServiceRequestDetailModal";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { AdminServiceRequest } from "../../resident/data/types";

type ServiceRequestsPageProps = {
  route: AdminRoute & { page: "service-requests" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

export function ServiceRequestsPage({
  route,
  onNavigate,
  refreshKey,
  onRefresh,
}: ServiceRequestsPageProps) {
  const { invalidateBuilding } = useInvalidatePortalQueries();
  const isArchivedTab = route.tab === "archived";
  const isListTab = route.tab !== "categories" && route.tab !== "terms";
  const { data: requests = [] } = useAdminServiceRequests(route.tab, isArchivedTab);
  const { data: categories = [] } = useAdminServiceCategories();
  const { data: loadedTerms = "" } = useAdminServiceRequestTerms();
  const [terms, setTerms] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingFilter, setPendingFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showColumns, setShowColumns] = useState(true);
  const pendingCategoryRef = useRef<{ id: string; fee?: string } | null>(null);
  const pendingCreateRef = useRef<Parameters<typeof adminRepository.createServiceRequest>[0] | null>(null);

  void refreshKey;
  void isListTab;

  useEffect(() => {
    if (route.tab === "terms") setTerms(loadedTerms);
  }, [loadedTerms, route.tab]);

  const handleRefresh = useCallback(() => {
    invalidateBuilding();
    onRefresh();
  }, [invalidateBuilding, onRefresh]);

  const { run: updateCategoryRun, error: categoryError } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingCategoryRef.current;
      if (!pending?.fee) return;
      await adminRepository.updateServiceCategory(pending.id, { fee: pending.fee || undefined });
      handleRefresh();
    }, [handleRefresh]),
    { successMessage: "Category updated.", showErrorToast: false }
  );

  const { run: saveTerms, loading: savingTerms, error: termsError } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.updateServiceRequestTerms(terms);
    }, [terms]),
    { successMessage: "Terms saved.", showErrorToast: false }
  );

  const { run: createRequestRun } = useAsyncAction(
    useCallback(async () => {
      const input = pendingCreateRef.current;
      if (!input) return;
      await adminRepository.createServiceRequest(input);
      handleRefresh();
    }, [handleRefresh]),
    { successMessage: "Service request created." }
  );

  const actionError = categoryError ?? termsError;

  const filtered = requests.filter((r) => {
    if (severityFilter !== "all" && r.adminSeverity !== severityFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (pendingFilter === "yes" && !r.pendingReply) return false;
    if (pendingFilter === "no" && r.pendingReply) return false;
    if (unitFilter !== "all" && r.unit !== unitFilter) return false;
    if (ownerFilter !== "all" && r.resident !== ownerFilter) return false;
    return true;
  });

  const unitOptions = useMemo(
    () => [
      { value: "all", label: "View All" },
      ...Array.from(new Set(requests.map((r) => r.unit).filter((v): v is string => !!v)))
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ],
    [requests]
  );

  const ownerOptions = useMemo(
    () => [
      { value: "all", label: "View All" },
      ...Array.from(new Set(requests.map((r) => r.resident).filter((v): v is string => !!v)))
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ],
    [requests]
  );

  const tabLabels: Record<string, string> = {
    current: "Current Service Requests",
    archived: "Archived Service Requests",
    categories: "Service Request Categories",
    terms: "Service Request Terms",
  };

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          (route.tab === "current" || route.tab === "archived") && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded bg-[#e8913a] px-3 py-1.5 text-sm text-white hover:bg-[#d8822f]"
            >
              + Add a Service Request
            </button>
          )
        }
      />

      <AdminTabs
        tabs={[
          { id: "current", label: "Current Service Requests" },
          { id: "archived", label: "Archived Service Requests" },
          { id: "categories", label: "Service Request Categories" },
          { id: "terms", label: "Service Request Terms" },
        ]}
        activeTab={route.tab}
        onChange={(tab) =>
          onNavigate({
            page: "service-requests",
            tab: tab as "current" | "archived" | "categories" | "terms",
          })
        }
      />

      {(route.tab === "current" || route.tab === "archived") && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-[#79d0df] px-3 py-1 text-sm text-white"
            >
              Change Column Display Defaults
            </button>
          </div>
          <AdminPanelTable
            title={tabLabels[route.tab]}
            headerColor="orange"
            data={filtered}
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
                options: [
                  { value: "all", label: "View All" },
                  { value: "High", label: "High" },
                  { value: "Medium", label: "Medium" },
                  { value: "Low", label: "Low" },
                ],
              },
              {
                id: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: "all", label: "View All" },
                  { value: "Received", label: "Received" },
                  { value: "Resolved", label: "Resolved" },
                  { value: "Pending", label: "Pending" },
                ],
              },
              {
                id: "pending",
                label: "Pending Reply",
                value: pendingFilter,
                onChange: setPendingFilter,
                options: [
                  { value: "all", label: "View All" },
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ],
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
            toolbarExtra={
              <div className="flex gap-2">
                <button type="button" className="rounded border border-slate-300 px-2 py-1 text-xs">
                  Tools
                </button>
                <button
                  type="button"
                  onClick={() => setShowColumns(!showColumns)}
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                >
                  Toggle Columns
                </button>
              </div>
            }
            columns={[
              { key: "id", header: "ID", render: (row) => row.id },
              {
                key: "severity",
                header: "!",
                render: (row) => <SeverityBadge severity={row.adminSeverity} />,
              },
              { key: "date", header: "Date", render: (row) => row.createdAt },
              ...(showColumns
                ? [{ key: "assigned", header: "Assigned To", render: (row: AdminServiceRequest) => row.assignedTo }]
                : []),
              { key: "user", header: "User", render: (row) => row.resident },
              { key: "unit", header: "Unit", render: (row) => row.unit, hideBelow: "lg" },
              { key: "type", header: "Type", render: (row) => row.adminCategory },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: "ar",
                header: "AR",
                render: (row) => <ActionRequiredBadge required={row.actionRequired} />,
              },
              {
                key: "view",
                header: "View",
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => setDetailId(row.id)}
                    className="text-[#3476ef] hover:underline"
                  >
                    View
                  </button>
                ),
              },
            ]}
          />
        </>
      )}

      {route.tab === "categories" && (
        <AdminPanelTable
          title="Service Request"
          headerColor="orange"
          data={categories}
          search={search}
          onSearchChange={setSearch}
          pageSize={5}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          columns={[
            {
              key: "status",
              header: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
            { key: "category", header: "Category", render: (row) => row.name },
            { key: "fee", header: "Fee", render: (row) => row.fee ?? "" },
            { key: "usage", header: "Usage", render: (row) => row.usageCount },
            {
              key: "edit",
              header: "Actions",
              render: (row) => (
                <button
                  type="button"
                  onClick={() => {
                    const fee = prompt("Edit fee (leave blank for none):", row.fee ?? "");
                    if (fee !== null) {
                      pendingCategoryRef.current = { id: row.id, fee };
                      void updateCategoryRun();
                    }
                  }}
                  className="rounded bg-[#3476ef] px-2 py-1 text-xs text-white"
                >
                  Edit
                </button>
              ),
            },
          ]}
        />
      )}

      {route.tab === "terms" && (
        <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
          <div className="bg-[#e8913a] px-4 py-2 text-sm font-semibold text-white">
            Service Request Terms
          </div>
          <div className="p-4">
            {actionError ? <FormAlert message={actionError} className="mb-3" /> : null}
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={12}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <ActionButton
              label="Save Terms"
              loading={savingTerms}
              loadingLabel="Saving…"
              className="mt-3"
              onClick={() => void saveTerms()}
            />
          </div>
        </div>
      )}

      <AdminServiceRequestModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (input) => {
          pendingCreateRef.current = input;
          await createRequestRun();
        }}
      />

      <ServiceRequestDetailModal
        open={!!detailId}
        requestId={detailId}
        onClose={() => setDetailId(null)}
        onUpdated={handleRefresh}
        onViewRelated={(unit, owner) => {
          setUnitFilter(unit);
          setOwnerFilter(owner);
          setPage(1);
          setDetailId(null);
        }}
      />
    </>
  );
}
