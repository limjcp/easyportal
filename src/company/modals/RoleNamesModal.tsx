import { useEffect, useState } from "react";
import { Modal } from "../../shared/Modal";
import { companyRepository } from "../data/companyRepository";
import type { RoleNameOverride } from "../../resident/data/types";

type RoleNamesModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function RoleNamesModal({ open, onClose, onSaved }: RoleNamesModalProps) {
  const [rows, setRows] = useState<RoleNameOverride[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) companyRepository.getRoleNameOverrides().then(setRows);
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    await companyRepository.saveRoleNameOverrides(rows);
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Custom Type/Role Names"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white hover:bg-[#2d68cf]"
          >
            Save
          </button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        You can set custom names for user types below. If nothing is entered for a particular role, the
        default name will be used. This will apply to users at all properties.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-600">
            <th className="py-2 pr-4">Default Name</th>
            <th className="py-2">Custom Name</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.defaultRole} className="border-b border-slate-100">
              <td className="py-2 pr-4 text-slate-700">{row.defaultRole}</td>
              <td className="py-2">
                <input
                  type="text"
                  value={row.customName}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, customName: e.target.value };
                    setRows(next);
                  }}
                  className="w-full rounded border border-slate-300 px-2 py-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
