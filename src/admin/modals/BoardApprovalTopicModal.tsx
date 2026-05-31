import { useState } from "react";
import { FaUsers } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import type { CreateBoardApprovalInput } from "../../resident/data/types";

type BoardApprovalTopicModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateBoardApprovalInput) => void;
};

export function BoardApprovalTopicModal({ open, onClose, onSubmit }: BoardApprovalTopicModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setVendor("");
    setType("");
    setAmount("");
    setItems("");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("Title is required.");
      return;
    }
    if (!description.trim()) {
      alert("Description is required.");
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      vendor: vendor.trim() || undefined,
      type: type.trim() || undefined,
      amount: amount.trim() || undefined,
      items: items.trim() || undefined,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Begin A Topic"
      icon={<FaUsers className="text-[#7D5DA7]" />}
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded border border-slate-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-[#7D5DA7] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Create Topic
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block text-sm">
          Title *
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm">
          Description *
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Vendor
            <input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Type
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Amount
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Items
            <input
              value={items}
              onChange={(e) => setItems(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            />
          </label>
        </div>
      </div>
    </Modal>
  );
}
