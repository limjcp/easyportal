import { useCallback, useEffect, useState } from "react";
import { ComplianceTrackingDashboard } from "../../compliance/components/ComplianceTrackingDashboard";
import type { ComplianceDashboardData } from "../../compliance/types";
import { adminRepository } from "../data/adminRepository";

export function ComplianceDashboardPage() {
  const [data, setData] = useState<ComplianceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    load();
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await adminRepository.syncCaoCompliance({ force: true });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "CAO sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateObligation = async (id: string, progressPercent: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const obligation = data?.obligations.find((o) => o.id === id);
    if (!obligation) return;
    const status =
      progressPercent >= 100
        ? "completed"
        : obligation.dueDate < today
          ? "overdue"
          : progressPercent > 0
            ? "in_progress"
            : "pending";
    await adminRepository.updateObligationProgress(id, {
      progressPercent,
      status,
      completedAt: status === "completed" ? today : null,
    });
    await load();
  };

  const handleToggleTraining = async (id: string, completed: boolean) => {
    const today = new Date().toISOString().slice(0, 10);
    await adminRepository.updateDirectorTraining(id, {
      status: completed ? "completed" : "pending",
      completedAt: completed ? today : null,
      hours: completed ? 6 : null,
    });
    await load();
  };

  const handleUpdateCertificate = async (id: string, certificateId: string) => {
    await adminRepository.updateDirectorTraining(id, { certificateId: certificateId || null });
    await load();
  };

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
      onSync={handleSync}
      syncing={syncing}
      onUpdateObligation={handleUpdateObligation}
      onToggleTraining={handleToggleTraining}
      onUpdateCertificate={handleUpdateCertificate}
    />
  );
}
