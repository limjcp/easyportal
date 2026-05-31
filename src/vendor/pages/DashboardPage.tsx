import { useEffect, useState } from "react";
import { vendorRepository } from "../data/vendorRepository";
import type { VendorRoute } from "../navigation";
import type { PurchaseOrder } from "../../resident/data/types";

type DashboardPageProps = {
  onNavigate: (route: VendorRoute) => void;
  refreshKey: number;
};

export function DashboardPage({ onNavigate, refreshKey }: DashboardPageProps) {
  const [stats, setStats] = useState({ pendingCount: 0, acceptedCount: 0, declinedCount: 0 });
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrder[]>([]);
  const [session, setSession] = useState<{ companyName: string; tradeCategory: string } | null>(
    null
  );

  useEffect(() => {
    vendorRepository.getDashboardStats().then(setStats);
    vendorRepository.getPurchaseOrders("action").then(setPendingOrders);
    vendorRepository.getSession().then((s) =>
      setSession({ companyName: s.companyName, tradeCategory: s.tradeCategory })
    );
  }, [refreshKey]);

  const oldestPending = pendingOrders[0];

  return (
    <div>
      <div className="mb-4 rounded bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white">
        Vendor Dashboard
      </div>
      {session && (
        <p className="mb-4 text-sm text-slate-600">
          Welcome back to the {session.companyName} vendor portal ({session.tradeCategory}).
        </p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Action required"
          value={stats.pendingCount}
          accent="amber"
          onClick={() => onNavigate({ page: "purchase-orders", tab: "action" })}
        />
        <StatCard
          label="Accepted orders"
          value={stats.acceptedCount}
          accent="green"
          onClick={() => onNavigate({ page: "purchase-orders", tab: "history" })}
        />
        <StatCard
          label="Declined orders"
          value={stats.declinedCount}
          accent="slate"
          onClick={() => onNavigate({ page: "purchase-orders", tab: "history" })}
        />
      </div>

      {oldestPending ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            You have {stats.pendingCount} purchase order{stats.pendingCount === 1 ? "" : "s"}{" "}
            awaiting your response.
          </p>
          <button
            type="button"
            onClick={() =>
              onNavigate({ page: "purchase-order-detail", id: oldestPending.id })
            }
            className="mt-2 rounded bg-[#0d9488] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f766e]"
          >
            Review {oldestPending.poNumber}
          </button>
        </div>
      ) : (
        <p className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No purchase orders require action right now.
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  onClick,
}: {
  label: string;
  value: number;
  accent: "amber" | "green" | "slate";
  onClick: () => void;
}) {
  const border =
    accent === "amber" ? "border-amber-300" : accent === "green" ? "border-green-300" : "border-slate-300";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border ${border} bg-white p-4 text-left shadow-sm transition hover:shadow`}
    >
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </button>
  );
}
