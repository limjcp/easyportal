import { useCallback, useEffect, useState } from "react";
import { FaUserPlus } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { adminRepository } from "../data/adminRepository";
import { BUILDING_ADMIN_ROLES } from "../data/mock/buildingPermissions";
import type { BuildingAdmin } from "../../resident/data/types";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";

type AddBuildingAdminModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (admin: BuildingAdmin) => void;
};

export function AddBuildingAdminModal({ open, onClose, onCreated }: AddBuildingAdminModalProps) {
  const [role, setRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const { run: submitAdmin, loading: saving, error, clearError } = useAsyncAction(
    useCallback(async () => {
      const created = await adminRepository.createBuildingAdmin({
        role,
        firstName,
        lastName,
        email,
      });
      onCreated(created);
      onClose();
    }, [role, firstName, lastName, email, onCreated, onClose]),
    { successMessage: "Building admin created. Login details emailed.", showErrorToast: false }
  );

  useEffect(() => {
    if (!open) return;
    setRole("");
    setFirstName("");
    setLastName("");
    setEmail("");
    clearError();
  }, [open, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await submitAdmin();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a new Admin"
      icon={<FaUserPlus className="text-[#7D5DA7]" />}
      size="md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <ActionButton
            label="Continue"
            loading={saving}
            type="submit"
            form="add-building-admin-form"
          />
        </div>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
      <form id="add-building-admin-form" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Select Role: <span className="text-red-600">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Select Role</option>
            {BUILDING_ADMIN_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              First Name: <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="off"
              placeholder="First Name"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Last Name: <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="off"
              placeholder="Last Name"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            placeholder="Email"
            className={inputClass}
          />
        </div>
        <p className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          A temporary password will be emailed to this address. They must choose a new password on
          first sign-in.
        </p>
      </form>
    </Modal>
  );
}
