import { useEffect, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { cn } from "../../utils/cn";
import { vendorRepository } from "../data/vendorRepository";
import type { VendorNotification } from "../../resident/data/types";
import type { VendorRoute } from "../navigation";

type VendorNotificationsProps = {
  refreshKey: number;
  onNavigate: (route: VendorRoute) => void;
};

export function VendorNotifications({ refreshKey, onNavigate }: VendorNotificationsProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const markReadTargetRef = useRef<VendorNotification | null>(null);

  const { run: markReadAndNavigate, error: markReadError } = useAsyncAction(
    async () => {
      const n = markReadTargetRef.current;
      if (!n) return;
      await vendorRepository.markNotificationRead(n.id);
      const list = await vendorRepository.getNotifications();
      const count = await vendorRepository.getUnreadNotificationCount();
      setNotifications(list);
      setUnreadCount(count);
      setOpen(false);
      if (n.type === "compliance_expiring" || n.type === "compliance_expired") {
        onNavigate({ page: "compliance" });
      } else if (n.poId) {
        onNavigate({ page: "purchase-order-detail", id: n.poId });
      }
    },
    {
      errorMessage: "Unable to mark notification as read.",
      showSuccessToast: false,
    }
  );

  const handleMarkRead = (n: VendorNotification) => {
    markReadTargetRef.current = n;
    void markReadAndNavigate();
  };

  useEffect(() => {
    vendorRepository.getNotifications().then(setNotifications);
    vendorRepository.getUnreadNotificationCount().then(setUnreadCount);
  }, [refreshKey]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded border border-slate-400 bg-white px-3 py-1 text-slate-700 hover:bg-slate-50"
        aria-label="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-80 rounded border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            Notifications
          </div>
          {markReadError ? (
            <div className="px-3 pt-2">
              <FormAlert message={markReadError} />
            </div>
          ) : null}
          {notifications.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">No notifications.</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                      !n.read && "bg-teal-50 font-medium"
                    )}
                  >
                    {n.message}
                    <span className="mt-1 block text-xs text-slate-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
