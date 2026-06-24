import { FaExclamationTriangle } from "react-icons/fa";
import { ActionButton } from "./ActionButton";
import { Modal } from "./Modal";
import { EMERGENCY_SEVERITY_NOTICE } from "./serviceRequestPresets";

function EmergencyNoticeContent() {
  return (
    <div className="space-y-3 text-sm text-slate-700">
      <p>
        For Emergencies ONLY (Fire, Flood or Breach of Security) Call the emergency hotline{" "}
        <a href="tel:18442526636" className="font-semibold text-[#3476ef] hover:underline">
          1-844-25-CONDO (26636)
        </a>{" "}
        and press #3
      </p>
      <p>{EMERGENCY_SEVERITY_NOTICE.paragraphs[1]}</p>
      <p>{EMERGENCY_SEVERITY_NOTICE.paragraphs[2]}</p>
    </div>
  );
}

export function EmergencySeverityInlineNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="alert"
      className={`rounded border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950 ${className}`}
    >
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <FaExclamationTriangle className="shrink-0 text-amber-600" aria-hidden />
        {EMERGENCY_SEVERITY_NOTICE.title}
      </div>
      <EmergencyNoticeContent />
    </div>
  );
}

type EmergencySeverityNoticeModalProps = {
  open: boolean;
  onClose: () => void;
};

export function EmergencySeverityNoticeModal({ open, onClose }: EmergencySeverityNoticeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={EMERGENCY_SEVERITY_NOTICE.title}
      icon={<FaExclamationTriangle className="text-amber-600" />}
      size="md"
      footer={
        <div className="ml-auto">
          <ActionButton label="OK" onClick={onClose} />
        </div>
      }
    >
      <EmergencyNoticeContent />
    </Modal>
  );
}
