import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getPortalConfig, loadPortalConfig, setCachedPortalConfig } from "../data/portalConfig";
import type { PortalConfig } from "../data/types";

const PortalConfigContext = createContext<PortalConfig | null>(null);

type PortalConfigProviderProps = {
  children: ReactNode;
  buildingKey?: string | null;
};

export function PortalConfigProvider({ children, buildingKey }: PortalConfigProviderProps) {
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!buildingKey) return;
    setConfig(null);
    setError(null);
    loadPortalConfig()
      .then((loaded) => {
        setCachedPortalConfig(loaded);
        setConfig(loaded);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load portal configuration");
        setConfig(getPortalConfig());
      });
  }, [buildingKey]);

  if (!buildingKey) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">Loading building…</div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        {error ? `Portal error: ${error}` : "Loading portal..."}
      </div>
    );
  }

  return <PortalConfigContext.Provider value={config}>{children}</PortalConfigContext.Provider>;
}

export function usePortalConfig(): PortalConfig {
  const ctx = useContext(PortalConfigContext);
  if (!ctx) throw new Error("usePortalConfig must be used within PortalConfigProvider");
  return ctx;
}

export function usePortalConfigOptional(): PortalConfig | null {
  return useContext(PortalConfigContext);
}
