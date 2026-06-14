import type { ComplianceObligation } from "../types";

type DeadlineProgressListProps = {
  obligations: ComplianceObligation[];
  editable?: boolean;
  onUpdate?: (id: string, progressPercent: number) => void;
  variant?: "admin" | "marketing";
};

function toPercent(start: string, due: string, today: string) {
  const startMs = new Date(`${start}T12:00:00`).getTime();
  const dueMs = new Date(`${due}T12:00:00`).getTime();
  const todayMs = new Date(`${today}T12:00:00`).getTime();
  if (dueMs <= startMs) return 100;
  return Math.max(0, Math.min(100, ((todayMs - startMs) / (dueMs - startMs)) * 100));
}

export function DeadlineProgressList({
  obligations,
  editable = false,
  onUpdate,
  variant = "admin",
}: DeadlineProgressListProps) {
  const today = new Date().toISOString().slice(0, 10);
  const wrapClass =
    variant === "marketing"
      ? "border border-border bg-background"
      : "rounded-sm bg-white shadow-sm border border-slate-200";

  return (
    <div className={wrapClass}>
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">Deadline progress</h3>
        <p className="text-sm text-muted-foreground">Date-to-completion tracking for CAO obligations</p>
      </div>
      <div className="divide-y divide-border">
        {obligations.map((item) => {
          const timelinePct = toPercent(item.startDate, item.dueDate, today);
          const fill = item.status === "completed" ? 100 : item.progressPercent;
          return (
            <div key={item.id} className="px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.category} · due {item.dueDate}</p>
                </div>
                <span
                  className={`text-xs uppercase tracking-wide ${
                    item.status === "completed"
                      ? "text-emerald-600"
                      : item.status === "overdue"
                        ? "text-red-600"
                        : "text-amber-600"
                  }`}
                >
                  {item.status.replace("_", " ")}
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-border overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-foreground/10"
                  style={{ width: `${timelinePct}%` }}
                />
                <div
                  className={`absolute inset-y-0 left-0 ${
                    item.status === "overdue" ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${fill}%` }}
                />
              </div>
              {editable && onUpdate && (
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={item.progressPercent}
                    onChange={(e) => onUpdate(item.id, Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs tabular-nums w-10 text-right">{item.progressPercent}%</span>
                </div>
              )}
            </div>
          );
        })}
        {obligations.length === 0 && (
          <p className="px-6 py-8 text-sm text-muted-foreground text-center">No obligations synced yet.</p>
        )}
      </div>
    </div>
  );
}
