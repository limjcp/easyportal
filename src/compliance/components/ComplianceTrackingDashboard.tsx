import type { ComplianceDashboardData } from "../types";
import { CaoCalendarPanel } from "./CaoCalendarPanel";
import { ComplianceScoreCard } from "./ComplianceScoreCard";
import { DeadlineProgressList } from "./DeadlineProgressList";
import { DirectorTrainingPanel } from "./DirectorTrainingPanel";

type ComplianceTrackingDashboardProps = {
  data: ComplianceDashboardData;
  mode: "admin" | "demo";
  loading?: boolean;
  error?: string | null;
  onSync?: () => void;
  syncing?: boolean;
  onUpdateObligation?: (id: string, progressPercent: number) => void;
  onToggleTraining?: (id: string, completed: boolean) => void;
  onUpdateCertificate?: (id: string, certificateId: string) => void;
};

export function ComplianceTrackingDashboard({
  data,
  mode,
  loading = false,
  error,
  onSync,
  syncing = false,
  onUpdateObligation,
  onToggleTraining,
  onUpdateCertificate,
}: ComplianceTrackingDashboardProps) {
  const variant = mode === "demo" ? "marketing" : "admin";
  const editable = mode === "admin";

  if (loading) {
    return <p className="py-12 text-center text-muted-foreground">Loading compliance dashboard…</p>;
  }

  if (error) {
    return <p className="py-12 text-center text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Corporation</p>
          <p className="text-lg font-medium">{data.profile.corpNumber || "—"}</p>
          <p className="text-sm text-muted-foreground">
            Region: {data.profile.caoRegion}
            {data.profile.lastSyncedAt && (
              <> · Last synced {new Date(data.profile.lastSyncedAt).toLocaleString()}</>
            )}
          </p>
          {data.profile.syncStatus === "fallback" && (
            <p className="mt-2 text-sm text-amber-700">
              CAO scrape unavailable — showing calculated deadlines.
              {data.profile.syncError ? ` (${data.profile.syncError})` : ""}
            </p>
          )}
        </div>
        {editable && onSync && (
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="w-full shrink-0 rounded-sm bg-[#3476ef] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
          >
            {syncing ? "Syncing…" : "Sync from CAO"}
          </button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <ComplianceScoreCard score={data.score} variant={variant} />
        <CaoCalendarPanel obligations={data.obligations} variant={variant} />
      </div>

      <DeadlineProgressList
        obligations={data.obligations}
        editable={editable}
        onUpdate={onUpdateObligation}
        variant={variant}
      />

      <DirectorTrainingPanel
        records={data.training}
        editable={editable}
        onToggleComplete={onToggleTraining}
        onUpdateCertificate={onUpdateCertificate}
        variant={variant}
      />
    </div>
  );
}
