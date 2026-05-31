import { useEffect, useState } from "react";
import { Modal } from "../../shared/Modal";
import { companyRepository } from "../data/companyRepository";
import type { CompanyBuilding, PurchaseOrder, Vendor } from "../../resident/data/types";

type PurchaseOrderDetailModalProps = {
  open: boolean;
  poId: string | null;
  onClose: () => void;
  onUpdated: () => void;
};

export function PurchaseOrderDetailModal({
  open,
  poId,
  onClose,
  onUpdated,
}: PurchaseOrderDetailModalProps) {
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [vendor, setVendor] = useState<Vendor | undefined>();
  const [building, setBuilding] = useState<CompanyBuilding | undefined>();

  useEffect(() => {
    if (!open || !poId) return;
    companyRepository.getPurchaseOrder(poId).then(async (p) => {
      setPo(p ?? null);
      if (p) {
        const [sups, blds] = await Promise.all([
          companyRepository.getVendors(),
          companyRepository.getBuildings(),
        ]);
        setVendor(sups.find((s) => s.id === p.vendorId));
        setBuilding(blds.find((b) => b.id === p.buildingId));
      }
    });
  }, [open, poId]);

  const handleSend = async () => {
    if (!po) return;
    await companyRepository.sendPurchaseOrder(po.id);
    onUpdated();
    onClose();
  };

  if (!po) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Purchase Order ${po.poNumber}`}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Close
          </button>
          {po.status === "draft" && (
            <button
              type="button"
              onClick={handleSend}
              className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white"
            >
              Send to Vendor
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-3 text-sm text-slate-700">
        <p>
          <strong>Status:</strong> {po.status}
        </p>
        <p>
          <strong>Vendor:</strong> {vendor?.companyName ?? po.vendorId}
        </p>
        <p>
          <strong>Building:</strong> {building ? `${building.name} — ${building.address}` : po.buildingId}
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
            <strong>Notes:</strong> {po.notes}
          </p>
        )}
        {po.status === "sent" && (
          <p className="text-xs text-slate-500">
            Awaiting vendor response in the Vendor Portal. You will receive a notification when
            they accept or decline.
          </p>
        )}
        {po.declineReason && (
          <p>
            <strong>Decline reason:</strong> {po.declineReason}
          </p>
        )}
      </div>
    </Modal>
  );
}
