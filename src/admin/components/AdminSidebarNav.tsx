import { useCallback, useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { cn } from "../../utils/cn";
import {
  adminDashboardNavItem,
  isAdminNavGroupActive,
  isNavActive,
  type AdminNavGroup,
  type AdminRoute,
} from "../navigation";

type AdminSidebarNavProps = {
  route: AdminRoute;
  groups: AdminNavGroup[];
  embedded?: boolean;
  buildingId?: string;
  onNavigate: (route: AdminRoute) => void;
};

function storageKey(buildingId?: string) {
  return `admin-nav-groups:${buildingId ?? "default"}`;
}

function readExpandedState(buildingId?: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(storageKey(buildingId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeExpandedState(buildingId: string | undefined, state: Record<string, boolean>) {
  try {
    localStorage.setItem(storageKey(buildingId), JSON.stringify(state));
  } catch {
    // ignore quota / private mode errors
  }
}

function buildExpandedState(
  groups: AdminNavGroup[],
  route: AdminRoute,
  buildingId?: string
): Record<string, boolean> {
  const saved = readExpandedState(buildingId);
  const next: Record<string, boolean> = {};
  for (const group of groups) {
    const savedValue = saved[group.id];
    next[group.id] =
      isAdminNavGroupActive(route, group) || (savedValue !== undefined ? savedValue : true);
  }
  return next;
}

export function AdminSidebarNav({
  route,
  groups,
  embedded = false,
  buildingId,
  onNavigate,
}: AdminSidebarNavProps) {
  const activeColor = embedded ? "bg-[#7D5DA7]" : "bg-[#3476ef]";

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    buildExpandedState(groups, route, buildingId)
  );

  useEffect(() => {
    setExpanded(buildExpandedState(groups, route, buildingId));
  }, [buildingId, groups]);

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const group of groups) {
        if (isAdminNavGroupActive(route, group) && !next[group.id]) {
          next[group.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [route, groups]);

  const toggleGroup = useCallback(
    (groupId: string) => {
      setExpanded((prev) => {
        const next = { ...prev, [groupId]: !prev[groupId] };
        writeExpandedState(buildingId, next);
        return next;
      });
    },
    [buildingId]
  );

  const dashboardActive = isNavActive(route, adminDashboardNavItem.id);

  const DashboardIcon = adminDashboardNavItem.icon;

  return (
    <nav aria-label="Building admin">
      <button
        type="button"
        onClick={() => onNavigate(adminDashboardNavItem.route)}
        className={cn(
          "flex w-full items-center gap-3 border-b border-white/10 px-3 py-3 text-left text-sm text-white transition",
          dashboardActive ? activeColor : "hover:bg-[#818181]"
        )}
      >
        <DashboardIcon className="shrink-0 text-sm text-white/90" />
        <span>{adminDashboardNavItem.label}</span>
      </button>

      {groups.map((group) => {
        const isOpen = expanded[group.id] ?? true;
        const groupActive = isAdminNavGroupActive(route, group);

        return (
          <div key={group.id} className="border-t border-white/15">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={isOpen}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/90 transition",
                groupActive && !isOpen ? "bg-white/10" : "hover:bg-[#818181]"
              )}
            >
              <span className="leading-snug">{group.label}</span>
              <FaChevronDown
                className={cn(
                  "shrink-0 text-[10px] text-white/70 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {isOpen &&
              group.items.map(({ id, label, icon: Icon, route: navRoute }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onNavigate(navRoute)}
                  className={cn(
                    "flex w-full items-center gap-2.5 border-b border-white/10 py-2.5 pl-5 pr-3 text-left text-sm text-white transition",
                    isNavActive(route, id) ? activeColor : "hover:bg-[#818181]"
                  )}
                >
                  <Icon className="shrink-0 text-xs text-white/90" />
                  <span className="leading-snug">{label}</span>
                </button>
              ))}
          </div>
        );
      })}
    </nav>
  );
}
