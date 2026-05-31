import { useState } from "react";
import { FaFileAlt } from "react-icons/fa";
import { Modal } from "../../shared/Modal";

type NewsletterTemplateModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function NewsletterTemplateModal({ open, onClose, onSaved }: NewsletterTemplateModalProps) {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      alert("Template name is required.");
      return;
    }
    onSaved?.();
    setName("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a New Template"
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
            onClick={handleSave}
            className="rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white"
          >
            Save Template
          </button>
        </>
      }
    >
      <label className="block text-sm font-medium text-slate-700">
        Template name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. News & Notices with MVP Logo"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <p className="mt-3 text-xs text-slate-500">
        Template content editing will connect to the legacy template store when a backend is available.
      </p>
    </Modal>
  );
}