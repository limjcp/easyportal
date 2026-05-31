import { useState } from "react";
import { FaFileDownload } from "react-icons/fa";
import { Modal } from "../../shared/Modal";

type BoardApprovalExportModalProps = {
  open: boolean;
  onClose: () => void;
};

export function BoardApprovalExportModal({ open, onClose }: BoardApprovalExportModalProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleExport = () => {
    alert(
      fromDate && toDate
        ? `Export queued for ${fromDate} through ${toDate} (mock).`
        : "Export queued for all board approvals (mock)."
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export Board Approvals"
      icon={<FaFileDownload className="text-slate-600" />}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded bg-slate-700 px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Export
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-slate-600">
        Optionally limit the export to topics created within a date range.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          From
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm">
          To
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
      </div>
    </Modal>
  );
}
