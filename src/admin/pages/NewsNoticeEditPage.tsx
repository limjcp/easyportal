import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheckSquare,
  FaClock,
  FaCog,
  FaExchangeAlt,
  FaFile,
  FaImage,
  FaNewspaper,
  FaQuestionCircle,
} from "react-icons/fa";
import { StatusBadge } from "../components/AdminBadges";
import { AdminFormPanel } from "../components/AdminFormPanel";
import { ActionButton } from "../../shared/ActionButton";
import { ConfirmModal } from "../../shared/ConfirmModal";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { usePageContentBusy } from "../../shared/usePageContentBusy";
import { adminRepository } from "../data/adminRepository";
import { companyRepository } from "../../company/data/companyRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import { EmailNoticesReportModal } from "../modals/EmailNoticesReportModal";
import type { AdminRoute } from "../navigation";
import type { AdminNewsItem, BuildingUnitGroup, CompanyBuilding } from "../../resident/data/types";
import { FileUploadZone } from "../../shared/FileUploadZone";
import {
  sanitizeFileName,
  toDataUrl,
  validateAttachmentFile,
  validateBuildingImageFile,
} from "../../shared/attachmentUtils";
import { getActiveBuildingId } from "../../data/supabase/buildingContext";
import { cn } from "../../utils/cn";

const RESIDENT_TYPES = [
  "Absentee Owners",
  "Owners",
  "Tenants",
  "Occupants",
  "Unit Managers",
];

const ADMIN_CC_TYPES = [
  "Company Owner",
  "Company Administrator",
  "Company Accountant",
  "Property Manager",
  "Property Administrator",
  "Board Member",
  "Resident (Admin)",
  "Concierge",
  "Gatehouse Keeper",
  "Superintendent",
  "Other",
];

const SHOW_TO_FILTERS = [
  "No filter",
  "Show to Selected Floors/Areas",
  "Show to Selected Units",
  "Show to Users with Pets",
];

const POST_TIME_OPTIONS = [
  "Now",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
];

type NotificationScope = "none" | "allBuildings" | "onlyNew";

type NewsNoticeEditPageProps = {
  route: AdminRoute & { page: "news-notice-edit" };
  onNavigate: (route: AdminRoute) => void;
  onRefresh: () => void;
};

