import type { IconType } from "react-icons";
import { cn } from "../utils/cn";

export type MobileBottomNavItem = {
  id: string;
  label: string;
  icon: IconType;
  active: boolean;
  onClick: () => void;
};

type MobileBottomNavProps = {
  items: MobileBottomNavItem[];
  /** Active tab color theme */
  accent?: "purple" | "teal";
};

const accentActiveClass = {
  purple: "text-[#7D5DA7]",
  teal: "text-[#0d9488]",
} as const;

export function MobileBottomNav({ items, accent = "purple" }: MobileBottomNavProps) {
  const activeClass = accentActiveClass[accent];
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-300 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition sm:text-xs",
                item.active ? activeClass : "text-slate-500 hover:text-slate-700"
              )}
              aria-current={item.active ? "page" : undefined}
            >
              <Icon className={cn("text-lg", item.active && activeClass)} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
