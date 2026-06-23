import type { ReactNode } from "react";
import { LoadingOverlay } from "./LoadingOverlay";
import {
  MutationBusyProvider,
  useMutationBusyActions,
  useMutationBusyFlag,
} from "./MutationBusyContext";

/** Stable begin/end — safe for runWithBusy and useAsyncAction without overlay re-renders. */
export function usePageBusy() {
  return useMutationBusyActions();
}

function PageBusyOverlay() {
  const busy = useMutationBusyFlag();
  return <LoadingOverlay active={busy} />;
}

export function PageBusyProvider({ children }: { children: ReactNode }) {
  return (
    <MutationBusyProvider>
      {children}
      <PageBusyOverlay />
    </MutationBusyProvider>
  );
}