export function NewsNoticeEditPage({ route, onNavigate, onRefresh }: NewsNoticeEditPageProps) {
  const [item, setItem] = useState<AdminNewsItem | null>(null);
  const [emailReportOpen, setEmailReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [companyBuildings, setCompanyBuildings] = useState<CompanyBuilding[]>([]);
  const [unitGroups, setUnitGroups] = useState<BuildingUnitGroup[]>([]);
  const [additionalBuildingIds, setAdditionalBuildingIds] = useState<string[]>([]);
  const [notificationScope, setNotificationScope] = useState<NotificationScope>("none");
  const [selectedFloors, setSelectedFloors] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  const activeBuildingId = getActiveBuildingId();

  useEffect(() => {
    adminRepository.getNewsById(route.id).then((loaded) => {
      if (!loaded) return;
      setItem({
        ...loaded,
        residentTypes: loaded.residentTypes.map((type) =>
          type === "Absentee Owner" ? "Absentee Owners" : type
        ),
      });
      setNotificationScope(loaded.noNotifications ? "none" : "allBuildings");
    });
    companyRepository.getBuildings().then(setCompanyBuildings).catch(() => setCompanyBuildings([]));
    adminRepository.getBuildingUnits().then(setUnitGroups).catch(() => setUnitGroups([]));
  }, [route.id]);

  const currentBuilding = useMemo(
    () => companyBuildings.find((b) => b.id === activeBuildingId) ?? null,
    [companyBuildings, activeBuildingId]
  );

  const addableBuildings = useMemo(
    () =>
      companyBuildings.filter(
        (b) => b.id !== activeBuildingId && !additionalBuildingIds.includes(b.id)
      ),
    [companyBuildings, activeBuildingId, additionalBuildingIds]
  );

  const postedBuildings = useMemo(() => {
    const ids = [activeBuildingId, ...additionalBuildingIds].filter(Boolean) as string[];
    return ids
      .map((id) => companyBuildings.find((b) => b.id === id))
      .filter((b): b is CompanyBuilding => Boolean(b));
  }, [activeBuildingId, additionalBuildingIds, companyBuildings]);

  const { run: handleSave, loading: saving, error: saveError } = useAsyncAction(
    useCallback(async () => {
      if (!item) return;
      const now = new Date();
      const dateStr = `${now.toISOString().slice(0, 10)}\n${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const historyEntry = {
        status: item.status,
        date: dateStr,
        user: "Claudio Owner",
        action: item.status === "draft" ? "Draft Saved" : "Edited Notice",
        notification:
          notificationScope === "none"
            ? undefined
            : notificationScope === "onlyNew"
              ? "Saved with Send Notifications to Add More buildings"
              : "Saved with Send Notifications Selected",
      };
      await adminRepository.updateNews(
        route.id,
        {
          ...item,
          noNotifications: notificationScope === "none",
          lastUpdatedBy: "Claudio Owner",
          lastUpdatedAt: now.toLocaleString(),
          editHistory: [...(item.editHistory ?? []), historyEntry],
        },
        { sendNotifications: notificationScope !== "none" }
      );
      onRefresh();
      onNavigate({ page: "news-notices", tab: item.status === "archived" ? "archived" : "current" });
    }, [item, notificationScope, route.id, onRefresh, onNavigate]),
    { successMessage: "News/notice saved." }
  );

  const { run: handleDelete, loading: deleting } = useAsyncAction(
    useCallback(async () => {
      await adminRepository.archiveNews(route.id);
      onRefresh();
      onNavigate({ page: "news-notices", tab: "current" });
    }, [route.id, onRefresh, onNavigate]),
    { successMessage: "News/notice deleted." }
  );

  usePageContentBusy(!item);

  if (!item) {
    return null;
  }

  const update = (updates: Partial<AdminNewsItem>) => {
    setItem({ ...item, ...updates });
  };

  const toggleInList = (field: "residentTypes" | "adminCcTypes", value: string) => {
    const list = item[field];
    update({
      [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    });
  };

  const selectAll = (field: "residentTypes" | "adminCcTypes", all: string[]) => {
    update({ [field]: [...all] });
  };

  const selectNone = (field: "residentTypes" | "adminCcTypes") => {
    update({ [field]: [] });
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
      update({ imageUrl: dataUrl });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to read image.");
    }
  };

  const handleAttachmentSelect = async (file: File | null) => {
    if (!file) return;
    const error = validateAttachmentFile(file);
    if (error) {
      alert(error);
      return;
    }
    try {
      const dataUrl = await toDataUrl(file);
      update({
        attachmentName: sanitizeFileName(file.name),
        attachmentUrl: dataUrl,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to read attachment.");
    }
  };

  const handleSaveClick = () => void handleSave();

  const stats = item.emailStats ?? {
    sent: item.emailTotal,
    delivered: item.emailDelivered,
    opened: 0,
    clicked: 0,
    bounced: Math.max(0, item.emailTotal - item.emailDelivered),
    spamReports: 0,
    rejections: 0,
    delayed: 0,
  };

  const isActive = item.status === "active";
  const showFloors = item.showToFilter === "Show to Selected Floors/Areas";
  const showUnits = item.showToFilter === "Show to Selected Units";
  const showPets = item.showToFilter === "Show to Users with Pets";

  const toggleFloor = (floor: string) => {
    setSelectedFloors((prev) =>
      prev.includes(floor) ? prev.filter((f) => f !== floor) : [...prev, floor]
    );
  };

  const toggleUnit = (unitKey: string) => {
    setSelectedUnits((prev) =>
      prev.includes(unitKey) ? prev.filter((u) => u !== unitKey) : [...prev, unitKey]
    );
  };

  const toggleAdditionalBuilding = (buildingId: string) => {
    setAdditionalBuildingIds((prev) =>
      prev.includes(buildingId) ? prev.filter((id) => id !== buildingId) : [...prev, buildingId]
    );
  };

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />
      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white">
          <span className="flex items-center gap-2">
            <FaNewspaper aria-hidden />
            Edit News/Notice
          </span>
          {item.lastUpdatedBy ? (
            <span className="text-xs font-normal text-white/90">
              Last updated by {item.lastUpdatedBy}
              {item.lastUpdatedAt ? ` on ${item.lastUpdatedAt}` : ""}
            </span>
          ) : null}
        </div>

        <div className="space-y-4 p-4">
          {saveError ? <FormAlert message={saveError} /> : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <AdminFormPanel title="Options" icon={<FaCog className="text-slate-500" aria-hidden />}>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700">
                  Status:<RequiredMark />
                </legend>
                <div className="flex flex-wrap gap-6">
                  <RadioOption
                    name="status"
                    label="Active"
                    checked={item.status === "active"}
                    onChange={() => update({ status: "active" })}
                  />
                  <RadioOption
                    name="status"
                    label="Draft"
                    checked={item.status === "draft"}
                    onChange={() => {
                      update({ status: "draft" });
                      setNotificationScope("none");
                    }}
                  />
                </div>
              </fieldset>

              <FormDivider />

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700">Notifications:</legend>
                <div className="space-y-2">
                  <RadioOption
                    name="notifications"
                    label="No Notifications"
                    checked={notificationScope === "none"}
                    onChange={() => setNotificationScope("none")}
                  />
                  {isActive ? (
                    <>
                      <RadioOption
                        name="notifications"
                        label="Send Notifications"
                        checked={notificationScope === "allBuildings"}
                        onChange={() => setNotificationScope("allBuildings")}
                      />
                      <RadioOption
                        name="notifications"
                        label="Send Notifications to only those listed in 'Add More'"
                        checked={notificationScope === "onlyNew"}
                        onChange={() => setNotificationScope("onlyNew")}
                      />
                    </>
                  ) : null}
                </div>
              </fieldset>

              <FormDivider />

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">
                    Post Date <RequiredMark />
                    <HelpTip text="Select the date that this notice will be posted. If 'Send Notifications' is selected, notices will be sent on this date as well." />
                  </span>
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => update({ date: e.target.value })}
                    className={inputClass}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">
                    Post Time <RequiredMark />
                    <HelpTip text="Select the time that this notice will be posted and notifications will be sent." />
                  </span>
                  <select
                    value={item.postTime ?? ""}
                    onChange={(e) => update({ postTime: e.target.value })}
                    className={inputClass}
                    required
                  >
                    <option value="">Select time</option>
                    {POST_TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">
                    Expiration
                    <HelpTip text="Select the date that this notice will no longer be shown to residents." />
                  </span>
                  <input
                    type="date"
                    value={item.expires ?? ""}
                    onChange={(e) => update({ expires: e.target.value || undefined })}
                    className={inputClass}
                  />
                </label>
              </div>
            </AdminFormPanel>

            <AdminFormPanel title="Post to:" icon={<FaExchangeAlt className="text-slate-500" aria-hidden />}>
              <div className="max-h-[150px] overflow-y-auto rounded border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border-b border-slate-200 px-3 py-2 text-center font-medium text-slate-600">
                        Address
                      </th>
                      <th className="border-b border-slate-200 px-2 py-2 text-center font-medium text-slate-600" />
                    </tr>
                  </thead>
                  <tbody>
                    {postedBuildings.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-3 py-4 text-center text-slate-500">
                          {currentBuilding ? "Loading building…" : "No building selected."}
                        </td>
                      </tr>
                    ) : (
                      postedBuildings.map((building) => (
                        <tr key={building.id} className="border-t border-slate-100">
                          <td className="px-3 py-2">
                            <p className="font-semibold text-slate-800">{building.code}</p>
                            <p className="text-xs text-slate-600">
                              {building.condoLine ?? `(${building.code}) ${building.address}`}
                            </p>
                            {building.cityProvincePostal ? (
                              <p className="text-xs text-slate-500">{building.cityProvincePostal}</p>
                            ) : null}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {building.id !== activeBuildingId ? (
                              <button
                                type="button"
                                onClick={() => toggleAdditionalBuilding(building.id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Add More</label>
                <select
                  multiple
                  size={4}
                  value={additionalBuildingIds}
                  onChange={(e) => {
                    const ids = Array.from(e.target.selectedOptions, (opt) => opt.value);
                    setAdditionalBuildingIds(ids);
                  }}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {addableBuildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.code} ({building.code}) {building.address}
                      {building.cityProvincePostal ? ` ${building.cityProvincePostal}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</p>
              </div>
            </AdminFormPanel>
          </div>

          <CheckboxPanel
            title="Show to the following Resident Types:"
            items={RESIDENT_TYPES}
            selected={item.residentTypes}
            onToggle={(v) => toggleInList("residentTypes", v)}
            onSelectAll={() => selectAll("residentTypes", RESIDENT_TYPES)}
            onSelectNone={() => selectNone("residentTypes")}
          />

          <CheckboxPanel
            title="CC the following Admin Types*"
            subtitle="* Only applies when Send Notifications is selected"
            items={ADMIN_CC_TYPES}
            selected={item.adminCcTypes}
            onToggle={(v) => toggleInList("adminCcTypes", v)}
            onSelectAll={() => selectAll("adminCcTypes", ADMIN_CC_TYPES)}
            onSelectNone={() => selectNone("adminCcTypes")}
            columns={2}
          />

          <AdminFormPanel
            title="Show to Filter:"
            icon={<FaCheckSquare className="text-slate-500" aria-hidden />}
            className="max-h-[500px]"
          >
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <select
                  value={item.showToFilter}
                  onChange={(e) => update({ showToFilter: e.target.value })}
                  className={inputClass}
                >
                  {SHOW_TO_FILTERS.map((f) => (
                    <option key={f} value={f}>
                      {f === "No filter" ? "No filter" : f}
                    </option>
                  ))}
                </select>
                <HelpTip
                  text="Here you can filter who can see this post. Custom unit groups can be defined and edited under the 'Building Definition' area."
                  className="ml-1"
                />
              </div>
            </div>

            {showFloors ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {unitGroups.map((group) => (
                  <CheckboxOption
                    key={group.floorArea}
                    label={group.floorArea}
                    checked={selectedFloors.includes(group.floorArea)}
                    onChange={() => toggleFloor(group.floorArea)}
                  />
                ))}
              </div>
            ) : null}

            {showPets ? (
              <p className="mt-4 text-sm text-slate-500">No pet filter options configured for this building.</p>
            ) : null}

            {showUnits ? (
              <div className="mt-4 max-h-80 space-y-6 overflow-y-auto">
                {unitGroups.map((group) => (
                  <UnitGroupSelector
                    key={group.floorArea}
                    group={group}
                    selectedUnits={selectedUnits}
                    onToggleUnit={toggleUnit}
                    onSelectAll={() => {
                      const keys = group.units.map((u) => `${group.floorArea}:${u}`);
                      setSelectedUnits((prev) => [...new Set([...prev, ...keys])]);
                    }}
                    onSelectNone={() => {
                      setSelectedUnits((prev) =>
                        prev.filter((key) => !key.startsWith(`${group.floorArea}:`))
                      );
                    }}
                  />
                ))}
              </div>
            ) : null}
          </AdminFormPanel>

          <AdminFormPanel title="Content" icon={<FaNewspaper className="text-slate-500" aria-hidden />}>
            <label className="mb-4 block text-sm">
              <span className="font-medium text-slate-700">
                Title <RequiredMark />
              </span>
              <input
                value={item.title}
                onChange={(e) => update({ title: e.target.value })}
                maxLength={80}
                placeholder="Title"
                className={cn(inputClass, "mt-1")}
                required
              />
            </label>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700">
                Body <RequiredMark />
              </span>
              <button
                type="button"
                className="rounded border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Insert Template
              </button>
            </div>
            <textarea
              value={item.body}
              onChange={(e) => update({ body: e.target.value })}
              rows={12}
              placeholder="Enter News/Notice body"
              className="w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
              required
            />
          </AdminFormPanel>

          <div className="grid gap-4 lg:grid-cols-2">
            <AdminFormPanel title="Image" icon={<FaImage className="text-slate-500" aria-hidden />}>
              <p className="mb-3 text-xs text-slate-500">JPG, PNG, or GIF — 5MB max.</p>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt="Notice"
                  className="mb-3 max-h-48 rounded border object-cover"
                />
              ) : null}
              <FileUploadZone
                onFileSelect={(file) => void handleImageSelect(file)}
                onRemove={item.imageUrl ? () => update({ imageUrl: undefined }) : undefined}
              />
            </AdminFormPanel>

            <AdminFormPanel title="Attachment" icon={<FaFile className="text-slate-500" aria-hidden />}>
              <p className="mb-3 text-xs text-slate-500">PDF or image — 5MB max.</p>
              {item.attachmentName ? (
                <p className="mb-2 text-sm font-medium text-slate-700">{item.attachmentName}</p>
              ) : null}
              <FileUploadZone
                onFileSelect={(file) => void handleAttachmentSelect(file)}
                onRemove={
                  item.attachmentUrl
                    ? () => update({ attachmentName: undefined, attachmentUrl: undefined })
                    : undefined
                }
              />
            </AdminFormPanel>
          </div>

          {item.emailTotal > 0 ? (
            <AdminFormPanel title="Email Notifications">
              <button
                type="button"
                onClick={() => setEmailReportOpen(true)}
                className="flex w-full flex-wrap justify-center gap-2"
              >
                <StatPill label={`${stats.sent} Sent`} tone="inverse" />
                <StatPill label={`${stats.delivered} Delivered`} tone="success" />
                <StatPill label={`${stats.opened} Opened`} tone="primary" />
                <StatPill label={`${stats.clicked} Clicked Link`} tone="primary" />
                {stats.bounced > 0 ? <StatPill label={`${stats.bounced} Bounced`} tone="danger" /> : null}
                {stats.spamReports > 0 ? (
                  <StatPill label={`${stats.spamReports} Spam Reports`} tone="danger" />
                ) : null}
                {stats.rejections > 0 ? (
                  <StatPill label={`${stats.rejections} Rejections`} tone="danger" />
                ) : null}
                {stats.delayed > 0 ? <StatPill label={`${stats.delayed} Delayed`} tone="warning" /> : null}
              </button>
              <p className="mt-2 text-center text-xs text-slate-500">Click for detailed information</p>
            </AdminFormPanel>
          ) : null}

          {(item.editHistory?.length ?? 0) > 0 ? (
            <AdminFormPanel title="Edit History:" icon={<FaClock className="text-slate-500" aria-hidden />}>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-center font-medium text-slate-600">Status Selection</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">User</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Action</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Notification Selection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.editHistory.map((entry, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-center">
                          <StatusBadge status={entry.status} />
                        </td>
                        <td className="whitespace-pre px-3 py-2 text-center text-xs">{entry.date}</td>
                        <td className="px-3 py-2">{entry.user}</td>
                        <td className="px-3 py-2">{entry.action}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{entry.notification ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminFormPanel>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <ActionButton
            label="Delete"
            variant="secondary"
            className="!border-red-300 !text-red-700 hover:!bg-red-50"
            onClick={() => setDeleteOpen(true)}
          />
          <ActionButton label="Save" loadingLabel="Saving…" loading={saving} onClick={handleSaveClick} />
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this record?"
        message="This news/notice will be archived. Continue?"
        confirmLabel="Yes"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />

      <EmailNoticesReportModal
        open={emailReportOpen}
        item={item}
        onClose={() => setEmailReportOpen(false)}
      />
    </>
  );
}

const inputClass = "mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm";

function RequiredMark() {
  return <span className="text-red-600"> *</span>;
}

function FormDivider() {
  return <hr className="my-4 border-slate-200" />;
}

function HelpTip({ text, className }: { text: string; className?: string }) {
  return (
    <span title={text} className={cn("ml-1 inline-flex cursor-help text-[#3476ef]", className)}>
      <FaQuestionCircle aria-hidden />
    </span>
  );
}

function RadioOption({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="text-[#3476ef]" />
      {label}
    </label>
  );
}

function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded text-[#3476ef]" />
      {label}
    </label>
  );
}

function CheckboxPanel({
  title,
  subtitle,
  items,
  selected,
  onToggle,
  onSelectAll,
  onSelectNone,
  columns = 5,
}: {
  title: string;
  subtitle?: string;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  columns?: 2 | 5;
}) {
  const gridClass =
    columns === 2 ? "grid gap-2 sm:grid-cols-2" : "grid gap-2 sm:grid-cols-2 lg:grid-cols-5";

  return (
    <AdminFormPanel
      title={title}
      icon={<FaCheckSquare className="text-slate-500" aria-hidden />}
      toolbar={
        <div className="flex items-center gap-1 text-xs">
          <button type="button" onClick={onSelectAll} className="text-[#28a7dd] hover:underline">
            Select All
          </button>
          <span className="text-slate-400">|</span>
          <button type="button" onClick={onSelectNone} className="text-[#28a7dd] hover:underline">
            Select None
          </button>
        </div>
      }
    >
      {subtitle ? <p className="mb-3 text-xs text-slate-500">{subtitle}</p> : null}
      <div className={gridClass}>
        {items.map((type) => (
          <CheckboxOption
            key={type}
            label={type}
            checked={selected.includes(type)}
            onChange={() => onToggle(type)}
          />
        ))}
      </div>
    </AdminFormPanel>
  );
}

function UnitGroupSelector({
  group,
  selectedUnits,
  onToggleUnit,
  onSelectAll,
  onSelectNone,
}: {
  group: BuildingUnitGroup;
  selectedUnits: string[];
  onToggleUnit: (key: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{group.floorArea}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Select All In This Area
          </button>
          <button
            type="button"
            onClick={onSelectNone}
            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Select None
          </button>
        </div>
      </div>
      <hr className="mb-3 border-slate-200" />
      <div className="grid gap-2 sm:grid-cols-3">
        {group.units.map((unit) => {
          const key = `${group.floorArea}:${unit}`;
          return (
            <CheckboxOption
              key={key}
              label={`${group.floorArea} - Unit: ${unit}`}
              checked={selectedUnits.includes(key)}
              onChange={() => onToggleUnit(key)}
            />
          );
        })}
      </div>
    </div>
  );
}

function StatPill({
  label,
  tone,
}: {
  label: string;
  tone: "inverse" | "success" | "primary" | "danger" | "warning";
}) {
  const tones = {
    inverse: "bg-slate-700 text-white",
    success: "bg-[#5cb85c] text-white",
    primary: "bg-[#3476ef] text-white",
    danger: "bg-red-600 text-white",
    warning: "bg-amber-500 text-white",
  };
  return <span className={`rounded px-2 py-1 text-xs font-medium ${tones[tone]}`}>{label}</span>;
}
