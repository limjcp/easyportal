import { Modal } from "../../shared/Modal";
import type { MasterReportRow, PurchaseOrder } from "../../resident/data/types";

type ServiceRequestViewModalProps = {
  open: boolean;
  row: MasterReportRow | null;
  onClose: () => void;
  onViewRelated?: (unit: string, owner: string) => void;
  relatedPurchaseOrders?: PurchaseOrder[];
  onGeneratePO?: (row: MasterReportRow) => void;
};

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm text-slate-800">{value || "—"}</p>
    </div>
  );
}

export function ServiceRequestViewModal({
  open,
  row,
  onClose,
  onViewRelated,
  relatedPurchaseOrders = [],
  onGeneratePO,
}: ServiceRequestViewModalProps) {
  if (!open || !row) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Service Request ${row.id}`} size="lg">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Community" value={row.buildingLabel} />
        <Field label="Date" value={row.date} />
        <Field label="Status" value={row.status} />
        <Field label="Severity" value={row.severity} />
        <Field label="Owner" value={row.unit} />
        <Field label="Owner Name" value={row.owner} />
      </div>
      <div className="mt-3">
        <Field label="Description" value={row.title} />
      </div>
      <div className="mt-4 rounded border border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">Purchase Orders</p>
          {onGeneratePO && (
            <button
              type="button"
              onClick={() => onGeneratePO(row)}
              className="rounded bg-[#3476ef] px-3 py-1.5 text-xs text-white hover:bg-[#2d68cf]"
            >
              Generate PO
            </button>
          )}
        </div>
        {relatedPurchaseOrders.length === 0 ? (
          <p className="text-sm text-slate-500">No purchase orders linked to this request yet.</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-700">
            {relatedPurchaseOrders.map((po) => (
              <li key={po.id} className="rounded bg-slate-50 px-2 py-1">
                {po.poNumber} - {po.status} - {po.createdAt}
              </li>
            ))}
          </ul>
        )}
      </div>
      {onViewRelated && row.unit && row.owner && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => onViewRelated(row.unit!, row.owner!)}
            className="text-sm font-medium text-[#3476ef] hover:underline"
          >
            View all requests for this owner and owner name
          </button>
        </div>
      )}
    </Modal>
  );
}
