import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getPortalConfig } from "../data/portalConfig";
import type { PortalConfig } from "../data/types";

const PortalConfigContext = createContext<PortalConfig | null>(null);

export function PortalConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PortalConfig | null>(null);

  useEffect(() => {
    setConfig(getPortalConfig());
  }, []);

  if (!config) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading portal...</div>;
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
