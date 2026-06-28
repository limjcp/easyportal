import { useCallback, useEffect, useState } from "react";
import { FaShieldAlt, FaUser } from "react-icons/fa";
import { AdminFormPanel } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import type { ProfileCompletionPolicy, ProfileFieldOption, UnitsUsersResidentType } from "../../../resident/data/types";
import { getFieldDef } from "../../../data/supabase/profileCompletionFields";
import { SaveBar } from "../../../shared/SaveBar";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import { changedProfileFieldOptions, profileCompletionPolicyDirty } from "../../../shared/formDirty";
import { PortalSettingsAlert } from "./PortalSettingsAlert";

const RESIDENT_TYPES: UnitsUsersResidentType[] = [
  "Owner",
  "Tenant",
  "Absentee Owner",
  "Occupant",
  "Unit Manager",
];

export function ProfileTab() {
  const [fields, setFields] = useState<ProfileFieldOption[]>([]);
  const [fieldsBaseline, setFieldsBaseline] = useState<ProfileFieldOption[]>([]);
  const [policy, setPolicy] = useState<ProfileCompletionPolicy | null>(null);
  const [policyBaseline, setPolicyBaseline] = useState<ProfileCompletionPolicy | null>(null);
  const [saved, setSaved] = useState(false);

  const { run: handleSave, loading: saving, error } = useAsyncAction(
    useCallback(async () => {
      if (!policy || !policyBaseline) return;
      if (policy.softLoginCount >= policy.blockLoginCount) {
        throw new Error("Soft reminder login count must be less than hard block login count.");
      }

      const policyChanged = profileCompletionPolicyDirty(policyBaseline, policy);
      const changedFields = changedProfileFieldOptions(fieldsBaseline, fields);

      if (!policyChanged && changedFields.length === 0) {
        setSaved(true);
        return;
      }

      if (policyChanged) {
        await adminRepository.updateProfileCompletionPolicy(policy);
        setPolicyBaseline({ ...policy });
      }
      if (changedFields.length > 0) {
        await adminRepository.updateProfileFieldOptions(fields, changedFields);
        setFieldsBaseline(structuredClone(fields));
      }
      setSaved(true);
    }, [fields, fieldsBaseline, policy, policyBaseline]),
    { successMessage: "Profile settings saved." }
  );

  useEffect(() => {
    adminRepository.getProfileFieldOptions().then((loaded) => {
      setFields(loaded);
      setFieldsBaseline(structuredClone(loaded));
    });
    adminRepository.getProfileCompletionPolicy().then((loaded) => {
      setPolicy(loaded);
      setPolicyBaseline({ ...loaded });
    });
  }, []);

  const updatePolicy = (patch: Partial<ProfileCompletionPolicy>) => {
    setPolicy((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
  };

  const toggleResidentType = (type: UnitsUsersResidentType) => {
    setPolicy((prev) => {
      if (!prev) return prev;
      const selected = prev.residentTypes.includes(type);
      return {
        ...prev,
        residentTypes: selected
          ? prev.residentTypes.filter((t) => t !== type)
          : [...prev.residentTypes, type],
      };
    });
    setSaved(false);
  };

  const update = (fieldKey: string, patch: Partial<ProfileFieldOption>) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.fieldKey !== fieldKey) return f;
        const next = { ...f, ...patch };
        if (patch.requiredForCompletion && !next.show) next.show = true;
        if (patch.requiredForCompletion && !next.editable) next.editable = true;
        if (patch.editable && !next.show) next.show = true;
        if (!next.show) next.editable = false;
        if (!next.show || !next.editable) next.requiredForCompletion = false;
        return next;
      })
    );
    setSaved(false);
  };

  if (!policy) return <div className="py-8 text-center text-slate-500">Loading...</div>;

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

        <AdminFormPanel
          title="Profile Completion Policy"
          icon={<FaShieldAlt className="text-slate-500" />}
          headerColor="primary"
        >
          <p className="mb-4 text-sm text-slate-600">
            Require selected resident types to complete profile fields before full portal access. Residents see
            reminders on early logins and are blocked from the portal once they reach the hard block login count.
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={policy.enabled}
              onChange={(e) => updatePolicy({ enabled: e.target.checked })}
            />
            <span className="font-medium text-slate-700">Enable profile completion gate</span>
          </label>

          <fieldset className="mt-4" disabled={!policy.enabled}>
            <legend className="mb-2 text-sm font-medium text-slate-700">Applicable resident types</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {RESIDENT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={policy.residentTypes.includes(type)}
                    onChange={() => toggleResidentType(type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Soft reminder until login #</span>
              <input
                type="number"
                min={1}
                value={policy.softLoginCount}
                disabled={!policy.enabled}
                onChange={(e) =>
                  updatePolicy({ softLoginCount: Math.max(1, Number(e.target.value) || 1) })
                }
                className="mt-1 block w-full max-w-xs rounded border border-slate-300 px-3 py-1.5"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Hard block from login #</span>
              <input
                type="number"
                min={1}
                value={policy.blockLoginCount}
                disabled={!policy.enabled}
                onChange={(e) =>
                  updatePolicy({ blockLoginCount: Math.max(1, Number(e.target.value) || 1) })
                }
                className="mt-1 block w-full max-w-xs rounded border border-slate-300 px-3 py-1.5"
              />
            </label>
          </div>
        </AdminFormPanel>

        <AdminFormPanel title="Profile Fields" icon={<FaUser className="text-slate-500" />} headerColor="primary">
          <p className="mb-4 text-sm text-slate-600">
            Required fields block portal access after the configured login count.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-24 px-3 py-2 text-center">Show</th>
                  <th className="w-24 px-3 py-2 text-center">Editable</th>
                  <th className="w-24 px-3 py-2 text-center">Required</th>
                  <th className="px-3 py-2 text-left">Field</th>
                  <th className="hidden px-3 py-2 text-left md:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f) => {
                  const completable = getFieldDef(f.fieldKey)?.completable ?? false;
                  return (
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
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={f.requiredForCompletion ?? false}
                          disabled={!completable || (!f.show && !(f.requiredForCompletion ?? false))}
                          onChange={(e) =>
                            update(f.fieldKey, { requiredForCompletion: e.target.checked })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">{f.label}</td>
                      <td className="hidden px-3 py-2 text-xs text-slate-500 md:table-cell">{f.note ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminFormPanel>
      </div>
      <SaveBar onSave={() => void handleSave()} saved={saved} saving={saving} error={error} />
    </div>
  );
}
