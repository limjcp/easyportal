import { useCallback, useMemo, useRef, useState } from "react";
import { StatusBadge } from "../../admin/components/AdminBadges";
import { AdminPanelTable } from "../../admin/components/AdminPanelTable";
import { CrudPanel } from "../../shared/CrudPanel";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import {
  useCompanyActivePoCountsByVendor,
  useCompanyBuildings,
  useCompanyVendors,
} from "../../shared/queries/companyQueries";
import { useInvalidatePortalQueries } from "../../shared/queries/useInvalidatePortalQueries";
import { isQueryInitiallyLoading } from "../../shared/useQueryPageBusy";
import { companyRepository } from "../data/companyRepository";
import { VendorFormModal } from "../modals/VendorFormModal";
import type { CompanyBuilding, Vendor } from "../../resident/data/types";
import type { CompanyRoute } from "../navigation";

type VendorsPageProps = {
  onNavigate: (route: CompanyRoute) => void;
};

export function VendorsPage({ onNavigate }: VendorsPageProps) {
  const { invalidateCompany } = useInvalidatePortalQueries();
  const vendorsQuery = useCompanyVendors();
  const { data: vendors = [], refetch: refetchVendors } = vendorsQuery;
  const buildingsQuery = useCompanyBuildings();
  const { data: buildings = [] } = buildingsQuery;
  const poCountsQuery = useCompanyActivePoCountsByVendor();
  const { data: activePoCounts = {}, refetch: refetchPoCounts } = poCountsQuery;
  const pageLoading =
    isQueryInitiallyLoading(vendorsQuery) ||
    isQueryInitiallyLoading(buildingsQuery) ||
    isQueryInitiallyLoading(poCountsQuery);
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activePoFilter, setActivePoFilter] = useState("all");
  const [buildingNameFilters, setBuildingNameFilters] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const pendingVendorRef = useRef<{ id: string; email: string } | null>(null);
  const pendingDeactivateIdRef = useRef<string | null>(null);

  const load = useCallback(() => {
    invalidateCompany();
    void refetchVendors();
    void refetchPoCounts();
  }, [invalidateCompany, refetchVendors, refetchPoCounts]);

  const { run: inviteVendor, loading: inviting, error: inviteError } = useAsyncAction(
    useCallback(async () => {
      const pending = pendingVendorRef.current;
      if (!pending) return;
      await companyRepository.inviteVendor(pending.id, pending.email);
    }, []),
    {
      successMessage: "Invitation sent.",
      onSuccess: load,
    }
  );

  const { run: deactivateVendor, loading: deactivating, error: deactivateError } = useAsyncAction(
    useCallback(async () => {
      if (!pendingDeactivateIdRef.current) return;
      await companyRepository.updateVendor(pendingDeactivateIdRef.current, { status: "inactive" });
    }, []),
    {
      successMessage: "Vendor deactivated.",
      onSuccess: load,
    }
  );

  const trades = Array.from(new Set(vendors.map((s) => s.tradeCategory)));
  const buildingById = useMemo(
    () =>
      buildings.reduce<Record<string, CompanyBuilding>>((acc, building) => {
        acc[building.id] = building;
        return acc;
      }, {}),
    [buildings]
  );

  const vendorBuildingNames = (vendor: Vendor) =>
    (vendor.buildingIds ?? [])
      .map((id) => buildingById[id]?.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .join(", ");

  const buildingNameOptions = useMemo(
    () =>
      Array.from(new Set(buildings.map((building) => building.name)))
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ value: name, label: name })),
    [buildings]
  );

  const filtered = vendors.filter((vendor) => {
    if (tradeFilter !== "all" && vendor.tradeCategory !== tradeFilter) return false;
    if (statusFilter !== "all" && vendor.status !== statusFilter) return false;
    if (activePoFilter !== "all") {
      const hasActivePo = (activePoCounts[vendor.id] ?? 0) > 0;
      if (activePoFilter === "yes" && !hasActivePo) return false;
      if (activePoFilter === "no" && hasActivePo) return false;
    }
    if (buildingNameFilters.length > 0) {
      const vendorBuildingSet = new Set(
        (vendor.buildingIds ?? []).map((buildingId) => buildingById[buildingId]?.name).filter(Boolean)
      );
      const hasMatchedBuilding = buildingNameFilters.some((selectedName) =>
        vendorBuildingSet.has(selectedName)
      );
      if (!hasMatchedBuilding) return false;
    }
    return true;
  });
  const sorted = [...filtered].sort((a, b) => a.companyName.localeCompare(b.companyName));

  const activeFilters = [
    tradeFilter !== "all" ? `Trade: ${tradeFilter}` : null,
    statusFilter !== "all"
      ? `Status: ${statusFilter === "pending_invite" ? "Pending Invite" : statusFilter}`
      : null,
    activePoFilter !== "all" ? `Has Active PO: ${activePoFilter === "yes" ? "Yes" : "No"}` : null,
    ...buildingNameFilters.map((name) => `Building: ${name}`),
  ].filter(Boolean) as string[];

  const statusLabel = (s: Vendor) => {
    if (s.status === "pending_invite") return "Pending Invite";
    if (s.status === "inactive") return "Inactive";
    return "Active";
  };

  const handleInvite = (s: Vendor) => {
    const email = s.email || prompt("Enter email to send invitation:");
    if (!email) return;
    pendingVendorRef.current = { id: s.id, email };
    void inviteVendor();
  };

  const actionError = inviteError ?? deactivateError;

  return (
    <CrudPanel loading={pageLoading}>
      <div className="mb-4 rounded bg-[#5c2d91] px-4 py-2 text-sm font-semibold text-white">
        Vendor / Trades Registry
      </div>
      <p className="mb-4 text-sm text-slate-600">
        Search your preferred vendors and contact information quickly. Add vendors manually or send
        invitations to join your registry.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setEditVendor(null);
            setFormOpen(true);
          }}
          className="rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:bg-[#2d68cf]"
        >
          + Add Vendor
        </button>
      </div>
      {actionError ? <FormAlert message={actionError} className="mb-4" /> : null}
      {activeFilters.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <span key={filter} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              {filter}
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              setTradeFilter("all");
              setStatusFilter("all");
              setActivePoFilter("all");
              setBuildingNameFilters([]);
            }}
            className="text-xs font-medium text-[#3476ef] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <AdminPanelTable
        title="Vendors"
        headerColor="brand"
        data={sorted}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        filters={[
          {
            id: "trade",
            label: "Trade",
            value: tradeFilter,
            options: [{ value: "all", label: "All" }, ...trades.map((t) => ({ value: t, label: t }))],
            onChange: setTradeFilter,
          },
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            options: [
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "pending_invite", label: "Pending Invite" },
              { value: "inactive", label: "Inactive" },
            ],
            onChange: setStatusFilter,
          },
          {
            id: "hasActivePo",
            label: "Has Active PO",
            value: activePoFilter,
            options: [
              { value: "all", label: "All" },
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ],
            onChange: setActivePoFilter,
          },
        ]}
        toolbarExtra={
          <label className="flex min-w-0 flex-col gap-1 text-slate-600 sm:flex-row sm:items-center sm:gap-2">
            <span className="shrink-0">Building Names</span>
            <select
              multiple
              value={buildingNameFilters}
              onChange={(e) =>
                setBuildingNameFilters(
                  Array.from(e.target.selectedOptions).map((option) => option.value)
                )
              }
              className="min-w-[14rem] rounded border border-slate-300 bg-white px-2 py-1"
            >
              {buildingNameOptions.map((buildingOption) => (
                <option key={buildingOption.value} value={buildingOption.value}>
                  {buildingOption.label}
                </option>
              ))}
            </select>
          </label>
        }
        columns={[
          { key: "company", header: "Company", render: (s) => s.companyName },
          { key: "buildingNames", header: "Buildings", render: (s) => vendorBuildingNames(s) || "—" },
          { key: "trade", header: "Trade", render: (s) => s.tradeCategory },
          { key: "activePo", header: "Active POs", render: (s) => activePoCounts[s.id] ?? 0 },
          { key: "contact", header: "Contact", render: (s) => s.contactName },
          { key: "phone", header: "Phone", render: (s) => s.phone },
          {
            key: "email",
            header: "Email",
            render: (s) => (
              <a href={`mailto:${s.email}`} className="text-[#3476ef] hover:underline">
                {s.email}
              </a>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (s) => <StatusBadge status={statusLabel(s)} />,
          },
          {
            key: "actions",
            header: "",
            render: (s) => (
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                  onClick={() => {
                    setEditVendor(s);
                    setFormOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded border border-[#3476ef] px-2 py-0.5 text-xs text-[#3476ef]"
                  onClick={() =>
                    onNavigate({ page: "purchase-orders", tab: "current", vendorId: s.id })
                  }
                >
                  View All POs
                </button>
                {s.status !== "inactive" && (
                  <button
                    type="button"
                    className="rounded bg-[#5c2d91] px-2 py-0.5 text-xs text-white"
                    onClick={() => handleInvite(s)}
                  >
                    {s.status === "pending_invite" ? "Resend Invite" : "Invite"}
                  </button>
                )}
                {s.status !== "inactive" && (
                  <button
                    type="button"
                    className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 disabled:opacity-60"
                    disabled={deactivating || inviting}
                    onClick={() => {
                      pendingDeactivateIdRef.current = s.id;
                      void deactivateVendor();
                    }}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />

      <VendorFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        vendor={editVendor}
      />
    </CrudPanel>
  );
}
