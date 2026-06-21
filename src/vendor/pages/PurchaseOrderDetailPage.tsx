import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
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
  const declineReasonRef = useRef("");

  const load = useCallback(() => {
    vendorRepository.getPurchaseOrder(poId).then(async (p) => {
      setPo(p ?? null);
      if (p) {
        const b = await vendorRepository.getBuilding(p.buildingId);
        setBuilding(b);
      }
    });
  }, [poId]);

  useEffect(() => {
    load();
  }, [load]);

  const navigateToActionList = useCallback(() => {
    onRefresh();
    onNavigate({ page: "purchase-orders", tab: "action" });
  }, [onNavigate, onRefresh]);

  const { run: acceptOrder, loading: accepting, error: acceptError } = useAsyncAction(
    useCallback(async () => {
      if (!po) return;
      await vendorRepository.respondToPurchaseOrder(po.id, "accepted");
      navigateToActionList();
    }, [navigateToActionList, po]),
    {
      successMessage: "Purchase order accepted.",
      errorMessage: "Unable to accept purchase order.",
    }
  );

  const { run: declineOrder, loading: declining, error: declineError } = useAsyncAction(
    useCallback(async () => {
      if (!po) return;
      await vendorRepository.respondToPurchaseOrder(
        po.id,
        "declined",
        declineReasonRef.current || undefined
      );
      setDeclineOpen(false);
      navigateToActionList();
    }, [navigateToActionList, po]),
    {
      successMessage: "Purchase order declined.",
      errorMessage: "Unable to decline purchase order.",
    }
  );

  const responding = accepting || declining;
  const displayError = acceptError ?? declineError;

  const handleDecline = (reason: string) => {
    declineReasonRef.current = reason;
    void declineOrder();
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

      {displayError ? <FormAlert message={displayError} className="mb-4" /> : null}

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
          <ActionButton
            label="Decline"
            variant="danger"
            loading={declining}
            disabled={responding}
            onClick={() => setDeclineOpen(true)}
          />
          <ActionButton
            label="Accept order"
            variant="success"
            loadingLabel="Accepting…"
            loading={accepting}
            disabled={responding}
            onClick={() => void acceptOrder()}
          />
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
