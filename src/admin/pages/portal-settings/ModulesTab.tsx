import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBuilding, FaTh } from "react-icons/fa";
import { AdminFormPanel } from "../../components/AdminFormPanel";
import { PortalTileArrangeEditor } from "../../components/PortalTileArrangeEditor";
import { adminRepository } from "../../data/adminRepository";
import type { CustomPortalTile, PortalModuleConfig, PortalTileSettings } from "../../../resident/data/types";
import { getResidentBackgroundImage } from "../../../resident/data/portalConfig";
import { applyArrangeTiles, toArrangeTiles } from "../../../resident/data/portalTileLayout";
import { SaveBar } from "../../../shared/SaveBar";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import { PortalSettingsAlert } from "./PortalSettingsAlert";

export function ModulesTab() {
  const [modules, setModules] = useState<PortalModuleConfig[]>([]);
  const [tileSettings, setTileSettings] = useState<PortalTileSettings | null>(null);
  const [customTiles, setCustomTiles] = useState<CustomPortalTile[]>([]);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [bgUrl, setBgUrl] = useState<string | undefined>();

  const { run: handleSave, loading: saving, error } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.updatePortalModules(modules);
      await adminRepository.updatePortalTileSettings(tileSettings!);
      await adminRepository.updateCustomPortalTiles(customTiles);
      setSaved(true);
    }, [modules, tileSettings, customTiles]),
    { successMessage: "Portal modules saved." }
  );

  useEffect(() => {
    adminRepository.getPortalModules({ ensureDefaults: true }).then(setModules);
    adminRepository.getPortalTileSettings().then(setTileSettings);
    adminRepository.getCustomPortalTiles().then(setCustomTiles);
    setBgUrl(getResidentBackgroundImage()?.url);
  }, []);

  const arrangeTiles = useMemo(
    () => toArrangeTiles(modules, customTiles, tileSettings?.primaryTileLimit ?? 8),
    [modules, customTiles, tileSettings?.primaryTileLimit]
  );

  if (!tileSettings) return <div className="py-8 text-center text-slate-500">Loading...</div>;

  const opacity = tileSettings.portalTileOpacity;

  const updateModule = (moduleId: string, patch: Partial<PortalModuleConfig>) => {
    setModules((prev) => prev.map((m) => (m.moduleId === moduleId ? { ...m, ...patch } : m)));
    setSaved(false);
  };

  const updateArrangement = (nextTiles: ReturnType<typeof toArrangeTiles>) => {
    const nextLayout = applyArrangeTiles(nextTiles, modules, customTiles, tileSettings.primaryTileLimit);
    setModules(nextLayout.modules);
    setCustomTiles(nextLayout.customTiles);
    setSaved(false);
  };

  const handleResetToMaster = async () => {
    setResetting(true);
    await adminRepository.resetBuildingPortalLayoutToMaster();
    const [nextModules, nextTileSettings, nextCustomTiles] = await Promise.all([
      adminRepository.getPortalModules({ ensureDefaults: true }),
      adminRepository.getPortalTileSettings(),
      adminRepository.getCustomPortalTiles(),
    ]);
    setModules(nextModules);
    setTileSettings(nextTileSettings);
    setCustomTiles(nextCustomTiles);
    setSaved(true);
    setResetting(false);
  };

  return (
    <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
      <div className="space-y-4 p-4">
        <PortalSettingsAlert title="Resident Portal Settings" icon={<span>⚙</span>}>
          <p>
            Select which features/modules will be displayed as tiles on the private resident portal home page. You can
            also optionally add custom tiles which can link to either a URL, or can trigger a file download.
          </p>
        </PortalSettingsAlert>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AdminFormPanel title="Portal Tile Opacity" icon={<FaTh className="text-slate-500" />} headerColor="primary">
              <p className="mb-4 text-sm text-slate-600">
                Adjust how transparent the tiles for the resident portal are. The recommended/default setting is 0.75.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => {
                    setTileSettings({ ...tileSettings, portalTileOpacity: parseFloat(e.target.value) });
                    setSaved(false);
                  }}
                  className="flex-1"
                />
                <span className="rounded bg-[#3476ef] px-2 py-1 text-xs text-white">{opacity.toFixed(2)}</span>
              </div>
              <label className="mt-4 block text-sm">
                <span className="font-medium text-slate-700">Default Language</span>
                <select
                  value={tileSettings.defaultLanguage}
                  onChange={(e) => {
                    setTileSettings({ ...tileSettings, defaultLanguage: e.target.value });
                    setSaved(false);
                  }}
                  className="mt-1 block w-full max-w-xs rounded border border-slate-300 px-3 py-1.5"
                >
                  <option>English</option>
                  <option>Français</option>
                </select>
              </label>
              <label className="mt-4 block text-sm">
                <span className="font-medium text-slate-700">Primary Tile Capacity (Top 2 Rows)</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={tileSettings.primaryTileLimit}
                  onChange={(e) => {
                    setTileSettings({
                      ...tileSettings,
                      primaryTileLimit: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                    });
                    setSaved(false);
                  }}
                  className="mt-1 block w-full max-w-xs rounded border border-slate-300 px-3 py-1.5"
                />
              </label>
              <label className="mt-4 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={tileSettings.useMasterLayout}
                  onChange={(e) => {
                    setTileSettings({ ...tileSettings, useMasterLayout: e.target.checked });
                    setSaved(false);
                  }}
                />
                <span className="font-medium text-slate-700">Use Company Owner master arrangement</span>
              </label>
              <button
                type="button"
                onClick={handleResetToMaster}
                disabled={resetting}
                className="mt-4 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {resetting ? "Applying master..." : "Reset / Apply Company Master Layout"}
              </button>
            </AdminFormPanel>
          </div>
          <AdminFormPanel title="Preview" icon={<span className="text-slate-500">👁</span>}>
            <div
              className="rounded border border-slate-200 p-2"
              style={{
                backgroundImage: bgUrl
                  ? `url(${bgUrl})`
                  : "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center top",
                minHeight: 160,
              }}
            >
              <div
                className="flex min-h-[140px] flex-col items-center justify-center rounded border border-white/10 text-center text-white"
                style={{ background: `rgba(0,0,0,${opacity})` }}
              >
                <FaBuilding className="text-3xl" />
                <h4 className="mt-2 text-sm font-medium">Module Name</h4>
              </div>
            </div>
          </AdminFormPanel>
        </div>

        <AdminFormPanel title="Master Arrange Tiles" icon={<FaTh className="text-slate-500" />} headerColor="primary">
          <p className="mb-3 text-sm text-slate-600">
            Click <strong>Edit Arrangement</strong> in the arranger below, then drag tiles by the handle. The first two
            rows stay full-size and overflow is pushed into compact small tiles.
          </p>
          <PortalTileArrangeEditor
            tiles={arrangeTiles}
            primaryTileLimit={tileSettings.primaryTileLimit}
            onChange={updateArrangement}
          />
        </AdminFormPanel>

        <AdminFormPanel title="Portal Modules & Messages" icon={<FaTh className="text-slate-500" />} headerColor="primary">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="w-24 px-3 py-2 text-center">Enabled</th>
                  <th className="px-3 py-2">Module</th>
                  <th className="px-3 py-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m.moduleId} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={m.enabled}
                        disabled={m.locked}
                        onChange={(e) => updateModule(m.moduleId, { enabled: e.target.checked })}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-700">{m.name}</td>
                    <td className="px-3 py-2">
                      {m.locked ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <textarea
                          rows={2}
                          maxLength={300}
                          value={m.message}
                          onChange={(e) => updateModule(m.moduleId, { message: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Displayed at the top of the corresponding page on the resident portal"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminFormPanel>

        <AdminFormPanel title="Custom Portal Tiles" icon={<FaTh className="text-slate-500" />} headerColor="primary">
          {customTiles.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No custom tiles configured.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {customTiles.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-3 py-2">{t.enabled ? "Active" : "Inactive"}</td>
                    <td className="px-3 py-2">{t.title}</td>
                    <td className="px-3 py-2">{t.actionType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminFormPanel>
      </div>
      <SaveBar onSave={() => void handleSave()} saved={saved} saving={saving} error={error} />
    </div>
  );
}
