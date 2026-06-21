import { useCallback, useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { adminRepository } from "../data/adminRepository";
import { BUILDING_ADMIN_ROLES } from "../data/mock/buildingPermissions";
import type { PermissionModuleRow } from "../../resident/data/types";

type BuildingPermissionDefaultsModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function BuildingPermissionDefaultsModal({
  open,
  onClose,
  onSaved,
}: BuildingPermissionDefaultsModalProps) {
  const [role, setRole] = useState("");
  const [permissions, setPermissions] = useState<PermissionModuleRow[]>([]);

  const { run: handleSave, loading: saving, error } = useAsyncAction(
    useCallback(async () => {
      if (!role) return;
      await adminRepository.saveBuildingRolePermissions(role, permissions);
      onSaved?.();
      onClose();
    }, [role, permissions, onSaved, onClose]),
    { successMessage: "Permission defaults saved." }
  );

  useEffect(() => {
    if (!open) return;
    setRole("");
    setPermissions([]);
  }, [open]);

  useEffect(() => {
    if (!open || !role) return;
    adminRepository.getBuildingRolePermissions(role).then(setPermissions);
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

  const toggle = (
    idx: number,
    field: keyof Pick<PermissionModuleRow, "create" | "view" | "edit" | "delete" | "archive">
  ) => {
    const next = [...permissions];
    next[idx] = { ...next[idx], [field]: !next[idx][field] };
    setPermissions(next);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Permission Defaults"
      icon={<FaEdit className="text-[#7D5DA7]" />}
      size="xl"
      footer={
        <div className="flex w-full justify-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
          {role ? (
            <ActionButton label="Save" loadingLabel="Saving…" loading={saving} onClick={() => void handleSave()} />
          ) : null}
        </div>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
      <label className="mb-4 block text-sm">
        <span className="font-medium text-slate-700">
          Select Role: <span className="text-red-600">*</span>
        </span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Select Role</option>
          {BUILDING_ADMIN_ROLES.map((r) => (
            <option key={r.value} value={r.label}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      {role ? (
        <>
          <div className="mb-2 flex justify-center gap-4 text-sm">
            <button type="button" onClick={() => toggleAll(true)} className="text-[#3476ef] hover:underline">
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button type="button" onClick={() => toggleAll(false)} className="text-[#3476ef] hover:underline">
              Select None
            </button>
          </div>
          <div className="max-h-[50vh] overflow-auto rounded border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-600">
                  <th className="px-2 py-2 text-left" />
                  <th className="px-2 py-2 text-center">Create</th>
                  <th className="px-2 py-2 text-center">View</th>
                  <th className="px-2 py-2 text-center">Edit</th>
                  <th className="px-2 py-2 text-center">Delete</th>
                  <th className="px-2 py-2 text-center">Archive</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p, i) => (
                  <tr key={p.moduleKey} className="border-b border-slate-100 odd:bg-slate-50/50">
                    <td className="px-2 py-1.5 font-medium text-slate-700">{p.label}</td>
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
        </>
      ) : null}
    </Modal>
  );
}
