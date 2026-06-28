import type {
  CreateVendorInvoiceInput,
  PurchaseOrder,
  VendorInvoice,
  VendorInvoiceLineItem,
} from "../../resident/data/types";
import { validateBuildingImageFile } from "../../shared/attachmentUtils";
import { buildInvoicePaymentDetails, validateVendorPaymentSettings } from "../../shared/vendorPaymentUtils";
import { mapDbError, nowIso, sb } from "./base";
import { getVendorDocumentSignedUrl, uploadVendorDocument } from "./storage";

const DEFAULT_HST_RATE = 0.13;

function mapInvoiceLineItems(items: unknown): VendorInvoiceLineItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      description: String(row.description ?? ""),
      quantity: Number(row.quantity ?? 0),
      unitPrice: Number(row.unitPrice ?? 0),
      lineTotal: Number(row.lineTotal ?? 0),
    };
  });
}

function mapPaymentDetails(details: unknown): Record<string, string> {
  if (!details || typeof details !== "object") return {};
  const row = details as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, String(value ?? "")])
  );
}

function mapVendorInvoice(row: Record<string, unknown>): VendorInvoice {
  return {
    id: row.id as string,
    purchaseOrderId: row.purchase_order_id as string,
    vendorId: row.vendor_id as string,
    buildingId: row.building_id as string,
    invoiceNumber: row.invoice_number as string,
    hstNumber: row.hst_number as string,
    billingAddress: (row.billing_address as string) ?? "",
    billingCity: (row.billing_city as string) ?? "",
    billingProvince: (row.billing_province as string) ?? "",
    billingPostalCode: (row.billing_postal as string) ?? "",
    preferredPaymentMethod:
      (row.preferred_payment_method as VendorInvoice["preferredPaymentMethod"]) ?? "bank_transfer",
    paymentDetails: mapPaymentDetails(row.payment_details),
    logoStoragePath: (row.logo_storage_path as string) || undefined,
    subtotal: Number(row.subtotal ?? 0),
    hstRate: Number(row.hst_rate ?? DEFAULT_HST_RATE),
    hstAmount: Number(row.hst_amount ?? 0),
    total: Number(row.total ?? 0),
    lineItems: mapInvoiceLineItems(row.line_items),
    status: row.status as VendorInvoice["status"],
    submittedAt: (row.submitted_at as string) || undefined,
    sparcRecipientEmail: (row.sparc_recipient_email as string) || undefined,
    createdAt: row.created_at as string,
  };
}

function buildLineItemsFromPo(po: PurchaseOrder): VendorInvoiceLineItem[] {
  return po.lineItems.map((li) => ({
    description: li.description,
    quantity: li.quantity,
    unitPrice: li.unitPrice,
    lineTotal: li.quantity * li.unitPrice,
  }));
}

function computeInvoiceTotals(lineItems: VendorInvoiceLineItem[], hstRate = DEFAULT_HST_RATE) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
  const hstAmount = Math.round(subtotal * hstRate * 100) / 100;
  const total = Math.round((subtotal + hstAmount) * 100) / 100;
  return { subtotal, hstAmount, total };
}

function buildPaymentDetailsFromInput(input: CreateVendorInvoiceInput): Record<string, string> {
  return buildInvoicePaymentDetails({
    hstNumber: input.hstNumber,
    billingAddress: input.billingAddress,
    billingCity: input.billingCity,
    billingProvince: input.billingProvince,
    billingPostalCode: input.billingPostalCode,
    preferredPaymentMethod: input.preferredPaymentMethod,
    bankName: input.bankName,
    bankAccountName: input.bankAccountName,
    bankAccountNumber: input.bankAccountNumber,
    bankInstitutionNumber: input.bankInstitutionNumber,
    bankTransitNumber: input.bankTransitNumber,
    bankSwiftBic: input.bankSwiftBic,
    interacRecipientName: input.interacRecipientName,
    interacEmail: input.interacEmail,
  });
}

