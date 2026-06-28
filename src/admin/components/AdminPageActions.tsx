import type { ReactNode } from "react";
import { FaArrowLeft } from "react-icons/fa";
import type { AdminRoute } from "../navigation";
import { getBreadcrumbTrail } from "../navigation";

export type AdminPageActionsProps = {
  route: AdminRoute;
  onNavigate: (route: AdminRoute) => void;
  primaryAction?: ReactNode;
};

export function AdminPageActions({ route, onNavigate, primaryAction }: AdminPageActionsProps) {
  const trail = getBreadcrumbTrail(route);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    onNavigate({ page: "dashboard" });
  };

  return (
    <div className="mb-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-wrap items-center gap-2 text-sm"
      >
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex shrink-0 items-center gap-1.5 rounded bg-[#5bc0de] px-2.5 py-1 text-xs font-medium text-white transition hover:bg-[#46b8da]"
        >
          <FaArrowLeft className="text-[10px]" aria-hidden />
          Back
        </button>
        <ol className="flex min-w-0 flex-wrap items-center gap-1 text-slate-600">
          <li className="flex items-center">
            <button
              type="button"
              onClick={() => onNavigate({ page: "dashboard" })}
              className="text-[#3476ef] hover:underline"
            >
              Home
            </button>
          </li>
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            const isLink = Boolean(item.route) && !isLast;
            return (
              <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
                <span className="text-slate-400" aria-hidden>
                  /
                </span>
                {isLink ? (
                  <button
                    type="button"
                    onClick={() => item.route && onNavigate(item.route)}
                    className="truncate text-[#3476ef] hover:underline"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="truncate font-medium text-slate-800">{item.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {primaryAction ? (
        <div className="flex min-w-0 shrink-0 flex-wrap gap-2 lg:justify-end">{primaryAction}</div>
      ) : null}
    </div>
  );
}
