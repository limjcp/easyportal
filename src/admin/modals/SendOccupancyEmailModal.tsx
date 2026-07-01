import { useCallback, useEffect, useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { adminRepository } from "../data/adminRepository";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { Modal } from "../../shared/Modal";
import { useAsyncAction } from "../../shared/useAsyncAction";

type SendOccupancyEmailModalProps = {
  open: boolean;
  onClose: () => void;
  occupancyId: string;
  recipientEmail: string;
  recipientName?: string;
};

export function SendOccupancyEmailModal({
  open,
  onClose,
  occupancyId,
  recipientEmail,
  recipientName,
}: SendOccupancyEmailModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!open) return;
    setSubject("");
    setBody("");
  }, [open, occupancyId, recipientEmail]);

  const { run: sendEmail, loading: sending, error, clearError, setError } = useAsyncAction(
    useCallback(async () => {
      const result = await adminRepository.sendOccupancyEmail(
        occupancyId,
        subject.trim(),
        body.trim()
      );
      setSubject("");
      setBody("");
      onClose();
      return result;
    }, [body, occupancyId, onClose, subject]),
    {
      successMessage: (result) => result?.message ?? "Email sent.",
      onError: () => undefined,
      showErrorToast: false,
    }
  );

  const handleSend = async () => {
    clearError();
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }
    if (!body.trim()) {
      setError("Message is required.");
      return;
    }
    await sendEmail();
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send Email"
      icon={<FaEnvelope className="text-[#3476ef]" />}
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
          <ActionButton
            label="Send"
            loadingLabel="Sending…"
            loading={sending}
            onClick={() => void handleSend()}
          />
        </>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
      <div className="space-y-4 text-sm">
        {recipientName ? (
          <p className="text-slate-600">
            To: <span className="font-medium text-slate-800">{recipientName}</span>
          </p>
        ) : null}
        <label className="block space-y-1">
          <span className="text-xs uppercase text-slate-500">To</span>
          <input
            type="text"
            readOnly
            value={recipientEmail}
            className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase text-slate-500">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Email subject"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase text-slate-500">Message</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={8}
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Write your message…"
          />
        </label>
      </div>
    </Modal>
  );
}
