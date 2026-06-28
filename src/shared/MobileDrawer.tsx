import { useEffect, type ReactNode } from "react";
import { FaTimes } from "react-icons/fa";
import { cn } from "../utils/cn";

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
};

export function MobileDrawer({
  open,
  onClose,
  title,
  side = "left",
  children,
  className,
}: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Menu"}
        className={cn(
          "absolute top-0 flex h-full w-[min(100vw-3rem,320px)] flex-col bg-white shadow-xl",
          side === "left" ? "left-0" : "right-0",
          className
        )}
      >
        {(title || side) && (
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
            {title ? <h2 className="text-sm font-semibold text-slate-800">{title}</h2> : <span />}
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}
