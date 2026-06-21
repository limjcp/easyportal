import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { portalModulesSnapshot } from "../../shared/formDirty";
import { adminRepository } from "../data/adminRepository";
import type { UnitsUsersResidentType } from "../../resident/data/types";
import type { ResidentPortalModulePermission } from "../../data/supabase/portalModulePermissions";

const RESIDENT_TYPES: UnitsUsersResidentType[] = [
  "Owner",
  "Tenant",
  "Absentee Owner",
  "Occupant",
  "Unit Manager",
];

type ResidentTypePortalModulesModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function ResidentTypePortalModulesModal({
  open,
  onClose,
  onSaved,
}: ResidentTypePortalModulesModalProps) {
  const [residentType, setResidentType] = useState<UnitsUsersResidentType>("Owner");
  const [modules, setModules] = useState<ResidentPortalModulePermission[]>([]);
  const [baselineSnapshot, setBaselineSnapshot] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const { run: handleSave, loading: saving, error: saveError } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.saveResidentTypePortalModules(residentType, modules);
      setBaselineSnapshot(portalModulesSnapshot(modules));
      onSaved?.();
      onClose();
    }, [residentType, modules, onSaved, onClose]),
    { successMessage: "Resident type module defaults saved." }
  );

  const isDirty = useMemo(
    () => portalModulesSnapshot(modules) !== baselineSnapshot,
    [modules, baselineSnapshot]
  );

  useEffect(() => {
    if (!open) return;
    setResidentType("Owner");
    setModules([]);
    setBaselineSnapshot("");
    setLoadError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoadError(null);
    adminRepository
      .getResidentTypePortalModules(residentType)
      .then((loaded) => {
        setModules(loaded);
        setBaselineSnapshot(portalModulesSnapshot(loaded));
      })
      .catch((err) => {
        setModules([]);
        setBaselineSnapshot("");
        setLoadError(err instanceof Error ? err.message : "Failed to load portal module defaults.");
      });
  }, [open, residentType]);

  const toggleAll = (value: boolean) => {
    setModules((prev) =>
      prev.map((module) => ({
        ...module,
        enabled: module.buildingEnabled === false ? false : value,
      }))
    );
  };

  const toggleModule = (moduleId: string) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.moduleId !== moduleId) return module;
        if (module.buildingEnabled === false) return module;
        return { ...module, enabled: !module.enabled };
      })
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Resident Type Module Defaults"
      icon={<FaEdit className="text-[#7D5DA7]" />}
      size="lg"
      footer={
        <div className="flex w-full justify-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
          <ActionButton
            label="Save"
            loadingLabel="Saving…"
            loading={saving}
            disabled={!isDirty || modules.length === 0}
            onClick={() => void handleSave()}
          />
        </div>
      }
    >
      <label className="mb-4 block text-sm">
        <span className="font-medium text-slate-700">
          Select Resident Type: <span className="text-red-600">*</span>
        </span>
        <select
          value={residentType}
          onChange={(e) => setResidentType(e.target.value as UnitsUsersResidentType)}
          className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          {RESIDENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <p className="mb-3 text-xs text-slate-600">
        Choose which resident portal modules are visible by default for each resident type. Individual users can be
        overridden on the Permissions tab.
      </p>

      {saveError ? <FormAlert message={saveError} className="mb-3" /> : null}

      {loadError ? (
        <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {loadError.includes("schema cache") || loadError.includes("Could not find the table")
            ? "Permissions tables are not migrated yet. Run `bun run db:push` and reload the page."
            : loadError}
        </div>
      ) : null}

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
              <th className="px-3 py-2 text-left">Module</th>
              <th className="px-3 py-2 text-center">Visible in Portal</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module.moduleId} className="border-b border-slate-100 odd:bg-slate-50/50">
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-700">{module.name}</div>
                  <div className="text-slate-500">{module.tileLabel}</div>
                  {module.buildingEnabled === false ? (
                    <div className="mt-1 text-[11px] text-slate-400">
                      Disabled for this building in Portal Settings
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={module.enabled}
                    disabled={module.buildingEnabled === false}
                    onChange={() => toggleModule(module.moduleId)}
                    className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </td>
              </tr>
            ))}
            {modules.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-slate-500">
                  No portal modules configured for this building.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