async function attachLogoUrl(invoice: VendorInvoice): Promise<VendorInvoice> {
  if (!invoice.logoStoragePath) return invoice;
  try {
    const logoUrl = await getVendorDocumentSignedUrl(invoice.logoStoragePath);
    return { ...invoice, logoUrl };
  } catch {
    return invoice;
  }
}

export const vendorInvoiceRepository = {
  async getInvoiceByPurchaseOrderId(purchaseOrderId: string): Promise<VendorInvoice | undefined> {
    const { data, error } = await sb()
      .from("vendor_invoices")
      .select("*")
      .eq("purchase_order_id", purchaseOrderId)
      .maybeSingle();
    mapDbError(error);
    if (!data) return undefined;
    return attachLogoUrl(mapVendorInvoice(data as Record<string, unknown>));
  },

  async getInvoiceById(invoiceId: string): Promise<VendorInvoice | undefined> {
    const { data, error } = await sb()
      .from("vendor_invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle();
    mapDbError(error);
    if (!data) return undefined;
    return attachLogoUrl(mapVendorInvoice(data as Record<string, unknown>));
  },

  async createInvoiceFromPurchaseOrder(
    po: PurchaseOrder,
    vendorId: string,
    companyId: string,
    input: CreateVendorInvoiceInput
  ): Promise<VendorInvoice> {
    const validationError = validateVendorPaymentSettings(input);
    if (validationError) throw new Error(validationError);

    const existing = await this.getInvoiceByPurchaseOrderId(po.id);
    if (existing) {
      throw new Error("An invoice already exists for this purchase order.");
    }

    let logoStoragePath: string | undefined = input.logoStoragePath;
    if (input.logoFile) {
      const logoError = validateBuildingImageFile(input.logoFile);
      if (logoError) throw new Error(logoError);
      logoStoragePath = await uploadVendorDocument(vendorId, input.logoFile);
    }

    const lineItems = buildLineItemsFromPo(po);
    const { subtotal, hstAmount, total } = computeInvoiceTotals(lineItems);
    const invoiceNumber = `INV-${po.poNumber}`;
    const paymentDetails = buildPaymentDetailsFromInput(input);

    const { data, error } = await sb()
      .from("vendor_invoices")
      .insert({
        purchase_order_id: po.id,
        vendor_id: vendorId,
        building_id: po.buildingId,
        company_id: companyId,
        invoice_number: invoiceNumber,
        hst_number: input.hstNumber.trim(),
        billing_address: input.billingAddress.trim(),
        billing_city: input.billingCity.trim(),
        billing_province: input.billingProvince.trim(),
        billing_postal: input.billingPostalCode.trim(),
        preferred_payment_method: input.preferredPaymentMethod,
        payment_details: paymentDetails,
        logo_storage_path: logoStoragePath ?? null,
        subtotal,
        hst_rate: DEFAULT_HST_RATE,
        hst_amount: hstAmount,
        total,
        line_items: lineItems,
        status: "draft",
      })
      .select("*")
      .single();
    mapDbError(error);
    return attachLogoUrl(mapVendorInvoice(data as Record<string, unknown>));
  },

  async markInvoiceSubmitted(
    invoiceId: string,
    sparcRecipientEmail: string
  ): Promise<VendorInvoice> {
    const { data, error } = await sb()
      .from("vendor_invoices")
      .update({
        status: "submitted",
        submitted_at: nowIso(),
        sparc_recipient_email: sparcRecipientEmail,
        updated_at: nowIso(),
      })
      .eq("id", invoiceId)
      .eq("status", "draft")
      .select("*")
      .maybeSingle();
    mapDbError(error);
    if (!data) throw new Error("Invoice not found or already submitted.");
    return attachLogoUrl(mapVendorInvoice(data as Record<string, unknown>));
  },
};
