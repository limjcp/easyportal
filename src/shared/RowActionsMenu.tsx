import { useEffect, useRef, useState, type ReactNode } from "react";
import { FaCaretDown, FaEdit } from "react-icons/fa";
import { cn } from "../utils/cn";

export type RowAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
};

type RowActionsMenuProps = {
  primaryLabel?: string;
  actions: RowAction[];
  className?: string;
};

export function RowActionsMenu({
  primaryLabel = "Edit",
  actions,
  className,
}: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const primary = actions[0];
  const secondary = actions.slice(1);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <div className="inline-flex rounded border border-slate-300">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-l border-r border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
          onClick={() => {
            primary?.onClick();
            setOpen(false);
          }}
        >
          <FaEdit className="text-[10px]" />
          {primaryLabel}
        </button>
        {secondary.length > 0 ? (
          <button
            type="button"
            className="rounded-r px-1.5 py-1 text-xs hover:bg-slate-50"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((v) => !v)}
          >
            <FaCaretDown />
          </button>
        ) : null}
      </div>
      {open && secondary.length > 0 ? (
        <ul
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded border border-slate-200 bg-white py-1 text-xs shadow-lg"
        >
          {secondary.map((action) => (
            <li key={action.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50"
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
              >
                {action.icon}
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
