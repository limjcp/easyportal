import { useEffect, useState } from "react";
import { StatusBadge } from "../components/AdminBadges";
import { AdminPanelHeader } from "../components/AdminPanelTable";
import { adminRepository } from "../data/adminRepository";
import { AdminPageActions } from "../components/AdminPageActions";
import { EmailNoticesReportModal } from "../modals/EmailNoticesReportModal";
import type { AdminRoute } from "../navigation";
import type { AdminNewsItem } from "../../resident/data/types";

const RESIDENT_TYPES = [
  "Absentee Owner",
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

type NewsNoticeEditPageProps = {
  route: AdminRoute & { page: "news-notice-edit" };
  onNavigate: (route: AdminRoute) => void;
  onRefresh: () => void;
};

export function NewsNoticeEditPage({ route, onNavigate, onRefresh }: NewsNoticeEditPageProps) {
  const [item, setItem] = useState<AdminNewsItem | null>(null);
  const [emailReportOpen, setEmailReportOpen] = useState(false);

  useEffect(() => {
    adminRepository.getNewsById(route.id).then(setItem);
  }, [route.id]);

  if (!item) {
    return <div className="py-8 text-center text-slate-500">Loading...</div>;
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

  const handleSave = async () => {
    const now = new Date();
    const dateStr = `${now.toISOString().slice(0, 10)}\n${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const historyEntry = {
      status: item.status,
      date: dateStr,
      user: "Claudio Owner",
      action: item.status === "draft" ? "Draft Saved" : "Edited Notice",
      notification: item.noNotifications
        ? undefined
        : "Saved with Send Notifications Selected",
    };
    await adminRepository.updateNews(route.id, {
      ...item,
      lastUpdatedBy: "Claudio Owner",
      lastUpdatedAt: now.toLocaleString(),
      editHistory: [...(item.editHistory ?? []), historyEntry],
    });
    onRefresh();
    onNavigate({ page: "news-notices", tab: item.status === "archived" ? "archived" : "current" });
  };

  const stats = item.emailStats ?? {
    sent: item.emailTotal,
    delivered: item.emailDelivered,
    opened: Math.floor(item.emailDelivered * 0.65),
    clicked: 2,
    bounced: Math.max(0, item.emailTotal - item.emailDelivered),
    spamReports: 0,
    rejections: 0,
    delayed: 0,
  };

  return (
    <>
      <AdminPageActions
        route={route}
        onNavigate={onNavigate}
        primaryAction={
          <button type="button" onClick={handleSave} className="rounded bg-[#3476ef] px-4 py-1.5 text-sm text-white">
            Save
          </button>
        }
      />
      <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
        <AdminPanelHeader title="Edit News/Notice" />
        <div className="space-y-6 p-4">
          {item.lastUpdatedBy && (
            <p className="rounded bg-blue-50 px-3 py-2 text-sm text-[#3476ef]">
              Last Updated by: {item.lastUpdatedBy}
              {item.lastUpdatedAt ? ` on ${item.lastUpdatedAt}` : ""}
            </p>
          )}
          <section>
            <h3 className="mb-3 font-semibold text-slate-700">Options</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-600">Status</legend>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="status"
                      checked={item.status === "active"}
                      onChange={() => update({ status: "active" })}
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="status"
                      checked={item.status === "draft"}
                      onChange={() => update({ status: "draft" })}
                    />
                    Draft
                  </label>
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-600">Notifications</legend>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="notifications"
                      checked={item.noNotifications}
                      onChange={() => update({ noNotifications: true })}
                    />
                    No Notifications
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="notifications"
                      checked={!item.noNotifications}
                      onChange={() => update({ noNotifications: false })}
                    />
                    Send Notifications
                  </label>
                </div>
              </fieldset>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm">
                Post Date
                <input
                  type="text"
                  value={item.date}
                  onChange={(e) => update({ date: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
                />
              </label>
              <label className="block text-sm">
                Post Time
                <input
                  type="text"
                  value={item.postTime ?? ""}
                  onChange={(e) => update({ postTime: e.target.value })}
                  placeholder="e.g. 9:00 AM"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
                />
              </label>
              <label className="block text-sm">
                Expiration
                <input
                  type="text"
                  value={item.expires ?? ""}
                  onChange={(e) => update({ expires: e.target.value })}
                  placeholder="Optional"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
                />
              </label>
            </div>
          </section>

          <CheckboxSection
            title="Show to the following Resident Types"
            items={RESIDENT_TYPES}
            selected={item.residentTypes}
            onToggle={(v) => toggleInList("residentTypes", v)}
            onSelectAll={() => selectAll("residentTypes", RESIDENT_TYPES)}
            onSelectNone={() => selectNone("residentTypes")}
          />

          <CheckboxSection
            title="CC the following Admin Types (only when Send Notifications is selected)"
            items={ADMIN_CC_TYPES}
            selected={item.adminCcTypes}
            onToggle={(v) => toggleInList("adminCcTypes", v)}
            onSelectAll={() => selectAll("adminCcTypes", ADMIN_CC_TYPES)}
            onSelectNone={() => selectNone("adminCcTypes")}
          />

          <label className="block max-w-md text-sm">
            Show to Filter
            <select
              value={item.showToFilter}
              onChange={(e) => update({ showToFilter: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            >
              {SHOW_TO_FILTERS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>

          <section>
            <h3 className="mb-3 font-semibold text-slate-700">Content</h3>
            <label className="mb-3 block text-sm">
              Title
              <input
                value={item.title}
                onChange={(e) => update({ title: e.target.value })}
                maxLength={80}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
              />
            </label>
            <label className="block text-sm">
              Body
              <textarea
                value={item.body}
                onChange={(e) => update({ body: e.target.value })}
                rows={10}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 font-mono text-sm"
              />
            </label>
            <button
              type="button"
              className="mt-2 rounded border border-slate-300 px-3 py-1 text-sm text-slate-600"
            >
              Insert Template
            </button>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded border border-slate-200 p-4">
              <h3 className="mb-2 font-semibold text-slate-700">Image</h3>
              <p className="text-xs text-slate-500">Drag & drop or browse to upload (demo).</p>
              <button type="button" className="mt-2 rounded border border-slate-300 px-3 py-1 text-sm">
                Browse…
              </button>
            </section>
            <section className="rounded border border-slate-200 p-4">
              <h3 className="mb-2 font-semibold text-slate-700">Attachment</h3>
              <p className="text-xs text-slate-500">Drag & drop or browse to upload (demo).</p>
              <button type="button" className="mt-2 rounded border border-slate-300 px-3 py-1 text-sm">
                Browse…
              </button>
            </section>
          </div>

          {item.emailTotal > 0 && (
            <section className="rounded border border-slate-200 p-4">
              <h3 className="mb-3 font-semibold text-slate-700">Email Notifications</h3>
              <button
                type="button"
                onClick={() => setEmailReportOpen(true)}
                className="flex flex-wrap justify-center gap-2"
              >
                <StatPill label={`${stats.sent} Sent`} tone="inverse" />
                <StatPill label={`${stats.delivered} Delivered`} tone="success" />
                <StatPill label={`${stats.opened} Opened`} tone="primary" />
                <StatPill label={`${stats.clicked} Clicked Link`} tone="primary" />
                {stats.bounced > 0 && <StatPill label={`${stats.bounced} Bounced`} tone="danger" />}
                {stats.spamReports > 0 && (
                  <StatPill label={`${stats.spamReports} Spam Reports`} tone="danger" />
                )}
                {stats.rejections > 0 && (
                  <StatPill label={`${stats.rejections} Rejections`} tone="danger" />
                )}
                {stats.delayed > 0 && <StatPill label={`${stats.delayed} Delayed`} tone="warning" />}
              </button>
              <p className="mt-2 text-center text-xs text-slate-500">Click for detailed information</p>
            </section>
          )}

          {(item.editHistory?.length ?? 0) > 0 && (
            <section>
              <h3 className="mb-3 font-semibold text-slate-700">Edit History</h3>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">User</th>
                      <th className="px-3 py-2 text-left">Action</th>
                      <th className="px-3 py-2 text-left">Notification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.editHistory.map((entry, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <StatusBadge status={entry.status} />
                        </td>
                        <td className="whitespace-pre px-3 py-2 text-xs">{entry.date}</td>
                        <td className="px-3 py-2">{entry.user}</td>
                        <td className="px-3 py-2">{entry.action}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{entry.notification ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>

      <EmailNoticesReportModal
        open={emailReportOpen}
        item={item}
        onClose={() => setEmailReportOpen(false)}
      />
    </>
  );
}

function CheckboxSection({
  title,
  items,
  selected,
  onToggle,
  onSelectAll,
  onSelectNone,
}: {
  title: string;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}) {
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <button type="button" onClick={onSelectAll} className="text-xs text-[#28a7dd] underline">
          Select All
        </button>
        <button type="button" onClick={onSelectNone} className="text-xs text-[#28a7dd] underline">
          Select None
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((type) => (
          <label key={type} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.includes(type)} onChange={() => onToggle(type)} />
            {type}
          </label>
        ))}
      </div>
    </section>
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
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${tones[tone]}`}>{label}</span>
  );
}
