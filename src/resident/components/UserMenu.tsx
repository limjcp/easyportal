import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

type UserMenuProps = {
  userName: string;
  unit: string;
  onProfile: () => void;
  onLogout?: () => void;
};

export function UserMenu({ userName, unit, onProfile, onLogout }: UserMenuProps) {
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
    { label: "Account Balance", action: () => alert("Account balance is not available in this demo.") },
    { label: "Change Log", action: () => alert("Change log is not available in this demo.") },
    {
      label: "Logout",
      action: () => (onLogout ? onLogout() : alert("Logout is not available in this demo.")),
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#2d68cf] sm:text-sm"
      >
        Welcome Back {userName} (Unit {unit})
        <FaChevronDown className="text-[10px]" />
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
