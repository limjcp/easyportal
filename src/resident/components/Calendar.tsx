import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { cn } from "../../utils/cn";
import type { CalendarEvent } from "../data/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarProps = {
  events: CalendarEvent[];
  referenceDate?: Date;
};

export function Calendar({ events, referenceDate = new Date(2026, 4, 19) }: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1));
  const [viewMode, setViewMode] = useState<"month" | "day">("month");

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const eventDates = new Set(events.map((e) => e.date));

  const cells: { day: number; current: boolean; dateStr: string }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ day: d, current: false, dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ day: d, current: false, dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }

  const monthLabel = viewDate.toLocaleString("default", { month: "long", year: "numeric" });
  const todayStr = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}-${String(referenceDate.getDate()).padStart(2, "0")}`;

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  if (viewMode === "day") {
    const dayEvents = events.filter((e) => e.date === todayStr);
    return (
      <div className="rounded-sm bg-white shadow-lg">
        <CalendarHeader
          monthLabel={referenceDate.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          onPrev={prevMonth}
          onNext={nextMonth}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <div className="p-4">
          {dayEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No events scheduled for this day.</p>
          ) : (
            dayEvents.map((e) => (
              <div key={e.id} className="border-b border-slate-100 py-2 last:border-0">
                <p className="font-medium text-slate-800">{e.title}</p>
                {e.description && <p className="text-sm text-slate-500">{e.description}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm bg-white shadow-lg">
      <CalendarHeader monthLabel={monthLabel} onPrev={prevMonth} onNext={nextMonth} viewMode={viewMode} onViewModeChange={setViewMode} />
      <div className="grid grid-cols-7 border-t border-slate-200 text-center text-xs font-medium text-slate-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="border-b border-r border-slate-100 py-2 last:border-r-0">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const hasEvent = eventDates.has(cell.dateStr);
          const isToday = cell.dateStr === todayStr;
          return (
            <div
              key={i}
              className={cn(
                "min-h-[72px] border-b border-r border-slate-100 p-1 text-left last:border-r-0",
                !cell.current && "bg-slate-50 text-slate-300",
                isToday && "bg-yellow-50"
              )}
            >
              <span className={cn("text-sm", cell.current ? "text-slate-700" : "text-slate-300")}>{cell.day}</span>
              {hasEvent && cell.current && (
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#3476ef]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarHeader({
  monthLabel,
  onPrev,
  onNext,
  viewMode,
  onViewModeChange,
}: {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  viewMode: "month" | "day";
  onViewModeChange: (m: "month" | "day") => void;
}) {
  return (
    <div className="flex items-center justify-between bg-[#3476ef] px-4 py-2 text-white">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onPrev} className="rounded p-1 hover:bg-white/20" aria-label="Previous">
          <FaChevronLeft />
        </button>
        <button type="button" onClick={onNext} className="rounded p-1 hover:bg-white/20" aria-label="Next">
          <FaChevronRight />
        </button>
        <span className="ml-2 font-medium">{monthLabel}</span>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onViewModeChange("month")}
          className={cn("rounded px-2 py-0.5 text-xs", viewMode === "month" ? "bg-white/30" : "hover:bg-white/20")}
        >
          M
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("day")}
          className={cn("rounded px-2 py-0.5 text-xs", viewMode === "day" ? "bg-white/30" : "hover:bg-white/20")}
        >
          D
        </button>
      </div>
    </div>
  );
}
