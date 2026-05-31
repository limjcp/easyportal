import { useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaEye, FaEyeSlash } from "react-icons/fa";
import { cn } from "../../utils/cn";
import type { CalendarEvent } from "../../resident/data/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type AdminEventCalendarProps = {
  events: CalendarEvent[];
  adminOnlyFilter: boolean;
  onAdminOnlyFilterChange: (adminOnly: boolean) => void;
  onEventClick: (event: CalendarEvent) => void;
};

export function AdminEventCalendar({
  events,
  adminOnlyFilter,
  onAdminOnlyFilterChange,
  onEventClick,
}: AdminEventCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(2026, 4, 1));
  const [viewMode, setViewMode] = useState<"month" | "day">("month");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

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
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({
      day: d,
      current: false,
      dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }

  const monthLabel = viewDate.toLocaleString("default", { month: "long", year: "numeric" });
  const activeDay = selectedDay ?? `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const dayEvents = eventsByDate.get(activeDay) ?? [];

  const openDay = (dateStr: string) => {
    setSelectedDay(dateStr);
    setViewMode("day");
  };

  if (viewMode === "day") {
    const [y, m, d] = activeDay.split("-").map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString("default", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return (
      <div className="min-w-0 rounded-sm border border-slate-300 bg-white">
        <CalendarToolbar
          monthLabel={label}
          onPrev={() => setViewDate(new Date(year, month - 1, 1))}
          onNext={() => setViewDate(new Date(year, month + 1, 1))}
          viewMode={viewMode}
          onViewModeChange={(m) => {
            setViewMode(m);
            if (m === "month") setSelectedDay(null);
          }}
          adminOnlyFilter={adminOnlyFilter}
          onAdminOnlyFilterChange={onAdminOnlyFilterChange}
        />
        <div className="space-y-2 p-4">
          {dayEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No events on this day.</p>
          ) : (
            dayEvents.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onEventClick(e)}
                className="block w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
              >
                <span className="font-medium text-[#3476ef]">{e.title}</span>
                {e.adminOnly && (
                  <span className="ml-2 rounded bg-slate-600 px-1.5 py-0.5 text-[10px] text-white">
                    Admin
                  </span>
                )}
                {e.description && <p className="mt-1 text-xs text-slate-600">{e.description}</p>}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-sm border border-slate-300 bg-white">
      <CalendarToolbar
        monthLabel={monthLabel}
        onPrev={() => setViewDate(new Date(year, month - 1, 1))}
        onNext={() => setViewDate(new Date(year, month + 1, 1))}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        adminOnlyFilter={adminOnlyFilter}
        onAdminOnlyFilterChange={onAdminOnlyFilterChange}
      />
      <div className="grid grid-cols-7 border-t border-slate-200 text-center text-xs font-medium text-slate-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="border-b border-r border-slate-100 py-2 last:border-r-0">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const dayEventsList = eventsByDate.get(cell.dateStr) ?? [];
          return (
            <button
              key={i}
              type="button"
              onClick={() => cell.current && openDay(cell.dateStr)}
              className={cn(
                "min-h-[4.5rem] border-b border-r border-slate-100 p-1 text-left last:border-r-0",
                !cell.current && "bg-slate-50 text-slate-300",
                cell.current && "hover:bg-blue-50/50"
              )}
            >
              <span className={cn("text-sm", cell.current ? "text-slate-700" : "text-slate-300")}>
                {cell.day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayEventsList.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    className={cn(
                      "truncate rounded px-1 text-[10px] text-white",
                      e.adminOnly ? "bg-slate-600" : "bg-[#7D5DA7]"
                    )}
                    title={e.title}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEventsList.length > 2 && (
                  <div className="text-[10px] text-slate-500">+{dayEventsList.length - 2} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarToolbar({
  monthLabel,
  onPrev,
  onNext,
  viewMode,
  onViewModeChange,
  adminOnlyFilter,
  onAdminOnlyFilterChange,
}: {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  viewMode: "month" | "day";
  onViewModeChange: (m: "month" | "day") => void;
  adminOnlyFilter: boolean;
  onAdminOnlyFilterChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 bg-[#3476ef] px-3 py-2 text-white sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <button type="button" onClick={onPrev} className="rounded p-1 hover:bg-white/20" aria-label="Previous">
          <FaChevronLeft />
        </button>
        <button type="button" onClick={onNext} className="rounded p-1 hover:bg-white/20" aria-label="Next">
          <FaChevronRight />
        </button>
        <span className="truncate font-medium">{monthLabel}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onViewModeChange("month")}
            className={cn(
              "rounded px-2 py-0.5 text-xs",
              viewMode === "month" ? "bg-white/30" : "hover:bg-white/20"
            )}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("day")}
            className={cn(
              "rounded px-2 py-0.5 text-xs",
              viewMode === "day" ? "bg-white/30" : "hover:bg-white/20"
            )}
          >
            Day
          </button>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onAdminOnlyFilterChange(false)}
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-1 text-xs",
            !adminOnlyFilter ? "bg-white/30" : "bg-black/20 hover:bg-black/30"
          )}
        >
          <FaEye className="text-[10px]" />
          Show All Events
        </button>
        <button
          type="button"
          onClick={() => onAdminOnlyFilterChange(true)}
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-1 text-xs",
            adminOnlyFilter ? "bg-white/30" : "bg-black/20 hover:bg-black/30"
          )}
        >
          <FaEyeSlash className="text-[10px]" />
          Show Admin-Only
        </button>
      </div>
    </div>
  );
}
