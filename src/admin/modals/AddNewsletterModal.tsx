import { useState } from "react";
import { FaArrowCircleRight, FaFileAlt } from "react-icons/fa";
import { Modal } from "../../shared/Modal";

type AddNewsletterModalProps = {
  open: boolean;
  onClose: () => void;
  onContinue: (title: string) => void;
};

export function AddNewsletterModal({ open, onClose, onContinue }: AddNewsletterModalProps) {
  const [title, setTitle] = useState("");

  const handleContinue = () => {
    if (!title.trim()) {
      alert("Title is required.");
      return;
    }
    onContinue(title.trim());
    setTitle("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a new Newsletter"
      icon={<FaFileAlt className="text-[#3476ef]" />}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white"
          >
            Continue
            <FaArrowCircleRight />
          </button>
        </>
      }
    >
      <label className="block text-sm font-medium text-slate-700">
        Title <span className="text-red-500">*</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
        />
      </label>
    </Modal>
  );
}
