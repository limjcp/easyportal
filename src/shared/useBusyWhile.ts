import { useEffect, useRef } from "react";
import { usePageBusy } from "./PageBusyProvider";

export function useBusyWhile(active: boolean) {
  const busy = usePageBusy();
  const beginRef = useRef(busy?.beginBusy);
  const endRef = useRef(busy?.endBusy);
  beginRef.current = busy?.beginBusy;
  endRef.current = busy?.endBusy;

  useEffect(() => {
    if (!active) return;
    beginRef.current?.();
    return () => endRef.current?.();
  }, [active]);
}
