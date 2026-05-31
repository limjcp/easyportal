import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  placement?: "top" | "bottom";
  className?: string;
};

export function Tooltip({ content, children, placement = "top", className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);

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

  return (
    <span ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        className="inline-flex items-center"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        {children}
      </button>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "absolute z-50 max-w-xs rounded border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 shadow-lg",
            placement === "top" ? "bottom-full left-0 mb-1" : "top-full left-0 mt-1"
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
