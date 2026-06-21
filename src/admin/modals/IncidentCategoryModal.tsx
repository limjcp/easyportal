import { useCallback, useEffect, useState } from "react";
import { FaList } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import type { IncidentReportCategory } from "../../resident/data/types";

type IncidentCategoryModalProps = {
  open: boolean;
  category: IncidentReportCategory | null;
  onClose: () => void;
  onSubmit: (name: string, status: "active" | "inactive") => Promise<void>;
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

  const { run: handleSubmit, loading, error } = useAsyncAction(
    useCallback(async () => {
      if (!name.trim()) {
        alert("Category name is required.");
        return;
      }
      await onSubmit(name.trim(), status);
      onClose();
    }, [name, status, onSubmit, onClose]),
    {
      successMessage: category ? "Category updated." : "Category added.",
      showErrorToast: false,
    }
  );

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
          <ActionButton
            label="Save"
            loadingLabel="Saving…"
            loading={loading}
            variant="danger"
            onClick={() => void handleSubmit()}
          />
        </>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
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
