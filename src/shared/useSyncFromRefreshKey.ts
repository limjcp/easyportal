import { useEffect, useRef } from "react";

/** Re-run `sync` when `refreshKey` bumps — avoids unstable callback deps in the effect. */
export function useSyncFromRefreshKey(refreshKey: number, sync: () => void | Promise<void>) {
  const syncRef = useRef(sync);
  syncRef.current = sync;

  useEffect(() => {
    if (refreshKey === 0) return;
    void syncRef.current();
  }, [refreshKey]);
}
