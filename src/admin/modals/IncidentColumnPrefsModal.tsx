import { FaCheck } from "react-icons/fa";
import { Modal } from "../../shared/Modal";

type IncidentColumnPrefsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function IncidentColumnPrefsModal({ open, onClose }: IncidentColumnPrefsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Column Display Defaults"
      icon={<FaCheck className="text-[#3476ef]" />}
      footer={
        <button type="button" onClick={onClose} className="rounded bg-[#3476ef] px-4 py-2 text-sm text-white">
          Close
        </button>
      }
    >
      <p className="text-sm text-slate-600">
        Column visibility preferences are saved in your browser session in the legacy admin portal. In this
        demo, responsive column hiding is applied automatically on smaller screens (Unit, Location, Resolution
        Time, and Description may be hidden until you scroll horizontally).
      </p>
    </Modal>
  );
}
