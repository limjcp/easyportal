import { useState } from "react";
import { FaCommentDots, FaPaperPlane } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { SectionHeader } from "../../shared/SectionHeader";
import { FileUploadZone } from "../../shared/FileUploadZone";

type SuggestionModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
};

export function SuggestionModal({ open, onClose, onSubmit }: SuggestionModalProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert("Please enter a suggestion.");
      return;
    }
    setSubmitting(true);
    await onSubmit(text);
    setSubmitting(false);
    setText("");
    onClose();
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
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf] disabled:opacity-50"
          >
            Submit
            <FaPaperPlane />
          </button>
        </>
      }
    >
      <SectionHeader title="Suggestion" />
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
