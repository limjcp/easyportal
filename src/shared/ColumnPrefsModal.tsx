import { useEffect, useState } from "react";
import { Modal } from "./Modal";

type ColumnOption = {
  key: string;
  label: string;
};

type ColumnPrefsModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: ColumnOption[];
  visibleKeys: Set<string>;
  onSave: (visibleKeys: string[]) => void;
};

export function ColumnPrefsModal({
  open,
  onClose,
  title,
  columns,
  visibleKeys,
  onSave,
}: ColumnPrefsModalProps) {
  const [draft, setDraft] = useState<Set<string>>(visibleKeys);

  useEffect(() => {
    if (open) setDraft(new Set(visibleKeys));
  }, [open, visibleKeys]);

  const toggle = (key: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-[#3476ef] px-3 py-2 text-sm text-white"
            onClick={() => {
              onSave([...draft]);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-2">
        {columns.map((column) => (
          <label key={column.key} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.has(column.key)}
              onChange={() => toggle(column.key)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span>{column.label}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}
