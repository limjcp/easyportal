import { useMemo, useState } from "react";
import { cn } from "../../utils/cn";
import type { ComplianceObligation } from "../types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CaoCalendarPanelProps = {
  obligations: ComplianceObligation[];
  variant?: "admin" | "marketing";
};

export function CaoCalendarPanel({ obligations, variant = "admin" }: CaoCalendarPanelProps) {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const dueDates = useMemo(() => {
    const map = new Map<string, ComplianceObligation[]>();
    for (const o of obligations) {
      const list = map.get(o.dueDate) ?? [];
      list.push(o);
      map.set(o.dueDate, list);
    }
    return map;
  }, [obligations]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const cells: { day: number; current: boolean; dateStr: string }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({
      day: d,
      current: false,
      dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      current: true,
      dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }
  while (cells.length < 42) {
    const d = cells.length - firstDay - daysInMonth + 1;
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({
      day: d,
      current: false,
      dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }

  const wrapClass =
    variant === "marketing"
      ? "border border-border bg-background"
      : "rounded-sm bg-white shadow-sm border border-slate-200";

  return (
    <div className={wrapClass}>
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h3 className="text-lg font-semibold">CAO calendar</h3>
          <p className="text-sm text-muted-foreground">Due dates from synced obligations</p>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            className="px-2 py-1 text-sm border border-border"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
          >
            Prev
          </button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {viewDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            className="px-2 py-1 text-sm border border-border"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
          >
            Next
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[280px]">
          <div className="grid grid-cols-7 border-b border-border text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 border-r border-border last:border-r-0">
            {d}
          </div>
        ))}
          </div>
          <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const events = dueDates.get(cell.dateStr) ?? [];
          const isToday = cell.dateStr === today;
          return (
            <div
              key={cell.dateStr + cell.day}
              className={cn(
                "min-h-[56px] border-b border-r border-border p-1 text-left last:border-r-0 sm:min-h-[72px]",
                !cell.current && "bg-muted/30 text-muted-foreground/50",
                isToday && "bg-amber-50"
              )}
            >
              <span className="text-sm">{cell.day}</span>
              {events.slice(0, 2).map((e) => (
                <div
                  key={e.id}
                  className={cn(
                    "mt-1 truncate rounded px-1 text-[10px] text-white",
                    e.status === "overdue" ? "bg-red-500" : "bg-slate-700"
                  )}
                  title={e.title}
                >
                  {e.title}
                </div>
              ))}
            </div>
          );
        })}
          </div>
        </div>
      </div>
    </div>
  );
}
