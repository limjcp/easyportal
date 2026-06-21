import { useCallback, useEffect, useRef, useState } from "react";
import { ComplianceTrackingDashboard } from "../../compliance/components/ComplianceTrackingDashboard";
import type { ComplianceDashboardData } from "../../compliance/types";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { adminRepository } from "../data/adminRepository";

export function ComplianceDashboardPage() {
  const [data, setData] = useState<ComplianceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingObligationRef = useRef<{ id: string; progressPercent: number } | null>(null);
  const pendingTrainingRef = useRef<
    { id: string; completed?: boolean; certificateId?: string } | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await adminRepository.getComplianceDashboard();
      setData(dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load compliance dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { run: handleSync, loading: syncing, error: syncError } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.syncCaoCompliance({ force: true });
      await load();
    }, [load]),
    { successMessage: "CAO compliance synced.", showErrorToast: false }
  );

  const { run: updateObligationRun, error: obligationError } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingObligationRef.current;
      if (!pending || !data) return;
      const today = new Date().toISOString().slice(0, 10);
      const obligation = data.obligations.find((o) => o.id === pending.id);
      if (!obligation) return;
      const status =
        pending.progressPercent >= 100
          ? "completed"
          : obligation.dueDate < today
            ? "overdue"
            : pending.progressPercent > 0
              ? "in_progress"
              : "pending";
      await adminRepository.updateObligationProgress(pending.id, {
        progressPercent: pending.progressPercent,
        status,
        completedAt: status === "completed" ? today : null,
      });
      await load();
    }, [data, load]),
    { showSuccessToast: false, showErrorToast: false }
  );

  const { run: updateTrainingRun, error: trainingError } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingTrainingRef.current;
      if (!pending) return;
      const today = new Date().toISOString().slice(0, 10);
      if (pending.certificateId !== undefined) {
        await adminRepository.updateDirectorTraining(pending.id, {
          certificateId: pending.certificateId || null,
        });
      } else if (pending.completed !== undefined) {
        await adminRepository.updateDirectorTraining(pending.id, {
          status: pending.completed ? "completed" : "pending",
          completedAt: pending.completed ? today : null,
          hours: pending.completed ? 6 : null,
        });
      }
      await load();
    }, [load]),
    { showSuccessToast: false, showErrorToast: false }
  );

  const handleUpdateObligation = (id: string, progressPercent: number) => {
    pendingObligationRef.current = { id, progressPercent };
    void updateObligationRun();
  };

  const handleToggleTraining = (id: string, completed: boolean) => {
    pendingTrainingRef.current = { id, completed };
    void updateTrainingRun();
  };

  const handleUpdateCertificate = (id: string, certificateId: string) => {
    pendingTrainingRef.current = { id, certificateId };
    void updateTrainingRun();
  };

  const actionError = syncError ?? obligationError ?? trainingError;

  if (!data && loading) {
    return (
      <ComplianceTrackingDashboard
        data={{
          profile: { caoRegion: "Toronto", corpNumber: "", syncStatus: "never" },
          obligations: [],
          training: [],
          score: {
            overall: 0,
            obligationsScore: 0,
            trainingScore: 0,
            completedObligations: 0,
            totalObligations: 0,
            trainedDirectors: 0,
            totalDirectors: 0,
          },
        }}
        mode="admin"
        loading
      />
    );
  }

  return (
    <>
      {actionError ? <FormAlert message={actionError} className="mb-4" /> : null}
      <ComplianceTrackingDashboard
        data={
          data ?? {
            profile: { caoRegion: "Toronto", corpNumber: "", syncStatus: "never" },
            obligations: [],
            training: [],
            score: {
              overall: 0,
              obligationsScore: 0,
              trainingScore: 0,
              completedObligations: 0,
              totalObligations: 0,
              trainedDirectors: 0,
              totalDirectors: 0,
            },
          }
        }
        mode="admin"
        loading={loading}
        error={error}
        onSync={() => void handleSync()}
        syncing={syncing}
        onUpdateObligation={handleUpdateObligation}
        onToggleTraining={handleToggleTraining}
        onUpdateCertificate={handleUpdateCertificate}
      />
    </>
  );
}
