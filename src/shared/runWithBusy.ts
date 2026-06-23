import type { MutationBusyActions } from "./MutationBusyContext";

export async function runWithBusy(
  busy: MutationBusyActions | null | undefined,
  fn: () => Promise<void>
) {
  busy?.beginBusy();
  try {
    await fn();
  } finally {
    busy?.endBusy();
  }
}
