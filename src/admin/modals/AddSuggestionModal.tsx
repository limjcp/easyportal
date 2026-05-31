import { useState } from "react";
import { FaCommentDots } from "react-icons/fa";
import { Modal } from "../../shared/Modal";

type AddSuggestionModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { text: string; visibility: string; createdBy: string; unit: string }) => void;
};

export function AddSuggestionModal({ open, onClose, onSubmit }: AddSuggestionModalProps) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState("Private (Admin & Author)");
  const [createdBy, setCreatedBy] = useState("Unit 10 - Carol Zinger");
  const [unit, setUnit] = useState("10");

  const handleSubmit = () => {
    if (!text.trim()) {
      alert("Suggestion text is required.");
      return;
    }
    onSubmit({ text: text.trim(), visibility, createdBy, unit });
    setText("");
    onClose();
  };

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
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-[#89c64c] px-4 py-2 text-sm text-white"
          >
            Submit
          </button>
        </>
      }
    >
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
