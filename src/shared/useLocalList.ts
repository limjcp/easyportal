import { useCallback, useEffect, useRef, useState } from "react";

export function useLocalList<T>(
  fetcher: () => Promise<T[]>,
  refreshKey = 0
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const items = await fetcher();
      if (requestIdRef.current !== requestId) return;
      setData(items);
      setLoading(false);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Failed to load data.");
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    void fetcher()
      .then((items) => {
        if (requestIdRef.current !== requestId) return;
        setData(items);
        setLoading(false);
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : "Failed to load data.");
        setLoading(false);
      });
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetcher, refreshKey]);

  return { data, setData, reload, loading, error };
}
