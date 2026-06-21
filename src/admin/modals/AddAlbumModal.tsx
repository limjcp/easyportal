import { useCallback, useState } from "react";
import { FaImage } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";

type AddAlbumModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
};

export function AddAlbumModal({ open, onClose, onSubmit }: AddAlbumModalProps) {
  const [title, setTitle] = useState("");

  const { run: handleSubmit, loading, error } = useAsyncAction(
    useCallback(async () => {
      if (!title.trim()) {
        alert("Album title is required.");
        return;
      }
      await onSubmit(title.trim());
      setTitle("");
      onClose();
    }, [title, onSubmit, onClose]),
    { successMessage: "Album created.", showErrorToast: false }
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Album"
      icon={<FaImage className="text-[#3476ef]" />}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <ActionButton label="Save" loadingLabel="Saving…" loading={loading} onClick={() => void handleSubmit()} />
        </>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
      <label className="block text-sm">
        Album Title *
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
        />
      </label>
    </Modal>
  );
}
