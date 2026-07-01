import type { VendorPaymentSettings, VendorPreferredPaymentMethod } from "../resident/data/types";

export const VENDOR_PAYMENT_METHOD_OPTIONS: {
  value: VendorPreferredPaymentMethod;
  label: string;
  comingSoon?: boolean;
}[] = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "interac_etransfer", label: "Interac e-Transfer" },
  { value: "sparcpay", label: "SPARCPay (Coming Soon)", comingSoon: true },
];

export function getVendorPaymentMethodLabel(method: VendorPreferredPaymentMethod): string {
  const option = VENDOR_PAYMENT_METHOD_OPTIONS.find((o) => o.value === method);
  if (!option) return method;
  return option.comingSoon ? "SPARCPay" : option.label;
}

export function validateVendorPaymentSettings(
  settings: Pick<
    VendorPaymentSettings,
    | "preferredPaymentMethod"
    | "bankName"
    | "bankAccountName"
    | "bankAccountNumber"
    | "interacRecipientName"
    | "interacEmail"
  >
): string | null {
  if (settings.preferredPaymentMethod === "bank_transfer") {
    if (!settings.bankName.trim()) return "Bank name is required.";
    if (!settings.bankAccountName.trim()) return "Account name is required.";
    if (!settings.bankAccountNumber.trim()) return "Account number is required.";
  }

  if (settings.preferredPaymentMethod === "interac_etransfer") {
    if (!settings.interacRecipientName.trim()) return "Recipient name is required.";
    if (!settings.interacEmail.trim()) return "Interac email address is required.";
    const email = settings.interacEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid Interac email address.";
    }
  }

  return null;
}

export function isVendorPaymentSettingsConfigured(
  settings: VendorPaymentSettings | undefined | null
): boolean {
  if (!settings) return false;
  return validateVendorPaymentSettings(settings) === null;
}

export function buildInvoicePaymentDetails(settings: VendorPaymentSettings): Record<string, string> {
  if (settings.preferredPaymentMethod === "bank_transfer") {
    return {
      bankName: settings.bankName.trim(),
      accountName: settings.bankAccountName.trim(),
      accountNumber: settings.bankAccountNumber.trim(),
      institutionNumber: settings.bankInstitutionNumber.trim(),
      transitNumber: settings.bankTransitNumber.trim(),
      swiftBic: settings.bankSwiftBic.trim(),
    };
  }
  if (settings.preferredPaymentMethod === "interac_etransfer") {
    return {
      recipientName: settings.interacRecipientName.trim(),
      email: settings.interacEmail.trim(),
    };
  }
  return {};
}

export function paymentDetailsFromRecord(
  method: VendorPreferredPaymentMethod,
  details: Record<string, unknown> | null | undefined
): Record<string, string> {
  const row = details ?? {};
  if (method === "bank_transfer") {
    return {
      bankName: String(row.bankName ?? ""),
      accountName: String(row.accountName ?? ""),
      accountNumber: String(row.accountNumber ?? ""),
      institutionNumber: String(row.institutionNumber ?? ""),
      transitNumber: String(row.transitNumber ?? ""),
      swiftBic: String(row.swiftBic ?? ""),
    };
  }
  if (method === "interac_etransfer") {
    return {
      recipientName: String(row.recipientName ?? ""),
      email: String(row.email ?? ""),
    };
  }
  return {};
}
