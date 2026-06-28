import { StatusBadge } from "../../admin/components/AdminBadges";
import { VENDOR_PAYMENT_METHOD_OPTIONS } from "../../shared/vendorPaymentUtils";
import type { VendorPreferredPaymentMethod } from "../../resident/data/types";

export type VendorPaymentMethodFormValues = {
  preferredPaymentMethod: VendorPreferredPaymentMethod;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankInstitutionNumber: string;
  bankTransitNumber: string;
  bankSwiftBic: string;
  interacRecipientName: string;
  interacEmail: string;
};

type VendorPaymentMethodFieldsProps = {
  values: VendorPaymentMethodFormValues;
  onChange: <K extends keyof VendorPaymentMethodFormValues>(
    field: K,
    value: VendorPaymentMethodFormValues[K]
  ) => void;
  disabled?: boolean;
  showSparcpayPlaceholder?: boolean;
};

const inputClass =
  "mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function VendorPaymentMethodFields({
  values,
  onChange,
  disabled = false,
  showSparcpayPlaceholder = true,
}: VendorPaymentMethodFieldsProps) {
  const method = values.preferredPaymentMethod;
  const sparcpaySelected = method === "sparcpay";

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Preferred Payment Method</span>
        <select
          value={method}
          onChange={(e) =>
            onChange("preferredPaymentMethod", e.target.value as VendorPreferredPaymentMethod)
          }
          disabled={disabled}
          className={inputClass}
        >
          {VENDOR_PAYMENT_METHOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {method === "bank_transfer" && (
        <div className="space-y-3 rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bank transfer details
          </p>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Bank name *</span>
            <input
              value={values.bankName}
              onChange={(e) => onChange("bankName", e.target.value)}
              disabled={disabled}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Account name *</span>
            <input
              value={values.bankAccountName}
              onChange={(e) => onChange("bankAccountName", e.target.value)}
              disabled={disabled}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Account number *</span>
            <input
              value={values.bankAccountNumber}
              onChange={(e) => onChange("bankAccountNumber", e.target.value)}
              disabled={disabled}
              className={inputClass}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Institution number</span>
              <input
                value={values.bankInstitutionNumber}
                onChange={(e) => onChange("bankInstitutionNumber", e.target.value)}
                disabled={disabled}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Transit number</span>
              <input
                value={values.bankTransitNumber}
                onChange={(e) => onChange("bankTransitNumber", e.target.value)}
                disabled={disabled}
                className={inputClass}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">SWIFT / BIC</span>
            <input
              value={values.bankSwiftBic}
              onChange={(e) => onChange("bankSwiftBic", e.target.value)}
              disabled={disabled}
              className={inputClass}
            />
          </label>
        </div>
      )}

      {method === "interac_etransfer" && (
        <div className="space-y-3 rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Interac e-Transfer details
          </p>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Recipient name *</span>
            <input
              value={values.interacRecipientName}
              onChange={(e) => onChange("interacRecipientName", e.target.value)}
              disabled={disabled}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Interac email address *</span>
            <input
              type="email"
              value={values.interacEmail}
              onChange={(e) => onChange("interacEmail", e.target.value)}
              disabled={disabled}
              className={inputClass}
            />
          </label>
        </div>
      )}

      {sparcpaySelected && showSparcpayPlaceholder && (
        <div className="space-y-3 rounded border border-dashed border-slate-300 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-700">SPARCPay</p>
            <StatusBadge status="Coming Soon" />
          </div>
          <p className="text-sm text-slate-600">
            SPARCPay payments are not available yet. Once implemented, invoices will be payable
            directly through SPARCPay.
          </p>
          <div className="space-y-3 opacity-60">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Merchant ID</span>
              <input disabled value="" placeholder="Coming soon" className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Pay with SPARCPay</span>
              <input disabled value="" placeholder="Coming soon" className={inputClass} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
