import type { DirectorTrainingRecord } from "../types";
import { AdminMobileCard } from "../../admin/components/AdminMobileCard";

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
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <h3 className="text-lg font-semibold">Director training</h3>
        <p className="text-sm text-muted-foreground">
          {completed}/{total} directors completed ({pct}%)
        </p>
        <div className="mt-3 h-2 max-w-md overflow-hidden rounded-full bg-border">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="hidden overflow-x-auto md:block">
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
      <div className="space-y-3 p-3 md:hidden">
        {records.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No director training records yet.
          </p>
        ) : (
          records.map((record) => (
            <AdminMobileCard
              key={record.id}
              title={record.directorName}
              badges={
                <span
                  className={
                    record.status === "completed"
                      ? "rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                      : "rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                  }
                >
                  {record.status}
                </span>
              }
              fields={[
                { label: "Completed", value: record.completedAt ?? "—" },
                { label: "Certificate", value: record.certificateId ?? "—" },
                { label: "Hours", value: record.hours ?? "—" },
              ]}
              actions={
                editable ? (
                  <div className="flex w-full flex-col gap-2">
                    {onToggleComplete && (
                      <button
                        type="button"
                        onClick={() => onToggleComplete(record.id, record.status !== "completed")}
                        className="w-full rounded bg-[#3476ef] px-3 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
                      >
                        {record.status === "completed" ? "Mark pending" : "Mark complete"}
                      </button>
                    )}
                    {onUpdateCertificate && (
                      <label className="block w-full text-left text-xs text-slate-500">
                        Certificate ID
                        <input
                          type="text"
                          defaultValue={record.certificateId ?? ""}
                          placeholder="Certificate ID"
                          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-800"
                          onBlur={(e) => onUpdateCertificate(record.id, e.target.value)}
                        />
                      </label>
                    )}
                  </div>
                ) : undefined
              }
              highlight={record.status !== "completed"}
            />
          ))
        )}
      </div>
    </div>
  );
}
