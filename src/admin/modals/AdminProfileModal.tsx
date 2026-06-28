import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaBan,
  FaEnvelope,
  FaExclamationCircle,
  FaEye,
  FaFolderOpen,
  FaUser,
  FaUserCircle,
} from "react-icons/fa";
import { AdminFormPanel } from "../components/AdminFormPanel";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { StatusBadge } from "../../shared/StatusBadge";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { buildAdminUserUpdates } from "../../shared/formDirty";
import { useBusyWhile } from "../../shared/useBusyWhile";
import { adminRepository } from "../data/adminRepository";
import type {
  AdminUser,
  EmailRecord,
  NotificationPreference,
  UpdateAdminUserInput,
} from "../../resident/data/types";

type Tab = "profile" | "notifications" | "email";

type ProfileDraft = UpdateAdminUserInput & {
  avatarPreview?: string;
};

const TIMEZONE_OPTIONS = [
  "America/Toronto",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Vancouver",
  "America/Halifax",
  "America/Winnipeg",
  "America/Edmonton",
  "UTC",
] as const;

type AdminProfileModalProps = {
  open: boolean;
  onClose: () => void;
  onProfileSaved?: (user: AdminUser) => void;
};

function userToDraft(user: AdminUser): ProfileDraft {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    timezone: user.timezone,
    telHome: user.telHome ?? "",
    telMobile: user.telMobile ?? "",
    telBusiness: user.telBusiness ?? "",
    avatarUrl: user.avatarUrl,
    avatarPreview: user.avatarUrl,
  };
}

