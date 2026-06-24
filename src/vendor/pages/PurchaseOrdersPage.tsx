import { useEffect, useState } from "react";
import { StatusBadge } from "../../admin/components/AdminBadges";
import { AdminPanelTable, AdminTabs } from "../../admin/components/AdminPanelTable";
import { CrudPanel } from "../../shared/CrudPanel";
import { vendorRepository } from "../data/vendorRepository";
import type { VendorRoute } from "../navigation";
import type { CompanyBuilding, PurchaseOrder } from "../../resident/data/types";

type PurchaseOrdersPageProps = {
  route: VendorRoute & { page: "purchase-orders" };
  onNavigate: (route: VendorRoute) => void;
  refreshKey: number;
};

export function PurchaseOrdersPage({ route, onNavigate, refreshKey }: PurchaseOrdersPageProps) {
  const tab = route.tab ?? "action";
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [buildings, setBuildings] = useState<CompanyBuilding[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    vendorRepository.getPurchaseOrders(tab).then(setOrders);
    vendorRepository.getBuildings().then(setBuildings);
  }, [tab, refreshKey]);

  const buildingName = (id: string) => {
    const b = buildings.find((x) => x.id === id);
    return b ? `${b.name}` : id;
  };

  const statusLabel = (s: PurchaseOrder["status"]) => {
    const map: Record<PurchaseOrder["status"], string> = {
      draft: "Draft",
      sent: "Pending",
      accepted: "Accepted",
      declined: "Declined",
    };
    return map[s];
  };

  return (
    <CrudPanel>
      <div className="mb-4 rounded bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white">
        Purchase Orders
      </div>
      <p className="mb-4 text-sm text-slate-600">
        Review purchase orders sent by property management. Accept or decline orders that require
        action.
      </p>

      <AdminTabs
        tabs={[
          { id: "action", label: "Action Required" },
          { id: "history", label: "History" },
        ]}
        active={tab}
        onChange={(id) => onNavigate({ page: "purchase-orders", tab: id as "action" | "history" })}
      />

      <AdminPanelTable
        title={tab === "action" ? "Orders awaiting response" : "Order history"}
        headerColor="green"
        data={orders}
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        page={page}
        onPageChange={setPage}
        columns={[
          { key: "po", header: "PO #", render: (r) => r.poNumber },
          { key: "building", header: "Building", render: (r) => buildingName(r.buildingId) },
          { key: "sent", header: "Sent", render: (r) => r.sentAt ?? "—" },
          {
            key: "total",
            header: "Total",
            render: (r) => `$${r.total.toFixed(2)}`,
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <StatusBadge status={statusLabel(r.status)} />,
          },
          {
            key: "view",
            header: "",
            render: (r) => (
              <button
                type="button"
                onClick={() => onNavigate({ page: "purchase-order-detail", id: r.id })}
                className="rounded bg-slate-600 px-2 py-1 text-xs text-white"
              >
                View
              </button>
            ),
          },
        ]}
      />
    </CrudPanel>
  );
}
