import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaChevronDown } from "react-icons/fa";

type OptionsDropdownProps = {
  options: { label: string; onClick: () => void }[];
};

type MenuPosition = {
  top: number;
  left: number;
};

export function OptionsDropdown({ options }: OptionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? options.length * 40 + 8;
    const menuWidth = menuRef.current?.offsetWidth ?? 140;
    const gap = 4;
    const padding = 8;

    let top = rect.bottom + gap;
    let left = rect.right;

    if (top + menuHeight > window.innerHeight - padding) {
      top = Math.max(padding, rect.top - menuHeight - gap);
    }
    if (left > window.innerWidth - padding) {
      left = window.innerWidth - padding;
    }
    if (left - menuWidth < padding) {
      left = menuWidth + padding;
    }

    setMenuPos({ top, left });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) updatePosition();
  }, [open, options, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-[500] min-w-[8rem] rounded border border-slate-200 bg-white py-1 shadow-xl"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          transform: "translateX(-100%)",
        }}
      >
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            role="menuitem"
            onClick={() => {
              opt.onClick();
              setOpen(false);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            {opt.label}
          </button>
        ))}
      </div>,
      document.body
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            setOpen(true);
          }
        }}
        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Options
        <FaChevronDown className="text-[10px]" />
      </button>
      {menu}
    </>
  );
}

export function DeliveryBadge({ delivered, total }: { delivered: number; total: number }) {
  const complete = delivered >= total && total > 0;
  return (
    <span
      className={
        complete
          ? "inline-block rounded-full bg-[#5cb85c] px-3 py-0.5 text-xs font-medium text-white"
          : "inline-block rounded-full bg-slate-600 px-3 py-0.5 text-xs font-medium text-white"
      }
    >
      {delivered} of {total} Delivered
    </span>
  );
}

export function StatusBadge({
  status,
}: {
  status: "draft" | "active" | "archived" | "inactive" | string;
}) {
  const colors: Record<string, string> = {
    draft: "bg-slate-500",
    active: "bg-[#5cb85c]",
    expired: "bg-orange-500",
    archived: "bg-slate-500",
    inactive: "bg-slate-400",
    Received: "bg-[#5cb85c]",
    Resolved: "bg-[#5cb85c]",
    Submitted: "bg-[#5cb85c]",
    Open: "bg-[#5cb85c]",
    Approved: "bg-[#5cb85c]",
    Disapproved: "bg-red-600",
    "Tie Vote": "bg-orange-500",
    Pending: "bg-slate-600",
    "Under Review": "bg-orange-500",
    "Pending Review": "bg-slate-600",
    Closed: "bg-slate-500",
    "No Votes Required": "bg-slate-500",
    Draft: "bg-slate-500",
    Active: "bg-[#5cb85c]",
    Activated: "bg-[#5cb85c]",
    "Awaiting Activation": "bg-blue-600",
    "Pending Unit Assignment": "bg-[#f0ad4e]",
    "Record-Only": "bg-slate-600",
    "QB Linked": "bg-[#5cb85c]",
    "CC Linked": "bg-[#5cb85c]",
    Deleted: "bg-red-600",
  };
  const label =
    status in colors && status !== status.toLowerCase()
      ? status
      : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium text-white ${colors[status] ?? "bg-slate-500"}`}
    >
      {label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    High: "bg-red-600",
    Medium: "bg-orange-500",
    Low: "bg-yellow-500",
    Emergency: "bg-red-800",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium text-white ${colors[severity] ?? "bg-slate-500"}`}
    >
      {severity}
    </span>
  );
}

export function ActionRequiredBadge({ required }: { required: boolean }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium text-white ${required ? "bg-red-600" : "bg-[#5cb85c]"}`}
    >
      {required ? "Yes" : "No"}
    </span>
  );
}

export function UnreadBadge() {
  return (
    <span className="ml-2 inline-block rounded bg-black px-1.5 py-0.5 text-[10px] font-medium text-white">
      Unread
    </span>
  );
}
