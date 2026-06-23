import { useCallback, useEffect, useState } from "react";

import { CrudPanel } from "../../shared/CrudPanel";

import { EmptyState } from "../../shared/EmptyState";

import { useBuildingListRefresh } from "../../shared/queries/mutationHelpers";

import { queryKeys } from "../../shared/queryKeys";

import { useResidentServiceRequests } from "../../shared/queries/residentListQueries";

import { useInvalidatePortalQueries } from "../../shared/queries/useInvalidatePortalQueries";

import { useTenantContext } from "../../shared/queries/useTenantContext";

import { isQueryPageLoading } from "../../shared/useQueryPageBusy";

import { ModuleMessageBanner } from "../components/ModuleMessageBanner";

import { ServiceRequestDetailModal } from "../modals/ServiceRequestDetailModal";

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

  const { queryClient } = useInvalidatePortalQueries();

  const { userId, buildingId } = useTenantContext();

  const listQueryKey =

    userId && buildingId ? queryKeys.building.residentServiceRequests(userId, buildingId) : null;

  const requestsQuery = useResidentServiceRequests();

  const { data: items = [], refetch } = requestsQuery;

  const pageLoading = isQueryPageLoading(requestsQuery);

  const { refreshList } = useBuildingListRefresh<ServiceRequest>(

    queryClient,

    buildingId,

    listQueryKey,

    refetch

  );

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);



  const reload = useCallback(

    async (updated?: ServiceRequest) => {

      if (updated) await refreshList(updated);

      else await refreshList();

    },

    [refreshList]

  );



  useEffect(() => {

    if (refreshKey === 0) return;

    void reload();

  }, [refreshKey, reload]);



  if (!pageLoading && items.length === 0) {

    return (

      <CrudPanel>

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

      </CrudPanel>

    );

  }



  return (

    <CrudPanel loading={pageLoading}>

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

              <p className="mt-1 text-slate-600">{item.description}</p>

              <p className="mt-2 text-xs text-slate-500">{item.createdAt}</p>

            </button>

          ))}

        </div>

      </div>



      <ServiceRequestDetailModal

        open={!!selectedRequestId}

        requestId={selectedRequestId}

        onClose={() => setSelectedRequestId(null)}

        onUpdated={() => void reload()}

      />

    </CrudPanel>

  );

}


