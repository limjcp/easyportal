import { useCallback, useState } from "react";
import { FaCommentDots } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";

type AddSuggestionModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { text: string; visibility: string; createdBy: string; unit: string }) => Promise<void>;
};

export function AddSuggestionModal({ open, onClose, onSubmit }: AddSuggestionModalProps) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState("Private (Admin & Author)");
  const [createdBy, setCreatedBy] = useState("Unit 10 - Carol Zinger");
  const [unit, setUnit] = useState("10");

  const { run: handleSubmit, loading, error } = useAsyncAction(
    useCallback(async () => {
      if (!text.trim()) {
        alert("Suggestion text is required.");
        return;
      }
      await onSubmit({ text: text.trim(), visibility, createdBy, unit });
      setText("");
      onClose();
    }, [text, visibility, createdBy, unit, onSubmit, onClose]),
    { successMessage: "Suggestion submitted.", showErrorToast: false }
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a new Suggestion"
      icon={<FaCommentDots className="text-[#89c64c]" />}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <ActionButton
            label="Submit"
            loadingLabel="Submitting…"
            loading={loading}
            variant="success"
            onClick={() => void handleSubmit()}
          />
        </>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
      <div className="space-y-3">
        <label className="block text-sm">
          Visibility
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          >
            <option>Private (Admin & Author)</option>
            <option>Private</option>
            <option>Public</option>
          </select>
        </label>
        <label className="block text-sm">
          Created By
          <input
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm">
          Suggestion *
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
    </Modal>
  );
}
