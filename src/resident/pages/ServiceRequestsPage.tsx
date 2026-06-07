import { useEffect, useState } from "react";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { ServiceRequestDetailModal } from "../modals/ServiceRequestDetailModal";
import { residentRepo } from "../data/mockRepository";
import type { ServiceRequest } from "../data/types";

type ServiceRequestsPageProps = {
  onAddNew: () => void;
  refreshKey?: number;
};

function statusClass(status: string): string {
  if (status === "Resolved") return "bg-[#5cb85c] text-white";
  if (status === "Pending") return "bg-amber-500 text-white";
  return "bg-slate-500 text-white";
}

export function ServiceRequestsPage({ onAddNew, refreshKey = 0 }: ServiceRequestsPageProps) {
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const reload = () => {
    residentRepo.getServiceRequests().then(setItems);
  };

  useEffect(() => {
    reload();
  }, [refreshKey]);

  if (items.length === 0) {
    return (
      <EmptyState
        title="There are no Service Requests"
        subtitle="Would you like to create a new Service request?"
        action={
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
          >
            + Add New
          </button>
        }
      />
    );
  }

  return (
    <>
      <div className="rounded-sm bg-white/95 p-4 shadow-lg">
        <ModuleMessageBanner moduleId="serviceRequest" />
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onAddNew}
            className="rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:bg-[#2d68cf]"
          >
            + Add New
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedRequestId(item.id)}
              className={`relative w-full rounded border p-4 text-left text-sm transition hover:border-[#3476ef] hover:bg-slate-50 ${
                item.unread || item.status === "Pending"
                  ? "border-[#3476ef]/40 bg-slate-50/80"
                  : "border-slate-200"
              }`}
            >
              {(item.unread || item.status === "Pending") && (
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#3476ef]" aria-hidden />
              )}
              <div className="flex items-start justify-between gap-3 pr-4">
                <span className="font-medium text-slate-800">{item.category}</span>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${statusClass(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-slate-600">{item.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                {item.location} · {item.severity} · {item.createdAt}
              </p>
            </button>
          ))}
        </div>
      </div>

      <ServiceRequestDetailModal
        open={selectedRequestId !== null}
        requestId={selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        onUpdated={reload}
      />
    </>
  );
}
