import { useCallback } from "react";

/** Wraps tab onChange — loading overlay is driven by page fetch state, not an extra beginBusy here. */
export function useTabChangeWithBusy<T extends string>(onChange: (tab: T) => void) {
  return useCallback((tab: T) => onChange(tab), [onChange]);
}
