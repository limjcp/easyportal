import { useEffect, useState } from "react";
import { Modal } from "../../shared/Modal";
import { companyRepository } from "../data/companyRepository";
import type { CompanyRole, PermissionModuleRow } from "../../resident/data/types";

const ROLES: CompanyRole[] = [
  "Company Owner",
  "Company Administrator",
  "Company Accountant",
  "Property Manager",
  "Property Administrator",
  "Board Member",
];

type PermissionDefaultsModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function PermissionDefaultsModal({ open, onClose, onSaved }: PermissionDefaultsModalProps) {
  const [role, setRole] = useState<CompanyRole>("Company Administrator");
  const [permissions, setPermissions] = useState<PermissionModuleRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) companyRepository.getRolePermissions(role).then(setPermissions);
  }, [open, role]);

  const toggleAll = (value: boolean) => {
    setPermissions(
      permissions.map((p) => ({
        ...p,
        create: value,
        view: value,
        edit: value,
        delete: value,
        archive: value,
      }))
    );
  };

  const toggle = (idx: number, field: keyof Pick<PermissionModuleRow, "create" | "view" | "edit" | "delete" | "archive">) => {
    const next = [...permissions];
    next[idx] = { ...next[idx], [field]: !next[idx][field] };
    setPermissions(next);
  };

  const handleSave = async () => {
    setSaving(true);
    await companyRepository.saveRolePermissions(role, permissions);
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Permission Defaults"
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white"
          >
            Save
          </button>
        </div>
      }
    >
      <label className="mb-4 block text-sm">
        <span className="font-medium text-slate-700">Select Role: *</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as CompanyRole)}
          className="mt-1 block w-full max-w-md rounded border border-slate-300 px-2 py-1.5"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <div className="mb-2 flex gap-4 text-sm">
        <button type="button" onClick={() => toggleAll(true)} className="text-[#3476ef] hover:underline">
          Select All
        </button>
        <button type="button" onClick={() => toggleAll(false)} className="text-[#3476ef] hover:underline">
          Select None
        </button>
      </div>
      <div className="max-h-[50vh] overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-2 py-2 text-left">Module</th>
              {(["create", "view", "edit", "delete", "archive"] as const).map((a) => (
                <th key={a} className="px-2 py-2 capitalize">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((p, i) => (
              <tr key={p.moduleKey} className="border-b border-slate-100">
                <td className="px-2 py-1.5 text-slate-700">{p.label}</td>
                {(["create", "view", "edit", "delete", "archive"] as const).map((field) => (
                  <td key={field} className="px-2 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={p[field]}
                      onChange={() => toggle(i, field)}
                      className="h-4 w-4"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
