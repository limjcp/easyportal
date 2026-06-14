import { useCallback, useEffect, useState } from "react";
import { buildCaoEngineObligations } from "../../compliance/caoDeadlineEngine";
import { computeComplianceScore } from "../../compliance/complianceScore";
import { ComplianceTrackingDashboard } from "../../compliance/components/ComplianceTrackingDashboard";
import type { ComplianceDashboardData } from "../../compliance/types";
import { EDITORIAL_CONTAINER, EDITORIAL_SECTION_PY } from "../editorialLayout";
import { complianceDemoRepository } from "../data/complianceDemoRepository";
import { pe } from "../typography";

type ComplianceDashboardPageProps = {
  onNavigate: (path: string) => void;
};

function buildLocalDemoData(): ComplianceDashboardData {
  const obligations = buildCaoEngineObligations(
    { fiscalYearEnd: `${new Date().getFullYear()}-12-31` },
    "cao_engine"
  ).map((o, i) => ({ ...o, id: `local-obl-${i}` }));
  const training = [
    {
      id: "local-tr-1",
      directorName: "Alex Morgan",
      status: "completed" as const,
      completedAt: new Date().toISOString().slice(0, 10),
      certificateId: "CAO-DT-2026-001",
      hours: 6,
      source: "cao_engine",
    },
    {
      id: "local-tr-2",
      directorName: "Jordan Lee",
      status: "completed" as const,
      completedAt: new Date().toISOString().slice(0, 10),
      certificateId: "CAO-DT-2026-002",
      hours: 6,
      source: "cao_engine",
    },
    {
      id: "local-tr-3",
      directorName: "Sam Patel",
      status: "pending" as const,
      source: "manual",
    },
  ];
  const profile = {
    caoRegion: "Toronto",
    corpNumber: "TSCC 9999",
    syncStatus: "fallback" as const,
    syncError: "Using calculated demo data.",
  };
  return {
    profile,
    obligations,
    training,
    score: computeComplianceScore(obligations, training),
  };
}

export function ComplianceDashboardPage({ onNavigate }: ComplianceDashboardPageProps) {
  const [data, setData] = useState<ComplianceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let demo = await complianceDemoRepository.getPublicComplianceDemo();
      if (!demo || demo.obligations.length === 0) {
        try {
          await complianceDemoRepository.syncPublicComplianceDemo();
          demo = await complianceDemoRepository.getPublicComplianceDemo();
        } catch {
          demo = buildLocalDemoData();
        }
      }
      if (!demo) demo = buildLocalDemoData();
      setData(demo);
    } catch (err) {
      setData(buildLocalDemoData());
      setError(err instanceof Error ? err.message : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <section className={`${EDITORIAL_SECTION_PY} border-b border-border`}>
        <div className={`${EDITORIAL_CONTAINER} text-center`}>
          <p className={`${pe.eyebrow} text-muted-foreground mb-4`}>Board Governance</p>
          <h1 className={`${pe.editorialPageTitle} text-foreground`}>Compliance & Tracking Dashboard</h1>
          <p className={`mx-auto mt-6 max-w-3xl ${pe.editorialLead} text-muted-foreground`}>
            Live demo — CAO calendar deadlines, compliance score, progress tracking, and director training metrics.
          </p>
        </div>
      </section>

      <section className={`${EDITORIAL_SECTION_PY} border-b border-border`}>
        <div className={EDITORIAL_CONTAINER}>
          <ComplianceTrackingDashboard
            data={
              data ?? {
                profile: { caoRegion: "Toronto", corpNumber: "TSCC 9999", syncStatus: "never" },
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
            mode="demo"
            loading={loading}
            error={error}
          />
        </div>
      </section>

      <section className={`${EDITORIAL_SECTION_PY} bg-foreground text-background`}>
        <div className={`${EDITORIAL_CONTAINER} text-center`}>
          <h2 className={`${pe.editorialSectionTitle} text-balance`}>See it for your building</h2>
          <p className={`mx-auto mt-6 max-w-2xl ${pe.editorialBody} text-background/70`}>
            Request a walkthrough and we will connect your corporation number to a live compliance dashboard.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("/free-consultation")}
            className="mt-10 inline-flex items-center gap-2 border-2 border-background px-8 py-3 text-sm font-medium text-background hover:bg-background/10"
          >
            Request a Demo
          </button>
        </div>
      </section>
    </>
  );
}
