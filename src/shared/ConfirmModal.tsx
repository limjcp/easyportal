import { Modal } from "./Modal";
import { ActionButton } from "./ActionButton";

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  variant?: "default" | "danger";
};

export function ConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  variant = "default",
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <div className="flex w-full justify-center gap-3">
          <ActionButton
            label={confirmLabel}
            loading={loading}
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          />
          <ActionButton label={cancelLabel} variant="secondary" onClick={onClose} disabled={loading} />
        </div>
      }
    >
      <p className="whitespace-pre-line text-center text-slate-600">{message}</p>
    </Modal>
  );
}
