import { createPortal } from "react-dom";
import { LoadingSpinner } from "./LoadingSpinner";

type LoadingOverlayProps = {
  active?: boolean;
};

export function LoadingOverlay({ active = false }: LoadingOverlayProps) {
  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35"
      aria-busy="true"
      aria-live="polite"
    >
      <LoadingSpinner />
    </div>,
    document.body
  );
}
