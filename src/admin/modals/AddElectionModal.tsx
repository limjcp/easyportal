import { useCallback, useState } from "react";
import { FaVoteYea } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";

type AddElectionModalProps = {
  open: boolean;
  onClose: () => void;
  onContinue: (title: string) => Promise<void>;
};

export function AddElectionModal({ open, onClose, onContinue }: AddElectionModalProps) {
  const [title, setTitle] = useState("");

  const { run: handleContinue, loading, error } = useAsyncAction(
    useCallback(async () => {
      if (!title.trim()) {
        alert("Election title is required.");
        return;
      }
      await onContinue(title.trim());
      setTitle("");
      onClose();
    }, [title, onContinue, onClose]),
    { showSuccessToast: false, showErrorToast: false }
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a new election"
      icon={<FaVoteYea className="text-[#3476ef]" />}
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
          <ActionButton
            label="Continue"
            loadingLabel="Continuing…"
            loading={loading}
            onClick={() => void handleContinue()}
          />
        </>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
      <label className="block text-sm font-medium text-slate-700">
        Election Title <span className="text-red-500">*</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 2026 Annual Board Election"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
        />
      </label>
    </Modal>
  );
}
