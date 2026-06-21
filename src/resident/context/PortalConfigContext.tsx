import { createContext, useContext, type ReactNode } from "react";
import { usePortalConfigQuery } from "../../shared/queries/buildingQueries";
import type { PortalConfig } from "../data/types";

const PortalConfigContext = createContext<PortalConfig | null>(null);

type PortalConfigProviderProps = {
  children: ReactNode;
  buildingKey?: string | null;
};

export function PortalConfigProvider({ children, buildingKey }: PortalConfigProviderProps) {
  const { data: config, error, isLoading } = usePortalConfigQuery(buildingKey ?? null);

  if (!buildingKey) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">Loading building…</div>
    );
  }

  if (isLoading && !config) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">Loading portal...</div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        {error instanceof Error ? `Portal error: ${error.message}` : "Failed to load portal configuration."}
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
