import { useEffect, useState } from "react";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/mockRepository";
import type { ServiceRequest } from "../data/types";

type ServiceRequestsPageProps = {
  onAddNew: () => void;
  refreshKey?: number;
};

export function ServiceRequestsPage({ onAddNew, refreshKey = 0 }: ServiceRequestsPageProps) {
  const [items, setItems] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    residentRepo.getServiceRequests().then(setItems);
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
          <motionlessRequestCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function motionlessRequestCard({ item }: { item: ServiceRequest }) {
  return (
    <div className="rounded border border-slate-200 p-4 text-sm">
      <div className="flex justify-between">
        <span className="font-medium text-slate-800">{item.category}</span>
        <span className="text-xs text-slate-500">{item.status}</span>
      </div>
      <p className="mt-1 text-slate-600">{item.description}</p>
      <p className="mt-2 text-xs text-slate-400">
        {item.location} · {item.severity} · {item.createdAt}
      </p>
    </div>
  );
}
