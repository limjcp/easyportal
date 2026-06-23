import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type MutationBusyActions = {
  beginBusy: () => void;
  endBusy: () => void;
};

/** @deprecated Use MutationBusyActions — kept for runWithBusy typing compatibility */
export type MutationBusyContextValue = MutationBusyActions & { busy: boolean };

let busySnapshot = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return busySnapshot;
}

function setBusySnapshot(next: boolean) {
  if (busySnapshot !== next) {
    busySnapshot = next;
    listeners.forEach((listener) => listener());
  }
}

const BusyActionsContext = createContext<MutationBusyActions | null>(null);

export function MutationBusyProvider({ children }: { children: ReactNode }) {
  const counterRef = useRef(0);
  const leakWarnedRef = useRef(false);

  const beginBusy = useCallback(() => {
    counterRef.current += 1;
    if (import.meta.env.DEV && counterRef.current > 10 && !leakWarnedRef.current) {
      leakWarnedRef.current = true;
      console.warn(
        "[MutationBusy] counter > 10 — possible stuck busy state",
        counterRef.current
      );
    }
    if (counterRef.current === 1) setBusySnapshot(true);
  }, []);

  const endBusy = useCallback(() => {
    counterRef.current = Math.max(0, counterRef.current - 1);
    if (counterRef.current <= 10) leakWarnedRef.current = false;
    if (counterRef.current === 0) setBusySnapshot(false);
  }, []);

  const actions = useMemo(() => ({ beginBusy, endBusy }), [beginBusy, endBusy]);

  return <BusyActionsContext.Provider value={actions}>{children}</BusyActionsContext.Provider>;
}

export function useMutationBusyActions() {
  return useContext(BusyActionsContext);
}

export function useMutationBusyFlag() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Stable begin/end refs only — does not re-render when the overlay toggles. */
export function useMutationBusy() {
  return useMutationBusyActions();
}
