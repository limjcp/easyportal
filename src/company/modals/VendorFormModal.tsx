import { useCallback, useEffect, useState } from "react";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { Modal } from "../../shared/Modal";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { companyRepository } from "../data/companyRepository";
import type { CompanyBuilding, Vendor } from "../../resident/data/types";

const TRADE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Cleaning",
  "General Contractor",
  "Landscaping",
  "Painting",
  "Other",
];

type VendorFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  vendor?: Vendor | null;
};

export function VendorFormModal({ open, onClose, onSaved, vendor }: VendorFormModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [tradeCategory, setTradeCategory] = useState("Plumbing");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [wsibRequired, setWsibRequired] = useState(true);
  const [buildings, setBuildings] = useState<CompanyBuilding[]>([]);
  const [buildingIds, setBuildingIds] = useState<string[]>([]);

  const { run, loading, error, setError, clearError } = useAsyncAction(
    useCallback(async () => {
      const payload = {
        companyName,
        tradeCategory,
        contactName,
        phone,
        email,
        buildingIds,
        notes,
        wsibRequired,
      };
      if (vendor) {
        await companyRepository.updateVendor(vendor.id, payload);
      } else {
        await companyRepository.createVendor(payload);
      }
    }, [vendor, companyName, tradeCategory, contactName, phone, email, buildingIds, notes, wsibRequired]),
    {
      successMessage: vendor ? "Vendor updated." : "Vendor created.",
      onSuccess: () => {
        onSaved();
        onClose();
      },
    }
  );

  useEffect(() => {
    if (open) {
      clearError();
      companyRepository.getBuildings().then(setBuildings);
    }
  }, [open, clearError]);

  useEffect(() => {
    if (open && vendor) {
      setCompanyName(vendor.companyName);
      setTradeCategory(vendor.tradeCategory);
      setContactName(vendor.contactName);
      setPhone(vendor.phone);
      setEmail(vendor.email);
      setNotes(vendor.notes ?? "");
      setWsibRequired(vendor.wsibRequired ?? true);
      setBuildingIds(vendor.buildingIds ?? []);
    } else if (open) {
      setCompanyName("");
      setTradeCategory("Plumbing");
      setContactName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setWsibRequired(true);
      setBuildingIds([]);
    }
  }, [open, vendor]);

  const handleSave = () => {
    if (!companyName.trim() || !email.trim()) {
      setError("Company name and email are required.");
      return;
    }
    void run();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={vendor ? "Edit Vendor" : "Add Vendor"}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <ActionButton label="Cancel" variant="secondary" onClick={onClose} disabled={loading} />
          <ActionButton label="Save" loading={loading} onClick={handleSave} />
        </div>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
      <div className="space-y-3 text-sm">
        <label className="block">
          Company Name *
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="block">
          Trade Category
          <select
            value={tradeCategory}
            onChange={(e) => setTradeCategory(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          >
            {TRADE_CATEGORIES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Contact Name
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="block">
          Phone
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="block">
          Email *
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="block">
          Building Associations (Names)
          <select
            multiple
            value={buildingIds}
            onChange={(e) =>
              setBuildingIds(Array.from(e.target.selectedOptions).map((option) => option.value))
            }
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          >
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.code} - {building.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Hold Ctrl (Windows) or Cmd (Mac) to select multiple.
          </p>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={wsibRequired}
            onChange={(e) => setWsibRequired(e.target.checked)}
          />
          <span>WSIB clearance required</span>
        </label>
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
