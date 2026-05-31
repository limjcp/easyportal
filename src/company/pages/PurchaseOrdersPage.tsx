import { useEffect, useState } from "react";
import { StatusBadge } from "../../admin/components/AdminBadges";
import { AdminPanelTable, AdminTabs } from "../../admin/components/AdminPanelTable";
import { companyRepository } from "../data/companyRepository";
import { PurchaseOrderDetailModal } from "../modals/PurchaseOrderDetailModal";
import { PurchaseOrderFormModal } from "../modals/PurchaseOrderFormModal";
import type { CompanyRoute } from "../navigation";
import type { CompanyBuilding, PurchaseOrder, Vendor } from "../../resident/data/types";

type PurchaseOrdersPageProps = {
  route: CompanyRoute & { page: "purchase-orders" };
  onNavigate: (route: CompanyRoute) => void;
  onRefresh: () => void;
};

export function PurchaseOrdersPage({ route, onNavigate, onRefresh }: PurchaseOrdersPageProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [buildings, setBuildings] = useState<CompanyBuilding[]>([]);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState(route.vendorId ?? "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const tab = route.tab ?? "current";

  const load = () => {
    companyRepository.getPurchaseOrders(tab === "archived").then(setOrders);
    companyRepository.getVendors().then(setVendors);
    companyRepository.getBuildings().then(setBuildings);
  };

  useEffect(() => {
    load();
  }, [tab]);

  useEffect(() => {
    setVendorFilter(route.vendorId ?? "all");
  }, [route.vendorId]);

  const statusLabel = (s: PurchaseOrder["status"]) => {
    const map: Record<PurchaseOrder["status"], string> = {
      draft: "Draft",
      sent: "Pending",
      accepted: "Accepted",
      declined: "Declined",
    };
    return map[s];
  };

  const filtered = orders.filter((order) => {
    if (vendorFilter !== "all" && order.vendorId !== vendorFilter) return false;
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (buildingFilter !== "all" && order.buildingId !== buildingFilter) return false;
    if (dateFrom && order.createdAt < dateFrom) return false;
    if (dateTo && order.createdAt > dateTo) return false;
    if (minTotal && order.total < Number(minTotal)) return false;
    if (maxTotal && order.total > Number(maxTotal)) return false;
    return true;
  });

  const activeFilters = [
    vendorFilter !== "all"
      ? `Vendor: ${vendors.find((vendor) => vendor.id === vendorFilter)?.companyName ?? vendorFilter}`
      : null,
    statusFilter !== "all" ? `Status: ${statusLabel(statusFilter as PurchaseOrder["status"])}` : null,
    buildingFilter !== "all"
      ? `Building: ${buildings.find((building) => building.id === buildingFilter)?.name ?? buildingFilter}`
      : null,
    dateFrom ? `From: ${dateFrom}` : null,
    dateTo ? `To: ${dateTo}` : null,
    minTotal ? `Min: $${minTotal}` : null,
    maxTotal ? `Max: $${maxTotal}` : null,
  ].filter(Boolean) as string[];

  return (
    <div>
      <div className="mb-4 rounded bg-[#5c2d91] px-4 py-2 text-sm font-semibold text-white">
        Purchase Order Management
      </div>
      <p className="mb-4 text-sm text-slate-600">
        Place purchase orders with vendors and track acceptance or decline. Vendors respond via
        the Vendor Portal; notifications appear when they accept or decline.
      </p>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:bg-[#2d68cf]"
        >
          + Create Purchase Order
        </button>
      </div>
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
              setVendorFilter("all");
              setStatusFilter("all");
              setBuildingFilter("all");
              setDateFrom("");
              setDateTo("");
              setMinTotal("");
              setMaxTotal("");
            }}
            className="text-xs font-medium text-[#3476ef] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <AdminTabs
        tabs={[
          { id: "current", label: "Current POs" },
          { id: "archived", label: "Archived POs" },
        ]}
        activeTab={tab}
        onChange={(t) =>
          onNavigate({
            page: "purchase-orders",
            tab: t as "current" | "archived",
            vendorId: vendorFilter !== "all" ? vendorFilter : undefined,
          })
        }
      />

      <AdminPanelTable
        title={tab === "archived" ? "Archived Purchase Orders" : "Current Purchase Orders"}
        headerColor="purple"
        data={filtered}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        filters={[
          {
            id: "vendor",
            label: "Vendor",
            value: vendorFilter,
            onChange: setVendorFilter,
            options: [
              { value: "all", label: "All" },
              ...vendors.map((vendor) => ({ value: vendor.id, label: vendor.companyName })),
            ],
          },
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All" },
              { value: "draft", label: "Draft" },
              { value: "sent", label: "Pending" },
              { value: "accepted", label: "Accepted" },
              { value: "declined", label: "Declined" },
            ],
          },
          {
            id: "building",
            label: "Building",
            value: buildingFilter,
            onChange: setBuildingFilter,
            options: [
              { value: "all", label: "All" },
              ...buildings.map((building) => ({ value: building.id, label: building.name })),
            ],
          },
        ]}
        toolbarExtra={
          <div className="flex flex-wrap items-end gap-2 text-xs">
            <label className="flex flex-col">
              Date From
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="flex flex-col">
              Date To
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="flex flex-col">
              Min Total
              <input
                type="number"
                min={0}
                step={0.01}
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value)}
                className="w-28 rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="flex flex-col">
              Max Total
              <input
                type="number"
                min={0}
                step={0.01}
                value={maxTotal}
                onChange={(e) => setMaxTotal(e.target.value)}
                className="w-28 rounded border border-slate-300 px-2 py-1"
              />
            </label>
          </div>
        }
        columns={[
          { key: "po", header: "PO #", render: (o) => o.poNumber },
          {
            key: "vendor",
            header: "Vendor",
            render: (o) => vendors.find((s) => s.id === o.vendorId)?.companyName ?? "—",
          },
          {
            key: "building",
            header: "Building",
            render: (o) => buildings.find((b) => b.id === o.buildingId)?.name ?? "—",
          },
          { key: "date", header: "Date", render: (o) => o.createdAt },
          {
            key: "status",
            header: "Status",
            render: (o) => <StatusBadge status={statusLabel(o.status)} />,
          },
          { key: "total", header: "Total", render: (o) => `$${o.total.toFixed(2)}` },
          {
            key: "view",
            header: "",
            render: (o) => (
              <button
                type="button"
                onClick={() => setDetailId(o.id)}
                className="rounded bg-slate-600 px-2 py-1 text-xs text-white"
              >
                View
              </button>
            ),
          },
        ]}
      />

      <PurchaseOrderFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          load();
          onRefresh();
        }}
      />
      <PurchaseOrderDetailModal
        open={!!detailId}
        poId={detailId}
        onClose={() => setDetailId(null)}
        onUpdated={() => {
          load();
          onRefresh();
        }}
      />
    </div>
  );
}
