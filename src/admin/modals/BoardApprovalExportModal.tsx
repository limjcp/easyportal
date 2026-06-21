import { useState } from "react";
import { FaFileDownload } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { downloadCsv } from "../../shared/exportCsv";
import type { BoardApproval } from "../../resident/data/types";

type BoardApprovalExportModalProps = {
  open: boolean;
  onClose: () => void;
  items: BoardApproval[];
};

export function BoardApprovalExportModal({ open, onClose, items }: BoardApprovalExportModalProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleExport = () => {
    const filtered = items.filter((item) => {
      if (!fromDate && !toDate) return true;
      const created = item.created?.slice(0, 10) ?? "";
      if (fromDate && created < fromDate) return false;
      if (toDate && created > toDate) return false;
      return true;
    });

    downloadCsv(
      "board-approvals.csv",
      ["Title", "Status", "Created", "Closed", "Vendor", "Type", "Amount", "Approved", "Disapproved"],
      filtered.map((item) => [
        item.title,
        item.status,
        item.created ?? "",
        item.closed ?? "",
        item.vendor ?? "",
        item.type ?? "",
        item.amount ?? "",
        String(item.approvedVotes ?? ""),
        String(item.disapprovedVotes ?? ""),
      ])
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
