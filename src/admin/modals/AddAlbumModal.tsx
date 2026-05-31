import { useState } from "react";
import { FaImage } from "react-icons/fa";
import { Modal } from "../../shared/Modal";

type AddAlbumModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
};

export function AddAlbumModal({ open, onClose, onSubmit }: AddAlbumModalProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("Album title is required.");
      return;
    }
    onSubmit(title.trim());
    setTitle("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Album"
      icon={<FaImage className="text-[#3476ef]" />}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">Cancel</button>
          <button type="button" onClick={handleSubmit} className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white">Save</button>
        </>
      }
    >
      <label className="block text-sm">
        Album Title *
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5" />
      </label>
    </Modal>
  );
}
