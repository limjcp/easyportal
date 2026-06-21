import { useEffect, useState } from "react";
import type { CookieConsentPreferences } from "./cookieConsent";

type CookieConsentBannerProps = {
  preferences: CookieConsentPreferences | null;
  hasDecision: boolean;
  showPreferences: boolean;
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  onSavePreferences: (analytics: boolean, advertising: boolean) => void;
  onOpenPreferences: () => void;
  onClosePreferences: () => void;
};

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className={`flex items-start justify-between gap-4 ${disabled ? "opacity-80" : ""}`}>
      <span className="text-sm text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#0078c8] disabled:cursor-not-allowed"
      />
    </label>
  );
}

export function CookieConsentBanner({
  preferences,
  hasDecision,
  showPreferences,
  onAcceptAll,
  onRejectOptional,
  onSavePreferences,
  onOpenPreferences,
  onClosePreferences,
}: CookieConsentBannerProps) {
  const [analytics, setAnalytics] = useState(preferences?.analytics ?? false);
  const [advertising, setAdvertising] = useState(preferences?.advertising ?? false);

  useEffect(() => {
    setAnalytics(preferences?.analytics ?? false);
    setAdvertising(preferences?.advertising ?? false);
  }, [preferences, showPreferences]);

  const bannerVisible = !hasDecision || showPreferences;

  if (!bannerVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[200] sm:left-auto sm:max-w-lg">
      <div className="rounded border border-slate-200 bg-white p-4 shadow-xl">
        <h2 className="text-sm font-semibold text-slate-900">
          {showPreferences && hasDecision ? "Cookie preferences" : "We use cookies"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Necessary cookies keep the site secure and let you sign in. Optional cookies help us measure
          site usage or show ads. You can change these anytime.
        </p>

        {showPreferences && (
          <div className="mt-4 space-y-3 rounded border border-slate-100 bg-slate-50 p-3">
            <Toggle
              checked
              disabled
              label="Necessary — session, security, consent storage, and reCAPTCHA fraud prevention (always on)"
            />
            <Toggle
              checked={analytics}
              onChange={setAnalytics}
              label="Analytics — website usage measurement (optional)"
            />
            <Toggle
              checked={advertising}
              onChange={setAdvertising}
              label="Advertising — not currently used (optional)"
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <a
            href="/privacy-policy"
            className="mr-auto text-xs text-[#0078c8] hover:underline"
            onClick={(e) => {
              if (typeof window !== "undefined" && window.location.pathname !== "/privacy-policy") {
                return;
              }
              e.preventDefault();
            }}
          >
            Privacy policy
          </a>
          {!showPreferences ? (
            <>
              <button
                type="button"
                className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={onOpenPreferences}
              >
                Customize
              </button>
              <button
                type="button"
                className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={onRejectOptional}
              >
                Reject optional
              </button>
              <button
                type="button"
                className="rounded bg-[#0078c8] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#006bb3]"
                onClick={onAcceptAll}
              >
                Accept all
              </button>
            </>
          ) : (
            <>
              {hasDecision && (
                <button
                  type="button"
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  onClick={onClosePreferences}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="rounded bg-[#0078c8] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#006bb3]"
                onClick={() => onSavePreferences(analytics, advertising)}
              >
                Save preferences
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
