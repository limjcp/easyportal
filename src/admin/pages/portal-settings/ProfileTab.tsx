import { useCallback, useEffect, useState } from "react";
import { FaUser } from "react-icons/fa";
import { AdminFormPanel } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import type { ProfileFieldOption } from "../../../resident/data/types";
import { SaveBar } from "../../../shared/SaveBar";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import { PortalSettingsAlert } from "./PortalSettingsAlert";

export function ProfileTab() {
  const [fields, setFields] = useState<ProfileFieldOption[]>([]);
  const [saved, setSaved] = useState(false);

  const { run: handleSave, loading: saving, error } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.updateProfileFieldOptions(fields);
      setSaved(true);
    }, [fields]),
    { successMessage: "Profile settings saved." }
  );

  useEffect(() => {
    adminRepository.getProfileFieldOptions().then(setFields);
  }, []);

  const update = (fieldKey: string, patch: Partial<ProfileFieldOption>) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.fieldKey !== fieldKey) return f;
        const next = { ...f, ...patch };
        if (patch.editable && !next.show) next.show = true;
        if (!next.show) next.editable = false;
        return next;
      })
    );
    setSaved(false);
  };

  return (
    <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
      <div className="space-y-4 p-4">
        <PortalSettingsAlert title="Resident Portal Profile" icon={<FaUser />}>
          <p>
            Select which fields you would like displayed to Residents on their Profile page.
            For unit detail categories (parking, vehicles, pets, etc.), Show also controls whether the
            matching home-page tile appears when that portal module is enabled in Portal Settings.
            <br />
            <br />
            You can also set which fields Residents are allowed to edit.
          </p>
        </PortalSettingsAlert>

        <AdminFormPanel title="Profile Fields" icon={<FaUser className="text-slate-500" />} headerColor="primary">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-24 px-3 py-2 text-center">Show</th>
                  <th className="w-24 px-3 py-2 text-center">Editable</th>
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
                        checked={f.show}
                        disabled={f.locked}
                        onChange={(e) => update(f.fieldKey, { show: e.target.checked })}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={f.editable}
                        disabled={f.locked || !f.show}
                        onChange={(e) => update(f.fieldKey, { editable: e.target.checked })}
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
