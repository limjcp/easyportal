import { useEffect, useRef, useState } from "react";
import { FaEnvelope, FaExclamationCircle, FaEye, FaUser } from "react-icons/fa";
import { FormAlert } from "../../shared/FormAlert";
import { Modal } from "../../shared/Modal";
import { StatusBadge } from "../../shared/StatusBadge";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { usePortalConfig } from "../context/PortalConfigContext";
import { residentRepo } from "../data/residentRepository";
import type { EmailRecord, NotificationPreference, ResidentUser } from "../data/types";

type Tab = "profile" | "notifications" | "email";

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { profileFieldOptions } = usePortalConfig();
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<ResidentUser | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const toggleParamsRef = useRef<{ id: string; enabled: boolean }>({ id: "", enabled: false });

  const { run: runTogglePref, error: prefError } = useAsyncAction(
    async () => {
      const { id, enabled } = toggleParamsRef.current;
      await residentRepo.updateNotificationPreference(id, enabled);
      setPrefs((p) => p.map((x) => (x.id === id ? { ...x, enabled } : x)));
    },
    {
      errorMessage: "Unable to update notification preference.",
      showSuccessToast: false,
    }
  );

  const togglePref = (id: string, enabled: boolean) => {
    toggleParamsRef.current = { id, enabled };
    void runTogglePref();
  };

  useEffect(() => {
    if (!open) return;
    residentRepo.getUser().then(setUser);
    residentRepo.getNotificationPreferences().then(setPrefs);
    residentRepo.getEmails().then(setEmails);
    setTab("profile");
    setSelectedEmail(null);
  }, [open]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <FaUser /> },
    { id: "notifications", label: "Notifications", icon: <FaExclamationCircle /> },
    { id: "email", label: "Email History", icon: <FaEnvelope /> },
  ];

  return (
  <>
    <Modal
      open={open && !selectedEmail}
      onClose={onClose}
      title="My Account"
      size="xl"
    >
      <div className="-mt-2 -mx-2">
        <div className="flex border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                tab === t.id
                  ? "border-b-2 border-[#3476ef] text-[#3476ef]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === "profile" && user && (
            <div className="space-y-3 text-sm">
              <Field label="Name" value={user.name} />
              <Field label="Building" value={user.buildingName} />
              {user.buildingAddress ? <Field label="Address" value={user.buildingAddress} /> : null}
              <Field label="Unit" value={user.unit || "Pending assignment"} />
              <Field label="Email" value={user.email} />
              {isProfileFieldShown(profileFieldOptions, "cellPhone") ? (
                <Field label="Mobile Phone" value={formatProfileValue(user.cellPhone ?? user.phone)} />
              ) : null}
              {isProfileFieldShown(profileFieldOptions, "homePhone") ? (
                <Field label="Home Phone" value={formatProfileValue(user.homePhone)} />
              ) : null}
              {isProfileFieldShown(profileFieldOptions, "workPhone") ? (
                <Field label="Business Phone" value={formatProfileValue(user.workPhone)} />
              ) : null}
              <Field label="Role" value={user.role} />
              <Field
                label="Birthday"
                value={
                  user.birthMonth && user.birthDay
                    ? `${String(user.birthMonth).padStart(2, "0")}/${String(user.birthDay).padStart(2, "0")}`
                    : "Not provided"
                }
              />
            </div>
          )}
          {tab === "notifications" && (
            <div className="space-y-3">
              {prefError ? <FormAlert message={prefError} /> : null}
              {prefs.map((p) => (
                <label key={p.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-700">{p.label}</span>
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) => togglePref(p.id, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#3476ef]"
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
                  Please note: Email activity is on a per email address basis. If you have multiple accounts at
                  mvpcondos.com with the same email address, the information below will include activity across all of
                  the accounts under this email address.
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
                          className="inline-flex items-center gap-1 rounded bg-[#3476ef] px-2 py-1 text-xs text-white hover:bg-[#2d68cf]"
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
        <div className="flex justify-end border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-28 shrink-0 font-medium text-slate-500">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}

function formatProfileValue(value?: string) {
  return value?.trim() ? value.trim() : "Not provided";
}

function isProfileFieldShown(
  options: { fieldKey: string; show: boolean }[],
  fieldKey: string
) {
  const option = options.find((f) => f.fieldKey === fieldKey);
  return option?.show ?? true;
}
