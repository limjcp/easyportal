type SaveBarProps = {
  onSave: () => void;
  saved: boolean;
  saving?: boolean;
};

export function SaveBar({ onSave, saved, saving }: SaveBarProps) {
  return (
    <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
      {saved && <span className="text-sm text-green-600">Saved successfully.</span>}
    </div>
  );
}
