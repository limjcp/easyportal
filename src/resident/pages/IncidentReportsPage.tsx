import { useCallback, useState } from "react";
import { CrudPanel } from "../../shared/CrudPanel";
import { EmptyState } from "../../shared/EmptyState";
import { useResidentIncidentReports } from "../../shared/queries/residentListQueries";
import { useBuildingListRefresh } from "../../shared/queries/mutationHelpers";
import { queryKeys } from "../../shared/queryKeys";
import { useInvalidatePortalQueries } from "../../shared/queries/useInvalidatePortalQueries";
import { useTenantContext } from "../../shared/queries/useTenantContext";
import { isQueryPageLoading } from "../../shared/useQueryPageBusy";
import { useSyncFromRefreshKey } from "../../shared/useSyncFromRefreshKey";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { IncidentReportDetailModal } from "../modals/IncidentReportDetailModal";
import type { IncidentReport } from "../data/types";

type IncidentReportsPageProps = {
  onAddNew: () => void;
  refreshKey?: number;
};

function statusClass(status: string): string {
  if (status === "Resolved") return "bg-[#5cb85c] text-white";
  if (status === "Pending") return "bg-amber-500 text-white";
  return "bg-slate-500 text-white";
}

export function IncidentReportsPage({ onAddNew, refreshKey = 0 }: IncidentReportsPageProps) {
  const { queryClient } = useInvalidatePortalQueries();
  const { userId, buildingId } = useTenantContext();
  const listQueryKey =
    userId && buildingId ? queryKeys.building.residentIncidentReports(userId, buildingId) : null;
  const reportsQuery = useResidentIncidentReports();
  const { data: items = [], error, refetch } = reportsQuery;
  const pageLoading = isQueryPageLoading(reportsQuery);
  const { refreshList } = useBuildingListRefresh<IncidentReport>(
    queryClient,
    buildingId,
    listQueryKey,
    refetch
  );
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    await refreshList();
  }, [refreshList]);

  useSyncFromRefreshKey(refreshKey, () => void reload());

  const loadError = error instanceof Error ? error.message : error ? "Failed to load incident reports." : null;

  if (loadError) {
    return (
      <div className="rounded-sm bg-white/95 p-4 text-sm text-red-700 shadow-lg">
        {loadError}
      </div>
    );
  }

  if (!pageLoading && items.length === 0) {
    return (
      <CrudPanel>
        <EmptyState
        title="There are no Reports"
        subtitle="Would you like to create a new Report?"
        action={
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
          >
            + Add New!
          </button>
        }
        />
      </CrudPanel>
    );
  }

  return (
    <CrudPanel loading={pageLoading}>
      <div className="rounded-sm bg-white/95 p-4 shadow-lg">
        <ModuleMessageBanner moduleId="incidentReport" />
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={onAddNew} className="rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:bg-[#2d68cf]">
            + Add New!
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedReportId(item.id)}
              className={`w-full rounded border p-4 text-left text-sm transition hover:border-[#3476ef] hover:bg-slate-50 ${
                item.unread ? "border-[#3476ef]/40 bg-slate-50/80" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium text-slate-800">{item.reportType}</span>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${statusClass(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-slate-600">{item.description}</p>
              <p className="mt-2 text-xs text-slate-500">{item.createdAt}</p>
            </button>
          ))}
        </div>
      </div>

      <IncidentReportDetailModal
        open={!!selectedReportId}
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
        onUpdated={() => void reload()}
      />
    </CrudPanel>
  );
}
