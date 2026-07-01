import { useCallback, useEffect, useState } from "react";
import { FaEnvelope, FaTimes, FaUser } from "react-icons/fa";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { PurplePanel } from "../components/PurplePanel";
import { companyRepository } from "../data/companyRepository";
import { TIMEZONE_OPTIONS } from "../../shared/timezoneOptions";
import type { CompanyUser } from "../../resident/data/types";
import { cn } from "../../utils/cn";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";

type ProfileTab = "profile" | "notifications" | "email-history";

type CompanyProfileModalProps = {
  open: boolean;
  onClose: () => void;
  user: CompanyUser;
  onSaved?: (user: CompanyUser) => void;
};

export function CompanyProfileModal({ open, onClose, user, onSaved }: CompanyProfileModalProps) {
  const [tab, setTab] = useState<ProfileTab>("profile");
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [timezone, setTimezone] = useState(user.timezone ?? "America/Toronto");
  const [telHome, setTelHome] = useState(user.telHome ?? "");
  const [telMobile, setTelMobile] = useState(user.telMobile ?? "");
  const [telWork, setTelWork] = useState(user.telWork ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.avatarUrl);

  const { run, loading, error, clearError } = useAsyncAction(
    useCallback(async () => {
      return companyRepository.updateCompanyUser({
        firstName,
        lastName,
        email,
        timezone,
        telHome,
        telMobile,
        telWork,
      });
    }, [firstName, lastName, email, timezone, telHome, telMobile, telWork]),
    {
      successMessage: "Profile saved.",
      onSuccess: (updated) => {
        onSaved?.(updated);
        onClose();
      },
    }
  );

  useEffect(() => {
    if (!open) return;
    setTab("profile");
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setTimezone(user.timezone ?? "America/Toronto");
    setTelHome(user.telHome ?? "");
    setTelMobile(user.telMobile ?? "");
    setTelWork(user.telWork ?? "");
    setAvatarPreview(user.avatarUrl);
    clearError();
  }, [open, user, clearError]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run();
  };

  if (!open) return null;

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <FaUser className="text-lg" /> },
    { id: "notifications", label: "Notifications", icon: <span className="text-lg">!</span> },
    { id: "email-history", label: "Email History", icon: <FaEnvelope className="text-lg" /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <div className="w-full max-w-4xl rounded-sm bg-white shadow-2xl" role="dialog" aria-modal="true">
        <div className="border-b border-slate-200 px-4 pt-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
          <ul className="flex border-b border-slate-200">
            {tabs.map((t) => (
              <li key={t.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition",
                    tab === t.id
                      ? "border-[#7D5DA7] text-[#7D5DA7]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {tab === "profile" ? (
          <form onSubmit={handleSubmit}>
            <div className="max-h-[65vh] overflow-y-auto p-4">
              {error ? <FormAlert message={error} className="mb-4" /> : null}
              <div className="grid gap-4 md:grid-cols-2">
                <PurplePanel title="Avatar">
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={avatarPreview ?? "/admin/lib/image/avatar/avatar.png"}
                      alt=""
                      className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%23e2e8f0'/%3E%3C/svg%3E";
                      }}
                    />
                    <label className="cursor-pointer rounded border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100">
                      Browse …
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>
                </PurplePanel>

                <PurplePanel title="User Details">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        First Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Last Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-slate-700">
                        Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="off"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </PurplePanel>
              </div>

              <div className="mt-4">
                <PurplePanel title="Timezone & Phone">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Time Zone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        required
                        className={inputClass}
                      >
                        <option value="">Select</option>
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Tel Home</label>
                      <input
                        type="text"
                        value={telHome}
                        onChange={(e) => setTelHome(e.target.value)}
                        placeholder="(999) 999-9999"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Tel Mobile</label>
                      <input
                        type="text"
                        value={telMobile}
                        onChange={(e) => setTelMobile(e.target.value)}
                        placeholder="(999) 999-9999"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Tel Business</label>
                      <input
                        type="text"
                        value={telWork}
                        onChange={(e) => setTelWork(e.target.value)}
                        placeholder="(999) 999-9999"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </PurplePanel>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <ActionButton label="Cancel" variant="secondary" onClick={onClose} disabled={loading} />
              <ActionButton label="Save Changes" type="submit" loading={loading} />
            </div>
          </form>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            {tab === "notifications"
              ? "Notification preferences will be available when connected to the legacy profile API."
              : "Email history will be available when connected to the legacy profile API."}
            <div className="mt-4">
              <ActionButton label="Close" variant="secondary" onClick={onClose} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
