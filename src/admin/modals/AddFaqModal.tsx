import { useState } from "react";
import { FaQuestionCircle } from "react-icons/fa";
import { Modal } from "../../shared/Modal";

type AddFaqModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (faq: { question: string; answer: string }) => void;
};

export function AddFaqModal({ open, onClose, onSubmit }: AddFaqModalProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (!question.trim() || !answer.trim()) {
      alert("Question and answer are required.");
      return;
    }
    onSubmit({ question: question.trim(), answer: answer.trim() });
    setQuestion("");
    setAnswer("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add FAQ"
      icon={<FaQuestionCircle className="text-[#3476ef]" />}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">Cancel</button>
          <button type="button" onClick={handleSubmit} className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white">Save</button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block text-sm">
          Question *
          <input value={question} onChange={(e) => setQuestion(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5" />
        </label>
        <label className="block text-sm">
          Answer *
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5" />
        </label>
      </div>
    </Modal>
  );
}
