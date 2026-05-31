import { useState } from "react";
import { FaCertificate, FaPaperPlane } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import type { CreateStatusCertificateInput } from "../data/types";

const CERTIFICATE_TYPES = [
  "Status Certificate",
  "Estoppel Certificate",
  "Information Certificate",
  "Other",
] as const;

type StatusCertificateModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateStatusCertificateInput) => Promise<void>;
};

export function StatusCertificateModal({ open, onClose, onSubmit }: StatusCertificateModalProps) {
  const [certificateType, setCertificateType] = useState<string>(CERTIFICATE_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [rushProcessing, setRushProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!notes.trim()) {
      alert("Please provide details for your certificate request.");
      return;
    }
    setSubmitting(true);
    await onSubmit({ certificateType, notes: notes.trim(), rushProcessing });
    setSubmitting(false);
    setNotes("");
    setRushProcessing(false);
    setCertificateType(CERTIFICATE_TYPES[0]);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a Status Certificate"
      icon={<FaCertificate className="text-[#3476ef]" />}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf] disabled:opacity-50"
          >
            Submit Request
            <FaPaperPlane />
          </button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <label className="block">
          <span className="font-medium text-slate-700">Certificate type *</span>
          <select
            value={certificateType}
            onChange={(e) => setCertificateType(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          >
            {CERTIFICATE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-medium text-slate-700">Unit</span>
          <input
            type="text"
            readOnly
            value="102"
            className="mt-1 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="font-medium text-slate-700">Details / purpose *</span>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Describe what you need the certificate for (e.g. sale, refinance, lawyer request)"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rushProcessing}
            onChange={(e) => setRushProcessing(e.target.checked)}
          />
          <span className="text-slate-700">Rush processing (additional fees may apply)</span>
        </label>
        <p className="text-xs text-slate-500">
          Your request will be reviewed by property management. You will be notified when the certificate is ready.
        </p>
      </div>
    </Modal>
  );
}
