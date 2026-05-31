import { useEffect, useState } from "react";
import { vendorRepository } from "../data/vendorRepository";
import { DeclinePurchaseOrderModal } from "../modals/DeclinePurchaseOrderModal";
import type { VendorRoute } from "../navigation";
import type { CompanyBuilding, PurchaseOrder } from "../../resident/data/types";

type PurchaseOrderDetailPageProps = {
  poId: string;
  onNavigate: (route: VendorRoute) => void;
  onRefresh: () => void;
};

export function PurchaseOrderDetailPage({
  poId,
  onNavigate,
  onRefresh,
}: PurchaseOrderDetailPageProps) {
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [building, setBuilding] = useState<CompanyBuilding | undefined>();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [responding, setResponding] = useState(false);

  const load = () => {
    vendorRepository.getPurchaseOrder(poId).then(async (p) => {
      setPo(p ?? null);
      if (p) {
        const b = await vendorRepository.getBuilding(p.buildingId);
        setBuilding(b);
      }
    });
  };

  useEffect(() => {
    load();
  }, [poId]);

  const handleAccept = async () => {
    if (!po) return;
    setResponding(true);
    await vendorRepository.respondToPurchaseOrder(po.id, "accepted");
    setResponding(false);
    onRefresh();
    onNavigate({ page: "purchase-orders", tab: "action" });
  };

  const handleDecline = async (reason: string) => {
    if (!po) return;
    setResponding(true);
    await vendorRepository.respondToPurchaseOrder(po.id, "declined", reason || undefined);
    setResponding(false);
    setDeclineOpen(false);
    onRefresh();
    onNavigate({ page: "purchase-orders", tab: "action" });
  };

  if (!po) {
    return <p className="text-sm text-slate-600">Purchase order not found.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="rounded bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white">
          {po.poNumber}
        </div>
        <button
          type="button"
          onClick={() => onNavigate({ page: "purchase-orders", tab: "action" })}
          className="text-sm text-[#0d9488] hover:underline"
        >
          ← Back to list
        </button>
      </div>

      <div className="space-y-3 rounded border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p>
          <strong>Status:</strong>{" "}
          <span className="capitalize">{po.status === "sent" ? "Pending your response" : po.status}</span>
        </p>
        <p>
          <strong>Building:</strong>{" "}
          {building ? `${building.name} — ${building.address}` : po.buildingId}
        </p>
        <p>
          <strong>Created:</strong> {po.createdAt} by {po.createdBy}
        </p>
        {po.sentAt && (
          <p>
            <strong>Sent:</strong> {po.sentAt}
          </p>
        )}
        {po.respondedAt && (
          <p>
            <strong>Responded:</strong> {po.respondedAt}
          </p>
        )}
        {po.declineReason && (
          <p>
            <strong>Decline reason:</strong> {po.declineReason}
          </p>
        )}

        <table className="w-full border border-slate-200 text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-2 py-1 text-left">Description</th>
              <th className="px-2 py-1 text-right">Qty</th>
              <th className="px-2 py-1 text-right">Unit</th>
              <th className="px-2 py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {po.lineItems.map((li) => (
              <tr key={li.id} className="border-t border-slate-100">
                <td className="px-2 py-1">{li.description}</td>
                <td className="px-2 py-1 text-right">{li.quantity}</td>
                <td className="px-2 py-1 text-right">${li.unitPrice.toFixed(2)}</td>
                <td className="px-2 py-1 text-right">${(li.quantity * li.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-right font-semibold">Total: ${po.total.toFixed(2)}</p>
        {po.notes && (
          <p>
            <strong>Notes from company:</strong> {po.notes}
          </p>
        )}
      </div>

      {po.status === "sent" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={responding}
            onClick={() => setDeclineOpen(true)}
            className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Decline
          </button>
          <button
            type="button"
            disabled={responding}
            onClick={handleAccept}
            className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Accept order
          </button>
        </div>
      )}

      <DeclinePurchaseOrderModal
        open={declineOpen}
        poNumber={po.poNumber}
        onClose={() => setDeclineOpen(false)}
        onConfirm={handleDecline}
      />
    </div>
  );
}
