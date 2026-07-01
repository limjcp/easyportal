import { useEffect, useState } from "react";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { usePortalConfig } from "../context/PortalConfigContext";
import { residentRepo } from "../data/residentRepository";
import type { StatusCertificate } from "../data/types";

type StatusCertificatesPageProps = {
  onAddNew: () => void;
  refreshKey?: number;
};

export function StatusCertificatesPage({ onAddNew, refreshKey = 0 }: StatusCertificatesPageProps) {
  const { publicPortalSettings } = usePortalConfig();
  const themeColor = publicPortalSettings.portalThemeColor;
  const [items, setItems] = useState<StatusCertificate[]>([]);

  useEffect(() => {
    residentRepo.getStatusCertificates().then(setItems);
  }, [refreshKey]);

  if (items.length === 0) {
    return (
      <>
        <ModuleMessageBanner moduleId="statusCerts" />
        <EmptyState
          title="There are no Status Certificate requests"
          subtitle="Request a status or estoppel certificate for your unit."
          action={
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              + Request Certificate
            </button>
          }
        />
      </>
    );
  }

  return (
    <div className="rounded-sm bg-white/95 p-4 shadow-lg">
      <ModuleMessageBanner moduleId="statusCerts" />
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={onAddNew}
          className="rounded px-3 py-1.5 text-sm text-white hover:opacity-90"
          style={{ backgroundColor: themeColor }}
        >
          + Request Certificate
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded border border-slate-200 p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="font-medium text-slate-800">{item.certificateType}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{item.status}</span>
            </div>
            <p className="mt-2 text-slate-600">{item.notes}</p>
            <p className="mt-2 text-xs text-slate-400">
              Unit {item.unit} · {item.requestedBy} · {item.createdAt}
              {item.rushProcessing ? " · Rush" : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
