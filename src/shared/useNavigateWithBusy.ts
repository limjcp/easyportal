import { useCallback } from "react";

/** Wraps navigate — loading overlay is driven by page fetch state, not an extra beginBusy here. */
export function useNavigateWithBusy<T>(onNavigate: (route: T) => void) {
  return useCallback((route: T) => onNavigate(route), [onNavigate]);
}
