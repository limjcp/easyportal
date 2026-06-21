import { useCallback, useEffect, useState } from "react";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { Modal } from "../../shared/Modal";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { DEFAULT_ROLE_NAMES } from "../data/mock/permissions";
import { companyRepository } from "../data/companyRepository";
import type { RoleNameOverride } from "../../resident/data/types";

type RoleNamesModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function RoleNamesModal({ open, onClose, onSaved }: RoleNamesModalProps) {
  const [rows, setRows] = useState<RoleNameOverride[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { run, loading, error, clearError } = useAsyncAction(
    useCallback(async () => {
      await companyRepository.saveRoleNameOverrides(rows);
    }, [rows]),
    {
      successMessage: "Role names saved.",
      onSuccess: () => {
        onSaved();
        onClose();
      },
    }
  );

  useEffect(() => {
    if (!open) return;
    clearError();
    setLoadError(null);
    companyRepository
      .getRoleNameOverrides()
      .then(setRows)
      .catch((err) => {
        setRows(DEFAULT_ROLE_NAMES.map((row) => ({ ...row })));
        setLoadError(err instanceof Error ? err.message : "Failed to load role names.");
      });
  }, [open, clearError]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Custom Type/Role Names"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <ActionButton label="Close" variant="secondary" onClick={onClose} disabled={loading} />
          <ActionButton label="Save" loading={loading} onClick={() => void run()} />
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        You can set custom names for user types below. If nothing is entered for a particular role, the
        default name will be used. This will apply to users at all properties.
      </p>
      {loadError ? <FormAlert message={loadError} className="mb-3" /> : null}
      {error ? <FormAlert message={error} className="mb-3" /> : null}
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
