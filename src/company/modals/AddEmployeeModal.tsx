import { useEffect, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { companyRepository } from "../data/companyRepository";
import type { CompanyBuilding, CompanyRole } from "../../resident/data/types";

const ROLES: CompanyRole[] = [
  "Company Owner",
  "Company Administrator",
  "Company Accountant",
  "Property Manager",
  "Property Administrator",
  "Board Member",
];

type AddEmployeeModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function AddEmployeeModal({ open, onClose, onSaved }: AddEmployeeModalProps) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<CompanyRole>("Property Administrator");
  const [buildingIds, setBuildingIds] = useState<string[]>([]);
  const [buildings, setBuildings] = useState<CompanyBuilding[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      setRole("Property Administrator");
      setBuildingIds([]);
      setError(null);
      companyRepository.getBuildings().then(setBuildings);
    }
  }, [open]);

  const handleContinue = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await companyRepository.createEmployee({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role,
        assignedBuildingIds: buildingIds,
        password,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee.");
    } finally {
      setSaving(false);
    }
  };

  const toggleBuilding = (id: string) => {
    setBuildingIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a new Employee"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          {step === 2 && (
            <button type="button" onClick={() => setStep(1)} className="rounded border border-slate-300 px-4 py-2 text-sm">
              Back
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          {step === 1 ? (
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm text-white"
            >
              Continue <FaArrowRight />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Employee"}
            </button>
          )}
        </div>
      }
    >
      {error ? (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}
      {step === 1 ? (
        <div className="space-y-3">
          <label className="block text-sm">
            First Name *
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Last Name *
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Email *
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Password *
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Confirm Password *
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm">
            Role *
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CompanyRole)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <div className="text-sm">
            <p className="mb-2 font-medium text-slate-700">Assigned Buildings</p>
            <div className="max-h-48 overflow-y-auto rounded border border-slate-200 p-2">
              {buildings.map((b) => (
                <label key={b.id} className="flex items-start gap-2 py-1 text-xs">
                  <input
                    type="checkbox"
                    checked={buildingIds.includes(b.id)}
                    onChange={() => toggleBuilding(b.id)}
                  />
                  {b.name} — {b.address}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
