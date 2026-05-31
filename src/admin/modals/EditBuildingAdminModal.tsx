import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { adminRepository } from "../data/adminRepository";
import { BUILDING_ADMIN_ROLES } from "../data/mock/buildingPermissions";
import type { BuildingAdmin } from "../../resident/data/types";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";

type EditBuildingAdminModalProps = {
  open: boolean;
  adminId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditBuildingAdminModal({ open, adminId, onClose, onSaved }: EditBuildingAdminModalProps) {
  const [role, setRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !adminId) return;
    adminRepository.getBuildingAdmin(adminId).then((admin) => {
      if (!admin) return;
      const roleOption = BUILDING_ADMIN_ROLES.find((r) => r.label === admin.role);
      setRole(roleOption?.value ?? admin.role);
      setFirstName(admin.firstName);
      setLastName(admin.lastName);
      setEmail(admin.email);
      setStatus(admin.status);
    });
  }, [open, adminId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId) return;
    setSaving(true);
    try {
      await adminRepository.updateBuildingAdmin(adminId, {
        role,
        firstName,
        lastName,
        email,
        status,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open && !!adminId}
      onClose={onClose}
      title="Edit Administrator"
      icon={<FaEdit className="text-[#7D5DA7]" />}
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
          <button
            type="submit"
            form="edit-building-admin-form"
            disabled={saving}
            className="rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      }
    >
      <form id="edit-building-admin-form" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Select Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
            {BUILDING_ADMIN_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            className={inputClass}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}
