import { scoreBgColor, scoreColor } from "../complianceScore";
import type { ComplianceScoreBreakdown } from "../types";

type ComplianceScoreCardProps = {
  score: ComplianceScoreBreakdown;
  variant?: "admin" | "marketing";
};

export function ComplianceScoreCard({ score, variant = "admin" }: ComplianceScoreCardProps) {
  const cardClass =
    variant === "marketing"
      ? "rounded-none border border-border bg-background p-8 text-center"
      : "rounded-sm bg-white p-6 shadow-sm border border-slate-200";

  return (
    <div className={cardClass}>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Compliance Score</p>
      <p className={`text-6xl font-extralight tabular-nums ${scoreColor(score.overall)}`}>{score.overall}</p>
      <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-border">
        <div
          className={`h-full transition-all duration-500 ${scoreBgColor(score.overall)}`}
          style={{ width: `${score.overall}%` }}
        />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Obligations</p>
          <p className="font-medium">{score.obligationsScore}/100</p>
          <p className="text-xs text-muted-foreground">
            {score.completedObligations}/{score.totalObligations} complete
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Director training</p>
          <p className="font-medium">{score.trainingScore}/100</p>
          <p className="text-xs text-muted-foreground">
            {score.trainedDirectors}/{score.totalDirectors} trained
          </p>
        </div>
      </div>
    </div>
  );
}
