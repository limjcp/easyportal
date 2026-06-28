const DISMISS_KEY = "profile-completion-dismissed";

export function isProfileCompletionBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DISMISS_KEY) === "1";
}

type ProfileCompletionBannerProps = {
  missingCount: number;
  onComplete: () => void;
  onDismiss: () => void;
};

export function ProfileCompletionBanner({
  missingCount,
  onComplete,
  onDismiss,
}: ProfileCompletionBannerProps) {
  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    onDismiss();
  };

  const fieldLabel = missingCount === 1 ? "detail" : "details";

  return (
    <div className="border-b border-amber-300/60 bg-gradient-to-r from-amber-50 to-sky-50 px-4 py-3 text-slate-800 shadow-sm sm:px-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm sm:text-base">
          Your building needs {missingCount} {fieldLabel} to keep your account up to date.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onComplete}
            className="rounded bg-[#3476ef] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 sm:text-sm"
          >
            Complete profile
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:text-sm"
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}
