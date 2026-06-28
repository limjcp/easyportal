import { useCallback, useContext, useRef, useState } from "react";
import { useMutationBusy } from "./MutationBusyContext";
import { ToastContext } from "./Toast";

type AsyncActionOptions<T> = {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: T) => void;
  onError?: (message: string) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  /** When false, do not show the modal/panel busy overlay. Default true. */
  trackBusy?: boolean;
};

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useAsyncAction<T, A extends unknown[] = []>(
  action: (...args: A) => Promise<T>,
  options: AsyncActionOptions<T> = {}
) {
  const toastCtx = useContext(ToastContext);
  const mutationBusy = useMutationBusy();
  const busyRef = useRef(mutationBusy);
  busyRef.current = mutationBusy;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(async (...args: A): Promise<T | undefined> => {
    const {
      successMessage,
      errorMessage = "Something went wrong. Please try again.",
      onSuccess,
      onError,
      showSuccessToast = Boolean(successMessage),
      showErrorToast = true,
      trackBusy = true,
    } = optionsRef.current;

    setLoading(true);
    setError(null);
    if (trackBusy) busyRef.current?.beginBusy();
    try {
      const result = await action(...args);
      if (showSuccessToast && successMessage && toastCtx) {
        toastCtx.showToast({ message: successMessage, variant: "success" });
      }
      onSuccess?.(result);
      return result;
    } catch (err) {
      const message = getErrorMessage(err, errorMessage);
      setError(message);
      if (showErrorToast && toastCtx) {
        toastCtx.showToast({ message, variant: "error" });
      }
      onError?.(message);
      return undefined;
    } finally {
      if (trackBusy) busyRef.current?.endBusy();
      setLoading(false);
    }
  }, [action, toastCtx]);

  return { run, loading, error, clearError, setError };
}
