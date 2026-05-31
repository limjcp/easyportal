import { useEffect, useState } from "react";
import { Modal } from "../../shared/Modal";
import { companyRepository } from "../data/companyRepository";
import type { CompanyBuilding, PurchaseOrderPrefill, Vendor } from "../../resident/data/types";

type LineDraft = { description: string; quantity: number; unitPrice: number };

type PurchaseOrderFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  prefill?: PurchaseOrderPrefill;
};

export function PurchaseOrderFormModal({
  open,
  onClose,
  onSaved,
  prefill,
}: PurchaseOrderFormModalProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [buildings, setBuildings] = useState<CompanyBuilding[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      companyRepository.getVendors().then((s) => {
        const active = s.filter((x) => x.status === "active");
        setVendors(active);
        if (active[0]) setVendorId(active[0].id);
      });
      companyRepository.getBuildings().then((b) => {
        setBuildings(b);
        const prefilledBuildingId = prefill?.buildingId;
        if (prefilledBuildingId && b.some((item) => item.id === prefilledBuildingId)) {
          setBuildingId(prefilledBuildingId);
          return;
        }
        if (b[0]) setBuildingId(b[0].id);
      });
      setLines(prefill?.initialLineItems?.length ? prefill.initialLineItems : [{ description: "", quantity: 1, unitPrice: 0 }]);
      setNotes(prefill?.notes ?? "");
    }
  }, [open, prefill]);

  const updateLine = (i: number, field: keyof LineDraft, value: string | number) => {
    const next = [...lines];
    next[i] = { ...next[i], [field]: value };
    setLines(next);
  };

  const addLine = () => setLines([...lines, { description: "", quantity: 1, unitPrice: 0 }]);

  const handleSubmit = async (send: boolean) => {
    if (!vendorId || !buildingId) {
      alert("Select vendor and building.");
      return;
    }
    const validLines = lines.filter((l) => l.description.trim());
    if (validLines.length === 0) {
      alert("Add at least one line item.");
      return;
    }
    setSaving(true);
    await companyRepository.createPurchaseOrder({
      vendorId,
      buildingId,
      sourceRequest: prefill?.sourceRequest,
      lineItems: validLines,
      notes,
      status: send ? "sent" : "draft",
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Purchase Order"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="rounded border border-slate-400 px-4 py-2 text-sm"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white"
          >
            Send to Vendor
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-sm">
        <label className="block">
          Vendor *
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          >
            {vendors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.companyName}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Building *
          <select
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            disabled={prefill?.lockBuilding}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.address}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className="mb-2 font-medium">Line Items</p>
          {lines.map((line, i) => (
            <div key={i} className="mb-2 grid gap-2 sm:grid-cols-4">
              <input
                type="text"
                placeholder="Description"
                value={line.description}
                onChange={(e) => updateLine(i, "description", e.target.value)}
                className="rounded border border-slate-300 px-2 py-1 sm:col-span-2"
              />
              <input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => updateLine(i, "quantity", Number(e.target.value))}
                className="rounded border border-slate-300 px-2 py-1"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={line.unitPrice}
                onChange={(e) => updateLine(i, "unitPrice", Number(e.target.value))}
                className="rounded border border-slate-300 px-2 py-1"
              />
            </div>
          ))}
          <button type="button" onClick={addLine} className="text-sm text-[#3476ef] hover:underline">
            + Add line
          </button>
        </div>
        <p className="font-semibold">Total: ${total.toFixed(2)}</p>
        <label className="block">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          />
        </label>
      </div>
    </Modal>
  );
}
