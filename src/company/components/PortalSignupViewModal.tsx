import { Modal } from "../../shared/Modal";
import type { PortalSignupRequest } from "../../resident/data/types";

type PortalSignupViewModalProps = {
  open: boolean;
  detail: PortalSignupRequest | null;
  loading?: boolean;
  onClose: () => void;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export function PortalSignupViewModal({ open, detail, loading, onClose }: PortalSignupViewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Portal Registration Request" size="md">
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : detail ? (
        <dl className="space-y-4">
          <Field label="Community" value={detail.buildingLabel} />
          <Field label="First name" value={detail.firstName} />
          <Field label="Unit" value={detail.unitNumber} />
          <Field label="Corporation #" value={detail.corpNumber} />
          <Field label="City" value={detail.city} />
          <Field label="Email" value={detail.email} />
          <Field label="Resident type" value={detail.residentType} />
          <Field label="Status" value={detail.status} />
          <Field
            label="Submitted"
            value={new Date(detail.submittedAt).toLocaleString()}
          />
          {detail.quickbooksMatched && (
            <div className="border-t border-slate-200 pt-4">
              <span className="inline-flex rounded bg-[#2ca01c]/10 px-2 py-1 text-xs font-medium text-[#2ca01c]">
                Matched via QuickBooks
              </span>
              {detail.quickbooksBalance && (
                <p className="mt-2 text-sm text-slate-700">
                  Account balance: <span className="font-medium">{detail.quickbooksBalance}</span>
                </p>
              )}
            </div>
          )}
        </dl>
      ) : (
        <p className="text-sm text-slate-500">Registration request not found.</p>
      )}
    </Modal>
  );
}
