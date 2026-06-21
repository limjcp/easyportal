import { useCallback, useEffect, useState } from "react";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { Modal } from "../../shared/Modal";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useAuth } from "../../auth/AuthProvider";
import { companyRepository, requiresExplicitBuildingAssignments } from "../data/companyRepository";
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
  const auth = useAuth();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<CompanyRole>("Property Administrator");
  const [buildingIds, setBuildingIds] = useState<string[]>([]);
  const [buildings, setBuildings] = useState<CompanyBuilding[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { run, loading, error, clearError } = useAsyncAction(
    useCallback(async () => {
      if (requiresExplicitBuildingAssignments(role) && buildingIds.length === 0) {
        throw new Error("Select at least one building assignment for this role.");
      }
      await companyRepository.createEmployee({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role,
        assignedBuildingIds: buildingIds,
        password,
      });
      await auth.refreshAuth();
    }, [firstName, lastName, email, role, buildingIds, password, auth]),
    {
      successMessage: "Employee created.",
      onSuccess: () => {
        onSaved();
        onClose();
      },
    }
  );

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
      setValidationError(null);
      clearError();
      companyRepository.getBuildings().then(setBuildings);
    }
  }, [open, clearError]);

  const displayError = validationError ?? error;

  const handleContinue = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setValidationError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }
    if (password !== passwordConfirm) {
      setValidationError("Passwords do not match.");
      return;
    }
    setValidationError(null);
    clearError();
    setStep(2);
  };

  const handleSave = () => {
    setValidationError(null);
    void run();
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
            <ActionButton label="Back" variant="secondary" onClick={() => setStep(1)} />
          )}
          <ActionButton label="Cancel" variant="secondary" onClick={onClose} disabled={loading} />
          {step === 1 ? (
            <ActionButton
              label="Continue"
              onClick={handleContinue}
              className="inline-flex items-center gap-2"
            />
          ) : (
            <ActionButton
              label="Save Employee"
              loading={loading}
              onClick={handleSave}
            />
          )}
        </div>
      }
    >
      {displayError ? <FormAlert message={displayError} className="mb-3" /> : null}
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
          {!requiresExplicitBuildingAssignments(role) ? (
            <p className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              Company Owners and Administrators with no assignments have access to all buildings.
            </p>
          ) : null}
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
