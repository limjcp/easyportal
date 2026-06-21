import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ToastCard, type ToastVariant } from "./ToastCard";

type ToastItem = {
  id: number;
  message: string;
  subMessage?: string;
  variant: ToastVariant;
};

type ShowToastOptions = {
  message: string;
  subMessage?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  showToast: (options: ShowToastOptions) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_TITLES: Record<ToastVariant, string> = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<number, number>>(new Map());

  const dismissToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, subMessage, variant = "success" }: ShowToastOptions) => {
      const id = Date.now() + Math.random();
      const title = message.trim() || DEFAULT_TITLES[variant];
      setToasts((prev) => [...prev, { id, message: title, subMessage, variant }]);
      const timer = window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[200] flex flex-col items-end gap-3"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            variant={toast.variant}
            message={toast.message}
            subMessage={toast.subMessage}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export type { ToastVariant, ShowToastOptions };
