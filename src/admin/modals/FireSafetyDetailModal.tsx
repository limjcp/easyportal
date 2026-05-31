import { Modal } from "../../shared/Modal";
import { formatDisplayDate } from "../../resident/data/fireSafetyUtils";
import type { FireSafetySubmission } from "../../resident/data/types";

type FireSafetyDetailModalProps = {
  open: boolean;
  submission: FireSafetySubmission | null;
  onClose: () => void;
};

export function FireSafetyDetailModal({ open, submission, onClose }: FireSafetyDetailModalProps) {
  if (!submission) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Fire Safety Upload — Unit ${submission.unit}`} size="lg">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs text-slate-500">Upload date</p>
            <p className="font-medium text-slate-800">{formatDisplayDate(submission.uploadedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Unit</p>
            <p className="font-medium text-slate-800">{submission.unit}</p>
          </div>
        </div>
        {submission.notes && (
          <div>
            <p className="text-xs text-slate-500">Resident notes</p>
            <p className="text-sm text-slate-700">{submission.notes}</p>
          </div>
        )}
        <div>
          <p className="mb-2 text-xs text-slate-500">Smoke detector photo</p>
          <img
            src={submission.photoDataUrl}
            alt={`Fire safety upload unit ${submission.unit}`}
            className="max-h-[min(60vh,480px)] w-full rounded border border-slate-200 object-contain"
          />
        </div>
      </div>
    </Modal>
  );
}
