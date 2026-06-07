import { useEffect, useState } from "react";
import { FaBuilding, FaImage, FaAddressBook } from "react-icons/fa";
import { AdminFormPanel } from "../../components/AdminFormPanel";
import { adminRepository } from "../../data/adminRepository";
import { companyRepository } from "../../../company/data/companyRepository";
import { getActiveBuildingId } from "../../../data/supabase/buildingContext";
import { formatBuildingOptionLabel } from "../../navigation";
import {
  AMENITIES,
  BUILDING_FEATURES,
  BUILDING_TYPES,
  CANADIAN_PROVINCES,
  COMMON_AREAS,
  CORPORATIONS,
} from "../../data/mock/buildingDefinitionConstants";
import type { BuildingDefinition, CompanyBuilding } from "../../../resident/data/types";
import { FileUploadZone } from "../../../shared/FileUploadZone";
import { toDataUrl, validateBuildingImageFile } from "../../../shared/attachmentUtils";

type BuildingTabProps = {
  onRefresh: () => void;
};

export function BuildingTab({ onRefresh }: BuildingTabProps) {
  const [form, setForm] = useState<BuildingDefinition | null>(null);
  const [linkableBuildings, setLinkableBuildings] = useState<CompanyBuilding[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminRepository.getBuildingDefinition().then(setForm);
    const activeId = getActiveBuildingId();
    companyRepository
      .getBuildings()
      .then((buildings) => setLinkableBuildings(buildings.filter((b) => b.id !== activeId)))
      .catch(() => setLinkableBuildings([]));
  }, [onRefresh]);

  if (!form) return <div className="py-8 text-center text-slate-500">Loading...</div>;

  const update = <K extends keyof BuildingDefinition>(field: K, value: BuildingDefinition[K]) => {
    setForm({ ...form, [field]: value });
    setSaved(false);
  };

  const toggleList = (field: "buildingTypes" | "buildingFeatures" | "amenities" | "commonAreas", item: string) => {
    const list = form[field];
    update(field, list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const handleLinkedChange = (id: string, checked: boolean) => {
    let ids = [...form.linkedBuildingIds];
    if (checked) {
      if (ids.length >= 4) {
        alert("You can only link up to 4 buildings");
        return;
      }
      ids.push(id);
    } else {
      ids = ids.filter((x) => x !== id);
    }
    update("linkedBuildingIds", ids);
  };

  const handleSave = async () => {
    await adminRepository.updateBuildingDefinition(form);
    setSaved(true);
    onRefresh();
  };

  const handleImageSelect = async (file: File | null) => {
    if (!file) return;
    const error = validateBuildingImageFile(file);
    if (error) {
      alert(error);
      return;
    }
    try {
      const dataUrl = await toDataUrl(file);
      update("imageUrl", dataUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to read image.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <AdminFormPanel title="Building Details" icon={<FaBuilding className="text-slate-500" />}>
            <div className="space-y-3">
              <Field label="Condo Name" value={form.condoName} onChange={(v) => update("condoName", v)} />
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium text-slate-700">Corporation</span>
                  <select
                    value={form.corporation}
                    onChange={(e) => update("corporation", e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
                  >
                    {CORPORATIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
                <Field label="Corp Number" value={form.corpNumber} onChange={(v) => update("corpNumber", v)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Address *</span>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.multiAddressProperty}
                    onChange={(e) => update("multiAddressProperty", e.target.checked)}
                  />
                  This is a multiple address property
                </label>
              </div>
              <textarea
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                rows={2}
                className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="City *" value={form.city} onChange={(v) => update("city", v)} />
                <Field label="Postal / Zip *" value={form.postalZip} onChange={(v) => update("postalZip", v)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Country *</span>
                  <select
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
                  >
                    <option value="Canada">Canada</option>
                    <option value="United States">United States</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Province *</span>
                  <select
                    value={form.province}
                    onChange={(e) => update("province", e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
                  >
                    {CANADIAN_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </AdminFormPanel>

          <AdminFormPanel title="Contact Info" icon={<FaAddressBook className="text-slate-500" />}>
            <div className="space-y-3">
              <Field label="Property Phone" value={form.propertyPhone} onChange={(v) => update("propertyPhone", v)} />
              <Field label="Property Email" value={form.propertyEmail} onChange={(v) => update("propertyEmail", v)} type="email" />
              <Field label="Accounting Email (PO's will be CC'ed to this address)" value={form.accountingEmail} onChange={(v) => update("accountingEmail", v)} type="email" />
              <Field label="Billing Email (Subscription Issues will be sent to this address)" value={form.billingEmail} onChange={(v) => update("billingEmail", v)} type="email" />
            </div>
          </AdminFormPanel>

          <AdminFormPanel title="Image (jpg, png, gif)" icon={<FaImage className="text-slate-500" />}>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Building" className="mb-3 h-24 rounded border object-cover" />
            )}
            <FileUploadZone
              onFileSelect={(file) => void handleImageSelect(file)}
              onRemove={() => update("imageUrl", undefined)}
            />
          </AdminFormPanel>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <CheckboxPanel title="Building Type" items={BUILDING_TYPES} selected={form.buildingTypes} onToggle={(i) => toggleList("buildingTypes", i)} />
          <CheckboxPanel title="Building Features" items={BUILDING_FEATURES} selected={form.buildingFeatures} onToggle={(i) => toggleList("buildingFeatures", i)} small />
          <CheckboxPanel title="Amenities" items={AMENITIES} selected={form.amenities} onToggle={(i) => toggleList("amenities", i)} small />
          <CheckboxPanel title="Common Areas" items={COMMON_AREAS} selected={form.commonAreas} onToggle={(i) => toggleList("commonAreas", i)} small />
        </div>
      </div>

      <AdminFormPanel title="Linked Buildings">
        <p className="mb-3 text-xs text-slate-500">Linking buildings allows residents to cross post items on resident portal(s).</p>
        {linkableBuildings.length === 0 ? (
          <p className="text-sm text-slate-500">No other company buildings available to link.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {linkableBuildings.map((b) => (
              <label key={b.id} className="flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.linkedBuildingIds.includes(b.id)}
                  onChange={(e) => handleLinkedChange(b.id, e.target.checked)}
                />
                {formatBuildingOptionLabel(b)}
              </label>
            ))}
          </div>
        )}
      </AdminFormPanel>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
        <button type="button" onClick={handleSave} className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white">
          Save Changes
        </button>
        {saved && <span className="text-sm text-green-600">Saved successfully.</span>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5" />
    </label>
  );
}

function CheckboxPanel({
  title,
  items,
  selected,
  onToggle,
  small,
}: {
  title: string;
  items: readonly string[];
  selected: string[];
  onToggle: (item: string) => void;
  small?: boolean;
}) {
  return (
    <AdminFormPanel title={title} icon={<FaBuilding className="text-slate-500" />}>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <label key={item} className={`flex items-center gap-2 ${small ? "text-xs" : "text-sm"}`}>
            <input type="checkbox" checked={selected.includes(item)} onChange={() => onToggle(item)} />
            {item}
          </label>
        ))}
      </div>
    </AdminFormPanel>
  );
}
