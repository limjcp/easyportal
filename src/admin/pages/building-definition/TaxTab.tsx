import { useEffect, useState } from "react";
import { FaCoins } from "react-icons/fa";
import { AdminFormPanel } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import type { BuildingTaxSettings } from "../../../resident/data/types";

export function TaxTab() {
  const [settings, setSettings] = useState<BuildingTaxSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminRepository.getBuildingTaxSettings().then(setSettings);
  }, []);

  if (!settings) return <div className="py-8 text-center text-slate-500">Loading...</div>;

  const setMasterRate = (value: number | null) => {
    const next = { ...settings, masterTaxRate: value };
    if (next.serviceRequestsTaxable && value !== null) {
      next.serviceRequestsTaxRate = value;
    }
    setSettings(next);
    setSaved(false);
  };

  const toggleServiceTaxable = (checked: boolean) => {
    setSettings({
      ...settings,
      serviceRequestsTaxable: checked,
      serviceRequestsTaxRate: checked ? settings.masterTaxRate : null,
    });
    setSaved(false);
  };

  const handleSave = async () => {
    await adminRepository.updateBuildingTaxSettings(settings);
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      <AdminFormPanel title="Master Tax Rate" icon={<FaCoins className="text-slate-500" />}>
        <div className="flex flex-wrap items-center justify-center gap-6 py-4">
          <p className="max-w-lg text-center text-sm text-slate-600">
            Please set the master sales tax rate. This rate will apply to any transactions which are set as taxable.
            You can optionally override individual tax rates below.
          </p>
          <label className="text-sm">
            <span className="font-medium text-slate-700">Master Tax Rate *</span>
            <div className="mt-1 flex items-center gap-1">
              <input
                type="number"
                step="0.001"
                value={settings.masterTaxRate ?? ""}
                onChange={(e) => setMasterRate(e.target.value === "" ? null : Number(e.target.value))}
                className="w-24 rounded border border-slate-300 px-3 py-1.5"
              />
              <span className="text-slate-500">%</span>
            </div>
          </label>
        </div>
      </AdminFormPanel>

      <AdminFormPanel title="Individual Tax Settings" icon={<FaCoins className="text-slate-500" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 font-medium">Module</th>
                <th className="px-4 py-2 text-center font-medium">Taxable</th>
                <th className="px-4 py-2 font-medium">Tax Rate</th>
              </tr>
            </thead>
            <tbody>
              <DisabledRow label="Amenity Reservations" hint="Upgrade your subscription package to enable Amenities" />
              <DisabledRow label="Building Store Purchases" hint="Upgrade your subscription package to enable Building Store Purchases" />
              <tr className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">Billable Service Requests</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={settings.serviceRequestsTaxable}
                    onChange={(e) => toggleServiceTaxable(e.target.checked)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.001"
                      value={settings.serviceRequestsTaxRate ?? ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          serviceRequestsTaxRate: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      disabled={!settings.serviceRequestsTaxable}
                      className="w-24 rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"
                    />
                    <span className="text-slate-500">%</span>
                  </div>
                </td>
              </tr>
              <DisabledRow label="Visitor Parking" hint="Upgrade your subscription package to enable Visitor Parking" />
            </tbody>
          </table>
        </div>
      </AdminFormPanel>

      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white">
          Save Settings
        </button>
        {saved && <span className="text-sm text-green-600">Saved successfully.</span>}
      </div>
    </div>
  );
}

function DisabledRow({ label, hint }: { label: string; hint: string }) {
  return (
    <tr className="border-b border-slate-100 text-slate-400">
      <td className="px-4 py-3">
        {label}
        <span className="ml-2 text-xs" title={hint}>ⓘ</span>
      </td>
      <td className="px-4 py-3 text-center">—</td>
      <td className="px-4 py-3">—</td>
    </tr>
  );
}
