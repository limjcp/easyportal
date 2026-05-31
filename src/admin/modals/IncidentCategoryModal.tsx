import { useEffect, useState } from "react";
import { FaList } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import type { IncidentReportCategory } from "../../resident/data/types";

type IncidentCategoryModalProps = {
  open: boolean;
  category: IncidentReportCategory | null;
  onClose: () => void;
  onSubmit: (name: string, status: "active" | "inactive") => void;
};

export function IncidentCategoryModal({
  open,
  category,
  onClose,
  onSubmit,
}: IncidentCategoryModalProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  useEffect(() => {
    if (category) {
      setName(category.name);
      setStatus(category.status);
    } else {
      setName("");
      setStatus("active");
    }
  }, [category, open]);

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("Category name is required.");
      return;
    }
    onSubmit(name.trim(), status);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? "Edit Category" : "Add a Category"}
      icon={<FaList className="text-red-600" />}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="rounded bg-red-600 px-4 py-2 text-sm text-white">
            Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block text-sm">
          Category *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
    </Modal>
  );
}
