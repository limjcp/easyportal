import type {
  ComplianceObligation,
  ComplianceObligationStatus,
  ComplianceScoreBreakdown,
  DirectorTrainingRecord,
} from "./types";

const todayIso = () => new Date().toISOString().slice(0, 10);

function obligationPoints(obligation: ComplianceObligation, today: string): number {
  if (obligation.status === "completed") return 100;
  if (obligation.status === "overdue" || obligation.dueDate < today) return 0;
  if (obligation.status === "in_progress") return Math.max(0, Math.min(100, obligation.progressPercent));
  if (obligation.dueDate >= today) return Math.max(20, 100 - obligation.progressPercent);
  return 0;
}

function trainingPoints(record: DirectorTrainingRecord): number {
  return record.status === "completed" ? 100 : 0;
}

export function computeComplianceScore(
  obligations: ComplianceObligation[],
  training: DirectorTrainingRecord[]
): ComplianceScoreBreakdown {
  const today = todayIso();
  const obligationScores = obligations.map((o) => obligationPoints(o, today));
  const obligationsScore =
    obligationScores.length > 0
      ? Math.round(obligationScores.reduce((a, b) => a + b, 0) / obligationScores.length)
      : 100;

  const trainingScores = training.map(trainingPoints);
  const trainingScore =
    trainingScores.length > 0
      ? Math.round(trainingScores.reduce((a, b) => a + b, 0) / trainingScores.length)
      : 100;

  const overall = Math.round(obligationsScore * 0.7 + trainingScore * 0.3);

  return {
    overall,
    obligationsScore,
    trainingScore,
    completedObligations: obligations.filter((o) => o.status === "completed").length,
    totalObligations: obligations.length,
    trainedDirectors: training.filter((t) => t.status === "completed").length,
    totalDirectors: training.length,
  };
}

export function deriveObligationStatus(
  dueDate: string,
  completedAt: string | undefined,
  progressPercent: number,
  today = todayIso()
): ComplianceObligationStatus {
  if (completedAt) return "completed";
  if (dueDate < today) return "overdue";
  if (progressPercent > 0) return "in_progress";
  return "pending";
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}
