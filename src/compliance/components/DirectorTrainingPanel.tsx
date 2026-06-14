import type { DirectorTrainingRecord } from "../types";

type DirectorTrainingPanelProps = {
  records: DirectorTrainingRecord[];
  editable?: boolean;
  onToggleComplete?: (id: string, completed: boolean) => void;
  onUpdateCertificate?: (id: string, certificateId: string) => void;
  variant?: "admin" | "marketing";
};

export function DirectorTrainingPanel({
  records,
  editable = false,
  onToggleComplete,
  onUpdateCertificate,
  variant = "admin",
}: DirectorTrainingPanelProps) {
  const completed = records.filter((r) => r.status === "completed").length;
  const total = records.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const wrapClass =
    variant === "marketing"
      ? "border border-border bg-background"
      : "rounded-sm bg-white shadow-sm border border-slate-200";

  return (
    <div className={wrapClass}>
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold">Director training</h3>
        <p className="text-sm text-muted-foreground">
          {completed}/{total} directors completed ({pct}%)
        </p>
        <div className="mt-3 h-2 max-w-md overflow-hidden rounded-full bg-border">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-6 py-3 font-medium">Director</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Completed</th>
              <th className="px-6 py-3 font-medium">Certificate</th>
              <th className="px-6 py-3 font-medium">Hours</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b border-border/60 last:border-b-0">
                <td className="px-6 py-3 font-medium">{record.directorName}</td>
                <td className="px-6 py-3">
                  {editable && onToggleComplete ? (
                    <button
                      type="button"
                      className="text-[#3476ef] hover:underline"
                      onClick={() => onToggleComplete(record.id, record.status !== "completed")}
                    >
                      {record.status === "completed" ? "Mark pending" : "Mark complete"}
                    </button>
                  ) : (
                    <span
                      className={
                        record.status === "completed" ? "text-emerald-600" : "text-amber-600"
                      }
                    >
                      {record.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 tabular-nums">{record.completedAt ?? "—"}</td>
                <td className="px-6 py-3">
                  {editable && onUpdateCertificate ? (
                    <input
                      type="text"
                      defaultValue={record.certificateId ?? ""}
                      placeholder="Certificate ID"
                      className="w-full max-w-[180px] border border-slate-300 px-2 py-1 text-xs"
                      onBlur={(e) => onUpdateCertificate(record.id, e.target.value)}
                    />
                  ) : (
                    record.certificateId ?? "—"
                  )}
                </td>
                <td className="px-6 py-3 tabular-nums">{record.hours ?? "—"}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No director training records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
