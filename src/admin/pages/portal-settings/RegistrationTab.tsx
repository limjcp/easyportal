import { useCallback, useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { AdminFormPanel } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import type { RegistrationFieldOption } from "../../../resident/data/types";
import { SaveBar } from "../../../shared/SaveBar";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import { PortalSettingsAlert } from "./PortalSettingsAlert";

export function RegistrationTab() {
  const [fields, setFields] = useState<RegistrationFieldOption[]>([]);
  const [saved, setSaved] = useState(false);

  const { run: handleSave, loading: saving, error } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.updateRegistrationFieldOptions(fields);
      setSaved(true);
    }, [fields]),
    { successMessage: "Registration settings saved." }
  );

  useEffect(() => {
    adminRepository.getRegistrationFieldOptions().then(setFields);
  }, []);

  const update = (fieldKey: string, patch: Partial<RegistrationFieldOption>) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.fieldKey !== fieldKey) return f;
        const next = { ...f, ...patch };
        if (patch.required && !next.include) next.include = true;
        if (!next.include) next.required = false;
        return next;
      })
    );
    setSaved(false);
  };

  return (
    <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
      <div className="space-y-4 p-4">
        <PortalSettingsAlert title="Resident Portal Registration" icon={<FaCheck />}>
          <p>
            Select which fields you would like displayed on the Resident Registration form.
            <br />
            <br />
            Note: Residents are less likely to complete their registration when numerous fields are presented.
          </p>
        </PortalSettingsAlert>

        <AdminFormPanel title="Registration Fields" icon={<FaCheck className="text-slate-500" />} headerColor="primary">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-24 px-3 py-2 text-center">Include</th>
                  <th className="w-24 px-3 py-2 text-center">Required</th>
                  <th className="px-3 py-2 text-left">Field</th>
                  <th className="hidden px-3 py-2 text-left md:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f) => (
                  <tr key={f.fieldKey} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={f.include}
                        disabled={f.locked}
                        onChange={(e) => update(f.fieldKey, { include: e.target.checked })}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={f.required}
                        disabled={f.locked || !f.include}
                        onChange={(e) => update(f.fieldKey, { required: e.target.checked })}
                      />
                    </td>
                    <td className="px-3 py-2">{f.label}</td>
                    <td className="hidden px-3 py-2 text-xs text-slate-500 md:table-cell">{f.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminFormPanel>
      </div>
      <SaveBar onSave={() => void handleSave()} saved={saved} saving={saving} error={error} />
    </div>
  );
}
