import { useCallback, useState } from "react";
import { FaCommentDots } from "react-icons/fa";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { Modal } from "../../shared/Modal";
import { SectionHeader } from "../../shared/SectionHeader";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { useAsyncAction } from "../../shared/useAsyncAction";

type SuggestionModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
};

export function SuggestionModal({ open, onClose, onSubmit }: SuggestionModalProps) {
  const [text, setText] = useState("");

  const { run: submitSuggestion, loading: submitting, error, clearError, setError } = useAsyncAction(
    useCallback(async () => {
      await onSubmit(text.trim());
      setText("");
      onClose();
    }, [onClose, onSubmit, text]),
    {
      successMessage: "Suggestion submitted.",
      errorMessage: "Failed to submit suggestion.",
    }
  );

  const handleSubmit = async () => {
    clearError();
    if (!text.trim()) {
      setError("Please enter a suggestion.");
      return;
    }
    await submitSuggestion();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Make a suggestion"
      icon={<FaCommentDots className="text-[#3476ef]" />}
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <ActionButton
            label="Submit"
            loadingLabel="Submitting…"
            loading={submitting}
            onClick={() => void handleSubmit()}
          />
        </>
      }
    >
      <SectionHeader title="Suggestion" />
      {error ? <FormAlert message={error} className="mt-3" /> : null}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Make a suggestion to property management or the board..."
        className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <UploadCol title="Image (5mb Max)" />
        <UploadCol title="Attachment (5mb Max)" />
      </div>
    </Modal>
  );
}

function UploadCol({ title }: { title: string }) {
  return (
    <div>
      <SectionHeader title={title} />
      <div className="mt-2">
        <FileUploadZone />
      </div>
    </div>
  );
}
