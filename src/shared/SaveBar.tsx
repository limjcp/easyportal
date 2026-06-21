import { ActionButton } from "./ActionButton";
import { FormAlert } from "./FormAlert";

type SaveBarProps = {
  onSave: () => void;
  saved?: boolean;
  saving?: boolean;
  error?: string | null;
  label?: string;
  loadingLabel?: string;
};

export function SaveBar({
  onSave,
  saved = false,
  saving = false,
  error = null,
  label = "Save Settings",
  loadingLabel = "Saving…",
}: SaveBarProps) {
  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      {error ? <FormAlert message={error} className="mb-3" /> : null}
      <div className="flex items-center gap-3">
        <ActionButton
          label={label}
          loadingLabel={loadingLabel}
          loading={saving}
          onClick={onSave}
        />
        {saved && !saving ? (
          <span className="text-sm text-green-600">Saved successfully.</span>
        ) : null}
      </div>
    </div>
  );
}
