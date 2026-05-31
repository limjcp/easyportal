import { useState } from "react";
import { Modal } from "../../shared/Modal";

type DeclinePurchaseOrderModalProps = {
  open: boolean;
  poNumber: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function DeclinePurchaseOrderModal({
  open,
  poNumber,
  onClose,
  onConfirm,
}: DeclinePurchaseOrderModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Decline ${poNumber}`}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded bg-red-600 px-4 py-2 text-sm text-white"
          >
            Decline order
          </button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-slate-600">
        Optionally provide a reason for declining this purchase order. The property management
        company will be notified.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        placeholder="Reason for decline (optional)"
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
      />
    </Modal>
  );
}
