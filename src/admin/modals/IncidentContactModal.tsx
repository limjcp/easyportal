import { useCallback, useEffect, useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { Modal } from "../../shared/Modal";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import type { IncidentContactEmail } from "../../resident/data/types";

type IncidentContactModalProps = {
  open: boolean;
  contact: IncidentContactEmail | null;
  onClose: () => void;
  onSubmit: (email: string, status: "active" | "inactive") => Promise<void>;
};

export function IncidentContactModal({
  open,
  contact,
  onClose,
  onSubmit,
}: IncidentContactModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  useEffect(() => {
    if (contact) {
      setEmail(contact.email);
      setStatus(contact.status);
    } else {
      setEmail("");
      setStatus("active");
    }
  }, [contact, open]);

  const { run: handleSubmit, loading, error } = useAsyncAction(
    useCallback(async () => {
      if (!email.trim() || !email.includes("@")) {
        alert("A valid email address is required.");
        return;
      }
      await onSubmit(email.trim(), status);
      onClose();
    }, [email, status, onSubmit, onClose]),
    {
      successMessage: contact ? "Contact updated." : "Contact added.",
      showErrorToast: false,
    }
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contact ? "Edit Contact" : "Add a Contact"}
      icon={<FaEnvelope className="text-[#3476ef]" />}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <ActionButton label="Save" loadingLabel="Saving…" loading={loading} onClick={() => void handleSubmit()} />
        </>
      }
    >
      {error ? <FormAlert message={error} className="mb-3" /> : null}
      <div className="space-y-3">
        <label className="block text-sm">
          Email Address *
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
