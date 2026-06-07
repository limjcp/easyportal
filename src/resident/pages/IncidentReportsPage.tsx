import { useEffect, useState } from "react";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { IncidentReportDetailModal } from "../modals/IncidentReportDetailModal";
import { residentRepo } from "../data/mockRepository";
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
  const [items, setItems] = useState<IncidentReport[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const reload = () => {
    setLoadError(null);
    residentRepo
      .getIncidentReports()
      .then(setItems)
      .catch((err) => {
        setItems([]);
        setLoadError(err instanceof Error ? err.message : "Failed to load incident reports.");
      });
  };

  useEffect(() => {
    reload();
  }, [refreshKey]);

  if (loadError) {
    return (
      <div className="rounded-sm bg-white/95 p-4 text-sm text-red-700 shadow-lg">
        {loadError}
      </div>
    );
  }

  if (items.length === 0) {
    return (
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
    );
  }

  return (
    <>
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
                item.archived ? "border-slate-200 opacity-75" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium text-slate-800">{item.reportType}</span>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                  {item.archived ? (
                    <span className="rounded bg-slate-400 px-2 py-0.5 text-xs text-white">Archived</span>
                  ) : null}
                  <span className={`rounded px-2 py-0.5 text-xs ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <p className="mt-1 line-clamp-2 text-slate-600">{item.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                {item.location} · {item.severity} · {item.incidentDate} {item.incidentTime}
              </p>
            </button>
          ))}
        </div>
      </div>

      <IncidentReportDetailModal
        open={selectedReportId !== null}
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
        onUpdated={reload}
      />
    </>
  );
}
