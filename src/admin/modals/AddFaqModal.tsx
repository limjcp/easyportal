import { useCallback, useState } from "react";
import { FaQuestionCircle } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";

type AddFaqModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (faq: { question: string; answer: string }) => Promise<void>;
};

export function AddFaqModal({ open, onClose, onSubmit }: AddFaqModalProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const { run: handleSubmit, loading, error } = useAsyncAction(
    useCallback(async () => {
      if (!question.trim() || !answer.trim()) {
        alert("Question and answer are required.");
        return;
      }
      await onSubmit({ question: question.trim(), answer: answer.trim() });
      setQuestion("");
      setAnswer("");
      onClose();
    }, [question, answer, onSubmit, onClose]),
    { successMessage: "FAQ added.", showErrorToast: false }
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add FAQ"
      icon={<FaQuestionCircle className="text-[#3476ef]" />}
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
      <div className="space-y-3">
        <label className="block text-sm">
          Question *
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm">
          Answer *
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
      </div>
    </Modal>
  );
}
