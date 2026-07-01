import { ActionButton } from "../../shared/ActionButton";
import { StatusBadge } from "../../admin/components/AdminBadges";
import { isVendorPaymentSettingsConfigured } from "../../shared/vendorPaymentUtils";
import { VendorInvoicePaymentSection } from "./VendorInvoicePaymentSection";
import type {
  CompanyBuilding,
  PurchaseOrder,
  Vendor,
  VendorInvoice,
  VendorPaymentSettings,
  VendorRoute,
} from "../../resident/data/types";

type VendorInvoicePanelProps = {
  po: PurchaseOrder;
  invoice?: VendorInvoice;
  vendor?: Vendor;
  building?: CompanyBuilding;
  paymentSettings?: VendorPaymentSettings;
  onNavigate?: (route: VendorRoute) => void;
  onConvert: () => void;
  onSubmitForPayment: () => void;
  submitting?: boolean;
};

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatHstRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function billingLinesFromInvoice(invoice: VendorInvoice): string[] {
  return [
    invoice.billingAddress,
    [invoice.billingCity, invoice.billingProvince, invoice.billingPostalCode]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);
}

export function VendorInvoicePanel({
  po,
  invoice,
  vendor,
  building,
  paymentSettings,
  onNavigate,
  onConvert,
  onSubmitForPayment,
  submitting = false,
}: VendorInvoicePanelProps) {
  if (po.status !== "accepted") return null;

  const paymentConfigured = isVendorPaymentSettingsConfigured(paymentSettings);

  if (!invoice) {
    return (
      <div className="mt-6 rounded border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Invoice</h3>
        <p className="mb-4 text-sm text-slate-600">
          This purchase order has been accepted. Convert it to an invoice to submit for SPARC
          payment.
        </p>

        {!paymentConfigured ? (
          <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              Payment information has not been configured. Please complete your Payment Settings
              before creating invoices.
            </p>
            {onNavigate ? (
              <button
                type="button"
                onClick={() => onNavigate({ page: "payment-settings" })}
                className="mt-2 rounded bg-[#0d9488] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0b7a70]"
              >
                Go to Payment Settings
              </button>
            ) : null}
          </div>
        ) : null}

        <ActionButton
          label="Convert to invoice"
          variant="primary"
          disabled={!paymentConfigured}
          onClick={onConvert}
        />
      </div>
    );
  }

  const billingLines = billingLinesFromInvoice(invoice);

  return (
    <div className="mt-6 rounded border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">Invoice {invoice.invoiceNumber}</h3>
        <StatusBadge status={invoice.status === "submitted" ? "Submitted" : "Draft"} />
      </div>

      <div className="overflow-hidden rounded border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            {invoice.logoUrl ? (
              <img
                src={invoice.logoUrl}
                alt={`${vendor?.companyName ?? "Vendor"} logo`}
                className="mb-3 h-16 max-w-[220px] object-contain"
              />
            ) : null}
            <p className="font-semibold text-slate-900">{vendor?.companyName ?? "Vendor"}</p>
            {vendor?.contactName ? <p>{vendor.contactName}</p> : null}
            {vendor?.email ? <p>{vendor.email}</p> : null}
            {billingLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {invoice.hstNumber ? (
              <p className="mt-2">
                <strong>HST #:</strong> {invoice.hstNumber}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-900">Bill to</p>
            <p>{building?.name ?? po.buildingId}</p>
            {building?.address ? (
              <p className="max-w-xs whitespace-pre-wrap">{building.address}</p>
            ) : null}
            <p className="mt-3">
              <strong>PO #:</strong> {po.poNumber}
            </p>
            <p>
              <strong>Invoice #:</strong> {invoice.invoiceNumber}
            </p>
            <p>
              <strong>Date:</strong> {invoice.createdAt.slice(0, 10)}
            </p>
          </div>
        </div>

        <table className="mb-4 w-full border border-slate-200 bg-white text-xs">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li, index) => (
              <tr key={`${li.description}-${index}`} className="border-t border-slate-100">
                <td className="px-3 py-2">{li.description}</td>
                <td className="px-3 py-2 text-right">{li.quantity}</td>
                <td className="px-3 py-2 text-right">{formatMoney(li.unitPrice)}</td>
                <td className="px-3 py-2 text-right">{formatMoney(li.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-1 text-right">
          <p>
            Subtotal: <strong>{formatMoney(invoice.subtotal)}</strong>
          </p>
          <p>
            HST ({formatHstRate(invoice.hstRate)}): <strong>{formatMoney(invoice.hstAmount)}</strong>
          </p>
          <p className="text-base font-semibold text-slate-900">
            Total: {formatMoney(invoice.total)}
          </p>
        </div>

        <VendorInvoicePaymentSection invoice={invoice} />

        {invoice.status === "submitted" && invoice.submittedAt ? (
          <p className="mt-4 text-xs text-slate-500">
            Submitted for payment on {invoice.submittedAt.slice(0, 10)}
            {invoice.sparcRecipientEmail ? ` to ${invoice.sparcRecipientEmail}` : ""}.
          </p>
        ) : null}
      </div>

      {invoice.status === "draft" ? (
        <div className="mt-4">
          <p className="mb-3 text-sm text-slate-600">
            Review the invoice above, then submit it to the building&apos;s SPARC bill email for
            payment processing.
          </p>
          <ActionButton
            label="Submit for payment"
            variant="success"
            loading={submitting}
            loadingLabel="Submitting…"
            onClick={onSubmitForPayment}
          />
        </div>
      ) : null}
    </div>
  );
}
