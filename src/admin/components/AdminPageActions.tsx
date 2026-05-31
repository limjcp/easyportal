import type { ReactNode } from "react";
import type { AdminRoute } from "../navigation";
import { getBreadcrumbTrail } from "../navigation";

export type AdminPageActionsProps = {
  route: AdminRoute;
  onNavigate: (route: AdminRoute) => void;
  primaryAction?: ReactNode;
};

export function AdminPageActions({ route, onNavigate, primaryAction }: AdminPageActionsProps) {
  const trail = getBreadcrumbTrail(route);
  return (
    <div className="mb-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => onNavigate({ page: "dashboard" })}
          className="inline-flex items-center gap-2 rounded bg-[#79d0df] px-3 py-1 text-white transition hover:bg-[#6ac5d5]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onNavigate({ page: "dashboard" })}
          className="inline-flex items-center gap-2 rounded bg-[#79d0df] px-3 py-1 text-white transition hover:bg-[#6ac5d5]"
        >
          Home
        </button>
        {trail.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => item.route && onNavigate(item.route)}
            className="inline-flex items-center gap-2 rounded bg-[#79d0df] px-3 py-1 text-white transition hover:bg-[#6ac5d5]"
          >
            {item.label}
          </button>
        ))}
      </div>
      {primaryAction ? (
        <div className="flex min-w-0 shrink-0 flex-wrap gap-2 lg:justify-end">{primaryAction}</div>
      ) : null}
    </div>
  );
}