export function AdminProfileModal({ open, onClose, onProfileSaved }: AdminProfileModalProps) {
  const [tab, setTab] = useState<Tab>("profile");
  const [savedUser, setSavedUser] = useState<AdminUser | null>(null);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAvatarUrl = useRef<string | null>(null);

  const { run: saveProfile, loading: saving, error } = useAsyncAction(
    useCallback(async () => {
      if (!draft || !savedUser) return;
      if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.email.trim()) {
        throw new Error("First name, last name, and email are required.");
      }
      const updates = buildAdminUserUpdates(savedUser, {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        timezone: draft.timezone,
        telHome: draft.telHome?.trim() ?? "",
        telMobile: draft.telMobile?.trim() ?? "",
        telBusiness: draft.telBusiness?.trim() ?? "",
        avatarUrl: draft.avatarUrl,
      });
      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }
      const updated = await adminRepository.updateAdminUser(updates);
      setSavedUser(updated);
      setDraft(userToDraft(updated));
      onProfileSaved?.(updated);
      onClose();
    }, [draft, savedUser, onProfileSaved, onClose]),
    { successMessage: "Profile saved." }
  );

  useEffect(() => {
    if (!open) return;
    adminRepository.getAdminUser().then((user) => {
      setSavedUser(user);
      setDraft(userToDraft(user));
    });
    adminRepository.getAdminNotificationPreferences().then(setPrefs);
    adminRepository.getAdminEmails().then(setEmails);
    setTab("profile");
    setSelectedEmail(null);
  }, [open]);

  useBusyWhile(open && !draft);

  useEffect(() => {
    return () => {
      if (pendingAvatarUrl.current) {
        URL.revokeObjectURL(pendingAvatarUrl.current);
        pendingAvatarUrl.current = null;
      }
    };
  }, []);

  const togglePref = async (id: string, enabled: boolean) => {
    await adminRepository.updateAdminNotificationPreference(id, enabled);
    setPrefs((p) => p.map((x) => (x.id === id ? { ...x, enabled } : x)));
  };

  const updateDraft = (updates: Partial<ProfileDraft>) => {
    setDraft((d) => (d ? { ...d, ...updates } : d));
  };

  const resetAvatar = () => {
    if (pendingAvatarUrl.current) {
      URL.revokeObjectURL(pendingAvatarUrl.current);
      pendingAvatarUrl.current = null;
    }
    updateDraft({
      avatarPreview: savedUser?.avatarUrl,
      avatarUrl: savedUser?.avatarUrl,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAvatarBrowse = (file: File | undefined) => {
    if (!file) return;
    if (pendingAvatarUrl.current) URL.revokeObjectURL(pendingAvatarUrl.current);
    const url = URL.createObjectURL(file);
    pendingAvatarUrl.current = url;
    updateDraft({ avatarPreview: url, avatarUrl: url });
  };

  const handleCancelProfile = () => {
    if (savedUser) setDraft(userToDraft(savedUser));
    resetAvatar();
    onClose();
  };

  const handleSaveProfile = () => {
    void saveProfile();
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <FaUser /> },
    { id: "notifications", label: "Notifications", icon: <FaExclamationCircle /> },
    { id: "email", label: "Email History", icon: <FaEnvelope /> },
  ];

  const showProfileFooter = tab === "profile";

  return (
    <>
      <Modal
        open={open && !selectedEmail}
        onClose={onClose}
        title="Your Profile"
        size="xl"
        footer={
          showProfileFooter ? (
            <div className="flex w-full justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelProfile}
                className="rounded border border-slate-300 bg-slate-100 px-5 py-2 text-sm text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <ActionButton
                label="Save Changes"
                loadingLabel="Saving…"
                loading={saving}
                disabled={!draft}
                onClick={handleSaveProfile}
              />
            </div>
          ) : (
            <div className="flex w-full justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          )
        }
      >
        <div className="-mx-2 -mt-2">
          <div className="flex border-b border-slate-300 bg-slate-100">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-2 border-r border-slate-300 px-4 py-3 text-sm font-medium transition last:border-r-0 ${
                  tab === t.id
                    ? "border-b-0 bg-white text-slate-900"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white p-4">
            {tab === "profile" && draft && (
              <div className="space-y-4">
                {error ? <FormAlert message={error} /> : null}
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminFormPanel title="Avatar" headerColor="purple">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
                        {draft.avatarPreview ? (
                          <img
                            src={draft.avatarPreview}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FaUserCircle className="text-6xl text-slate-300" />
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAvatarBrowse(e.target.files?.[0])}
                      />
                      <div className="flex w-full gap-2">
                        <button
                          type="button"
                          onClick={resetAvatar}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                        >
                          <FaBan />
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                        >
                          <FaFolderOpen />
                          Browse...
                        </button>
                      </div>
                    </div>
                  </AdminFormPanel>

                  <AdminFormPanel title="User Details" headerColor="purple">
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="font-medium text-slate-700">
                            First Name <span className="text-red-500">*</span>
                          </span>
                          <input
                            type="text"
                            value={draft.firstName}
                            onChange={(e) => updateDraft({ firstName: e.target.value })}
                            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#00a8ff] focus:ring-1 focus:ring-[#00a8ff]"
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="font-medium text-slate-700">
                            Last Name <span className="text-red-500">*</span>
                          </span>
                          <input
                            type="text"
                            value={draft.lastName}
                            onChange={(e) => updateDraft({ lastName: e.target.value })}
                            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#00a8ff] focus:ring-1 focus:ring-[#00a8ff]"
                          />
                        </label>
                      </div>
                      <label className="block text-sm">
                        <span className="font-medium text-slate-700">
                          Email <span className="text-red-500">*</span>
                        </span>
                        <input
                          type="email"
                          value={draft.email}
                          onChange={(e) => updateDraft({ email: e.target.value })}
                          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#00a8ff] focus:ring-1 focus:ring-[#00a8ff]"
                        />
                      </label>
                    </div>
                  </AdminFormPanel>
                </div>

                <AdminFormPanel title="Timezone & Phone" headerColor="purple">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">Time Zone</span>
                      <select
                        value={draft.timezone}
                        onChange={(e) => updateDraft({ timezone: e.target.value })}
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#00a8ff] focus:ring-1 focus:ring-[#00a8ff]"
                      >
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">Tel Home</span>
                      <input
                        type="tel"
                        value={draft.telHome ?? ""}
                        onChange={(e) => updateDraft({ telHome: e.target.value })}
                        placeholder="Telephone"
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#00a8ff] focus:ring-1 focus:ring-[#00a8ff]"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">Tel Mobile</span>
                      <input
                        type="tel"
                        value={draft.telMobile ?? ""}
                        onChange={(e) => updateDraft({ telMobile: e.target.value })}
                        placeholder="Telephone"
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#00a8ff] focus:ring-1 focus:ring-[#00a8ff]"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">Tel Business</span>
                      <input
                        type="tel"
                        value={draft.telBusiness ?? ""}
                        onChange={(e) => updateDraft({ telBusiness: e.target.value })}
                        placeholder="Telephone"
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#00a8ff] focus:ring-1 focus:ring-[#00a8ff]"
                      />
                    </label>
                  </div>
                </AdminFormPanel>
              </div>
            )}

            {tab === "notifications" && (
              <div className="space-y-3">
                {prefs.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center justify-between rounded border border-slate-200 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700">{p.label}</span>
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => togglePref(p.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#00a8ff]"
                    />
                  </label>
                ))}
              </div>
            )}

            {tab === "email" && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-slate-800">45 Day Email History</h3>
                <div className="mb-4 flex gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  <FaExclamationCircle className="mt-0.5 shrink-0" />
                  <p>
                    Email activity is shown per email address. If you use the same email on multiple
                    MVP Condos accounts, this history includes activity across all of them.
                  </p>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="px-2 py-2">Date</th>
                      <th className="px-2 py-2">Subject</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {emails.map((e) => (
                      <tr key={e.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 text-slate-600">{e.date}</td>
                        <td className="px-2 py-2 text-slate-800">{e.subject}</td>
                        <td className="px-2 py-2">
                          <StatusBadge status={e.status} />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedEmail(e)}
                            className="inline-flex items-center gap-1 rounded bg-[#00a8ff] px-2 py-1 text-xs text-white hover:bg-[#0096e6]"
                          >
                            <FaEye />
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {selectedEmail && (
        <Modal open onClose={() => setSelectedEmail(null)} title="Email Details" size="md">
          <p className="text-sm text-slate-500">{selectedEmail.date}</p>
          <p className="mt-2 font-medium text-slate-800">{selectedEmail.subject}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">{selectedEmail.body}</p>
        </Modal>
      )}
    </>
  );
}
