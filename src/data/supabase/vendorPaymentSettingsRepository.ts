import type { VendorPaymentSettings } from "../../resident/data/types";
import { validateBuildingImageFile } from "../../shared/attachmentUtils";
import { validateVendorPaymentSettings } from "../../shared/vendorPaymentUtils";
import { mapDbError, sb } from "./base";
import { getVendorDocumentSignedUrl, uploadVendorDocument } from "./storage";

function mapPaymentSettingsRow(row: Record<string, unknown>): VendorPaymentSettings {
  return {
    hstNumber: (row.invoice_hst_number as string) ?? "",
    billingAddress: (row.invoice_billing_address as string) ?? "",
    billingCity: (row.invoice_billing_city as string) ?? "",
    billingProvince: (row.invoice_billing_province as string) ?? "",
    billingPostalCode: (row.invoice_billing_postal as string) ?? "",
    preferredPaymentMethod:
      (row.invoice_preferred_payment_method as VendorPaymentSettings["preferredPaymentMethod"]) ??
      "bank_transfer",
    bankName: (row.invoice_bank_name as string) ?? "",
    bankAccountName: (row.invoice_bank_account_name as string) ?? "",
    bankAccountNumber: (row.invoice_bank_account_number as string) ?? "",
    bankInstitutionNumber: (row.invoice_bank_institution_number as string) ?? "",
    bankTransitNumber: (row.invoice_bank_transit_number as string) ?? "",
    bankSwiftBic: (row.invoice_bank_swift_bic as string) ?? "",
    interacRecipientName: (row.invoice_interac_recipient_name as string) ?? "",
    interacEmail: (row.invoice_interac_email as string) ?? "",
    logoStoragePath: (row.invoice_logo_storage_path as string) || undefined,
  };
}

async function attachLogoUrl(settings: VendorPaymentSettings): Promise<VendorPaymentSettings> {
  if (!settings.logoStoragePath) return settings;
  try {
    const logoUrl = await getVendorDocumentSignedUrl(settings.logoStoragePath);
    return { ...settings, logoUrl };
  } catch {
    return settings;
  }
}

export const vendorPaymentSettingsRepository = {
  async getPaymentSettings(vendorId: string): Promise<VendorPaymentSettings> {
    const { data, error } = await sb()
      .from("vendors")
      .select(
        "invoice_hst_number, invoice_billing_address, invoice_billing_city, invoice_billing_province, invoice_billing_postal, invoice_logo_storage_path, invoice_preferred_payment_method, invoice_bank_name, invoice_bank_account_name, invoice_bank_account_number, invoice_bank_institution_number, invoice_bank_transit_number, invoice_bank_swift_bic, invoice_interac_recipient_name, invoice_interac_email"
      )
      .eq("id", vendorId)
      .single();
    mapDbError(error);
    return attachLogoUrl(mapPaymentSettingsRow(data as Record<string, unknown>));
  },

  async updatePaymentSettings(
    vendorId: string,
    input: {
      hstNumber: string;
      billingAddress: string;
      billingCity: string;
      billingProvince: string;
      billingPostalCode: string;
      preferredPaymentMethod: VendorPaymentSettings["preferredPaymentMethod"];
      bankName: string;
      bankAccountName: string;
      bankAccountNumber: string;
      bankInstitutionNumber: string;
      bankTransitNumber: string;
      bankSwiftBic: string;
      interacRecipientName: string;
      interacEmail: string;
      removeLogo?: boolean;
      logoFile?: File | null;
    }
  ): Promise<VendorPaymentSettings> {
    const validationError = validateVendorPaymentSettings(input);
    if (validationError) throw new Error(validationError);

    const payload: Record<string, unknown> = {
      invoice_hst_number: input.hstNumber.trim(),
      invoice_billing_address: input.billingAddress.trim(),
      invoice_billing_city: input.billingCity.trim(),
      invoice_billing_province: input.billingProvince.trim(),
      invoice_billing_postal: input.billingPostalCode.trim(),
      invoice_preferred_payment_method: input.preferredPaymentMethod,
      invoice_bank_name: input.bankName.trim(),
      invoice_bank_account_name: input.bankAccountName.trim(),
      invoice_bank_account_number: input.bankAccountNumber.trim(),
      invoice_bank_institution_number: input.bankInstitutionNumber.trim(),
      invoice_bank_transit_number: input.bankTransitNumber.trim(),
      invoice_bank_swift_bic: input.bankSwiftBic.trim(),
      invoice_interac_recipient_name: input.interacRecipientName.trim(),
      invoice_interac_email: input.interacEmail.trim(),
    };

    if (input.removeLogo) {
      payload.invoice_logo_storage_path = null;
    } else if (input.logoFile) {
      const logoError = validateBuildingImageFile(input.logoFile);
      if (logoError) throw new Error(logoError);
      payload.invoice_logo_storage_path = await uploadVendorDocument(vendorId, input.logoFile);
    }

    const { error } = await sb().from("vendors").update(payload).eq("id", vendorId);
    mapDbError(error);
    return this.getPaymentSettings(vendorId);
  },
};
