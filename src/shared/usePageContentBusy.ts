import { useBusyWhile } from "./useBusyWhile";

/** Show the page-level busy overlay while primary content is loading. */
export function usePageContentBusy(loading: boolean) {
  useBusyWhile(loading);
}
