import { useEffect, useState } from "react";
import { FaPalette, FaHome, FaParagraph, FaDesktop, FaTwitter } from "react-icons/fa";
import { AdminFormPanel } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import { PORTAL_THEME_COLORS } from "../../data/mock/publicPortalSettings";
import type { PublicPortalSettings } from "../../../resident/data/types";
import { FileUploadZone } from "../../../shared/FileUploadZone";
import { PortalSettingsAlert } from "./PortalSettingsAlert";
import { SaveBar } from "./SaveBar";

export function PublicSettingsTab() {
  const [form, setForm] = useState<PublicPortalSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminRepository.getPublicPortalSettings().then(setForm);
  }, []);

  if (!form) return <div className="py-8 text-center text-slate-500">Loading...</div>;

  const update = <K extends keyof PublicPortalSettings>(key: K, value: PublicPortalSettings[K]) => {
    setForm({ ...form, [key]: value });
    setSaved(false);
  };

  const handleLogoFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("buildingLogoUrl", reader.result as string);
    reader.readAsDataURL(file);
  };

  const copyLobbyUrl = () => {
    void navigator.clipboard.writeText(form.lobbyDisplayUrl);
    alert(`Copied ${form.lobbyDisplayUrl} to your clipboard`);
  };

  const handleSave = async () => {
    setSaving(true);
    await adminRepository.updatePublicPortalSettings(form);
    setSaving(false);
    setSaved(true);
  };

  const subdomainOk = form.subdomain.length >= 2;

  return (
    <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
      <div className="space-y-4 p-4">
        <PortalSettingsAlert title="Public Portal Settings" icon={<span className="text-lg">⚙</span>}>
          <p>
            The information entered here will configure/display on your public portal website.
            <br />
            <br />
            Some settings, such as the subdomain, logo, social media links, and theme color will also apply to the
            Resident Portal.
          </p>
        </PortalSettingsAlert>

        <div className="grid gap-4 lg:grid-cols-2">
          <AdminFormPanel title="Portal Theme Color" icon={<FaPalette className="text-slate-500" />} headerColor="primary">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-12 shrink-0 rounded border border-slate-300"
                style={{ backgroundColor: form.portalThemeColor }}
              />
              <select
                value={form.portalThemeColor}
                onChange={(e) => update("portalThemeColor", e.target.value)}
                className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
              >
                {PORTAL_THEME_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </AdminFormPanel>

          <AdminFormPanel title="Sub-domain" icon={<FaHome className="text-slate-500" />} headerColor="primary">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-teal-700">https://</span>
              <input
                type="text"
                value={form.subdomain}
                onChange={(e) => update("subdomain", e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                className="w-40 rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="Sub-Domain"
                required
              />
              <span className="text-sm font-semibold text-teal-700">.mvpcondos.com</span>
              {subdomainOk && (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Available</span>
              )}
            </div>
          </AdminFormPanel>
        </div>

        <AdminFormPanel title="About this property" icon={<FaParagraph className="text-slate-500" />} headerColor="primary">
          <textarea
            rows={6}
            value={form.aboutBuilding}
            onChange={(e) => update("aboutBuilding", e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Add a description of your building and grounds"
          />
        </AdminFormPanel>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <AdminFormPanel title="Property Logo" icon={<FaParagraph className="text-slate-500" />} headerColor="primary">
              {form.buildingLogoUrl && (
                <div className="mb-3 flex items-start gap-3">
                  <img src={form.buildingLogoUrl} alt="Logo" className="h-24 rounded border object-contain" />
                  <button
                    type="button"
                    onClick={() => update("buildingLogoUrl", undefined)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
              <FileUploadZone onFileSelect={handleLogoFile} />
              <p className="mt-2 text-xs text-slate-500">* Note: building images may remain in the server cache for several minutes</p>
            </AdminFormPanel>

            <AdminFormPanel title="Lobby Display" icon={<FaDesktop className="text-slate-500" />} headerColor="primary">
              <label className="mb-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.enableLobbyDisplay}
                  onChange={(e) => update("enableLobbyDisplay", e.target.checked)}
                />
                Enable Lobby Display
              </label>
              {form.enableLobbyDisplay && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={form.lobbyDisplayUrl}
                    className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={copyLobbyUrl} className="rounded border border-slate-300 px-3 py-2 text-sm">
                    Copy
                  </button>
                </div>
              )}
            </AdminFormPanel>
          </div>

          <AdminFormPanel
            title="Social Media Links"
            icon={<FaTwitter className="text-slate-500" />}
            headerColor="primary"
          >
            <p className="mb-4 text-center text-xs text-slate-500">
              Enter the addresses (URL) for your social media. If entered, links will be displayed on both the public
              website and the resident portal.
            </p>
            <div className="space-y-3">
              {(
                [
                  ["twitterUrl", "Twitter", "https://twitter.com/user"],
                  ["facebookUrl", "Facebook", "https://facebook.com/user"],
                  ["instaUrl", "Instagram", "https://instagram.com/user"],
                  ["youTubeUrl", "YouTube", "https://www.youtube.com/channel/ID"],
                ] as const
              ).map(([key, label, placeholder]) => (
                <label key={key} className="block text-sm">
                  <span className="font-medium text-slate-600">{label}</span>
                  <input
                    type="url"
                    value={form[key]}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={placeholder}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  />
                </label>
              ))}
            </div>
          </AdminFormPanel>
        </div>
      </div>
      <SaveBar onSave={handleSave} saved={saved} saving={saving} />
    </div>
  );
}
