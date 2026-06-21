import { useCallback, useEffect, useRef, useState } from "react";
import { FaCamera, FaFolderOpen } from "react-icons/fa";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import {
  formatDisplayDate,
  getNextDueDate,
  isFireSafetyDue,
} from "../data/fireSafetyUtils";
import { residentRepo } from "../data/mockRepository";
import type { FireSafetySubmission } from "../data/types";

const inputClass =
  "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 [color-scheme:light]";

export function FireSafetyPlanPage() {
  const [unit, setUnit] = useState("102");
  const [submissions, setSubmissions] = useState<FireSafetySubmission[]>([]);
  const [latest, setLatest] = useState<FireSafetySubmission | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async (unitId: string) => {
    const [list, last] = await Promise.all([
      residentRepo.getFireSafetySubmissions(unitId),
      residentRepo.getLatestFireSafetySubmission(unitId),
    ]);
    setSubmissions(list);
    setLatest(last);
  };

  useEffect(() => {
    residentRepo.getUser().then((user) => {
      setUnit(user.unit);
      load(user.unit);
    });
  }, []);

  const due = isFireSafetyDue(latest?.uploadedAt ?? null);
  const nextDue = getNextDueDate(latest?.uploadedAt ?? null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    setSaved(false);
  };

  const { run: submitPhoto, loading: submitting, error, clearError, setError } = useAsyncAction(
    useCallback(async () => {
      if (!previewUrl) return;
      await residentRepo.submitFireSafetyPhoto({
        unit,
        photoDataUrl: previewUrl,
        notes: notes.trim() || undefined,
      });
      setPreviewUrl(null);
      setNotes("");
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load(unit);
    }, [notes, previewUrl, unit]),
    {
      successMessage: "Upload saved successfully.",
      errorMessage: "Unable to submit photo.",
      onSuccess: () => setSaved(true),
    }
  );

  const handleSubmit = async () => {
    clearError();
    if (!previewUrl) {
      setError("Please take or choose a photo first.");
      return;
    }
    setSaved(false);
    await submitPhoto();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-sm bg-white/95 p-4 shadow-lg sm:p-6">
        <ModuleMessageBanner moduleId="fireSafetyPlan" />

        <h2 className="mb-2 text-lg font-semibold text-slate-800">Annual Smoke Detector Verification</h2>
        <p className="mb-4 text-sm text-slate-600">
          Each year, photograph the date stamped on the underside of your unit&apos;s smoke detector. Ensure the
          date is clearly visible in the photo. Upload one photo per unit per year.
        </p>

        {due && (
          <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Annual upload due</p>
            {latest ? (
              <p className="mt-1">
                Last upload: {formatDisplayDate(latest.uploadedAt)}. Please submit a new photo by{" "}
                {formatDisplayDate(nextDue)}.
              </p>
            ) : (
              <p className="mt-1">No upload on file for unit {unit}. Please submit your first verification photo.</p>
            )}
          </div>
        )}

        {!due && latest && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-medium">You are up to date</p>
            <p className="mt-1">
              Last upload: {formatDisplayDate(latest.uploadedAt)}. Next upload due by{" "}
              {formatDisplayDate(nextDue)}.
            </p>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-3">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2d68cf]"
          >
            <FaCamera />
            Take Photo
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FaFolderOpen />
            Choose Photo
          </button>
        </div>

        {previewUrl && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-slate-600">Preview</p>
            <img
              src={previewUrl}
              alt="Smoke detector preview"
              className="max-h-64 max-w-full rounded border border-slate-200 object-contain"
            />
          </div>
        )}

        <label className="mb-4 flex max-w-lg flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Notes (optional)</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Date stamp visible on underside"
            className={inputClass}
          />
        </label>

        {error ? <FormAlert message={error} className="mb-4" /> : null}

        <div className="flex items-center gap-3">
          <ActionButton
            label="Submit Photo"
            loadingLabel="Uploading…"
            loading={submitting}
            disabled={!previewUrl}
            onClick={() => void handleSubmit()}
          />
          {saved && !submitting ? <span className="text-sm text-green-600">Upload saved successfully.</span> : null}
        </div>
      </div>

      <div className="rounded-sm bg-white/95 p-4 shadow-lg sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Upload History — Unit {unit}</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-500">No submissions yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="rounded border border-slate-200 p-3">
                <img
                  src={sub.photoDataUrl}
                  alt={`Submission ${sub.uploadedAt}`}
                  className="mb-2 h-32 w-full rounded object-cover"
                />
                <p className="text-sm font-medium text-slate-800">{formatDisplayDate(sub.uploadedAt)}</p>
                {sub.notes && <p className="mt-1 text-xs text-slate-500">{sub.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
