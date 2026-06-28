import { useState } from "react";
import { FaDesktop, FaTimes } from "react-icons/fa";
import { cn } from "../utils/cn";
import { desktopPreferredBannerKey } from "./desktopPreferredPages";
import { useIsLgUp } from "./useMediaQuery";

type DesktopPreferredBannerProps = {
  portal: "admin" | "company" | "resident" | "vendor";
  pageKey: string;
  className?: string;
};

export function DesktopPreferredBanner({ portal, pageKey, className }: DesktopPreferredBannerProps) {
  const isLgUp = useIsLgUp();
  const storageKey = desktopPreferredBannerKey(portal, pageKey);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  if (isLgUp || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // ignore private mode
    }
  };

  return (
    <div
      role="status"
      className={cn(
        "mb-4 flex items-start gap-3 rounded border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950",
        className
      )}
    >
      <FaDesktop className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
      <p className="min-w-0 flex-1 leading-snug">
        This screen is easier to use on a desktop. You can view data here, but complex editing works
        best on a larger screen.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded p-1 text-amber-800 hover:bg-amber-100"
        aria-label="Dismiss"
      >
        <FaTimes className="text-xs" />
      </button>
    </div>
  );
}
