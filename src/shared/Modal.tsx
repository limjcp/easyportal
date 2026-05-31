import { useEffect, type ReactNode } from "react";
import { FaTimes } from "react-icons/fa";
import { cn } from "../utils/cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
};

export function Modal({ open, onClose, title, icon, children, footer, size = "lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 sm:p-6 sm:pt-12">
      <div
        className={cn(
          "w-full rounded-sm bg-white shadow-2xl",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-3xl",
          size === "xl" && "max-w-5xl"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            {icon}
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
