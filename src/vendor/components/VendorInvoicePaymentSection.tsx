import {
  getVendorPaymentMethodLabel,
  paymentDetailsFromRecord,
} from "../../shared/vendorPaymentUtils";
import type { VendorInvoice } from "../../resident/data/types";
import { StatusBadge } from "../../admin/components/AdminBadges";

type VendorInvoicePaymentSectionProps = {
  invoice: Pick<VendorInvoice, "preferredPaymentMethod" | "paymentDetails">;
  className?: string;
};

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <p>
      <strong>{label}:</strong> {value}
    </p>
  );
}

export function VendorInvoicePaymentSection({ invoice, className = "" }: VendorInvoicePaymentSectionProps) {
  const method = invoice.preferredPaymentMethod;
  const details = paymentDetailsFromRecord(method, invoice.paymentDetails);

  return (
    <div className={`mt-6 border-t border-slate-200 pt-4 ${className}`.trim()}>
      <h4 className="mb-3 text-sm font-semibold text-slate-800">Payment Information</h4>
      <p className="mb-2 text-sm text-slate-700">
        <strong>Preferred Payment Method:</strong> {getVendorPaymentMethodLabel(method)}
      </p>

      {method === "bank_transfer" && (
        <div className="space-y-1 text-sm text-slate-700">
          <DetailRow label="Bank" value={details.bankName} />
          <DetailRow label="Account Name" value={details.accountName} />
          <DetailRow label="Account Number" value={details.accountNumber} />
          <DetailRow label="Institution" value={details.institutionNumber} />
          <DetailRow label="Transit" value={details.transitNumber} />
          <DetailRow label="SWIFT" value={details.swiftBic} />
        </div>
      )}

      {method === "interac_etransfer" && (
        <div className="space-y-1 text-sm text-slate-700">
          <DetailRow label="Recipient" value={details.recipientName} />
          <DetailRow label="Email" value={details.email} />
        </div>
      )}

      {method === "sparcpay" && (
        <div className="space-y-2 text-sm text-slate-700">
          <StatusBadge status="Coming Soon" />
          <p>Payments through SPARCPay are not yet available.</p>
        </div>
      )}
    </div>
  );
}
