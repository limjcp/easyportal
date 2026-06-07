import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

type UserMenuProps = {
  userName: string;
  buildingName: string;
  unit: string;
  onProfile: () => void;
  onLogout?: () => void;
};

export function UserMenu({ userName, buildingName, unit, onProfile, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { label: "Profile", action: onProfile },
    ...(onLogout ? [{ label: "Logout", action: onLogout }] : []),
  ];

  const locationLabel = unit && unit !== "—" ? `${buildingName} — Unit ${unit}` : buildingName;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex max-w-[min(100vw-2rem,420px)] items-center gap-2 rounded bg-[#3476ef] px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#2d68cf] sm:text-sm"
      >
        <span className="truncate">
          Welcome Back {userName} ({locationLabel})
        </span>
        <FaChevronDown className="shrink-0 text-[10px]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-sm border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.action();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <FaChevronRight className="text-[10px] text-slate-400" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
