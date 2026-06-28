import type {
  CompanyBuilding,
  CreateVendorInvoiceInput,
  PurchaseOrder,
  PurchaseOrderNegotiation,
  SubmitPoProposalInput,
  UpdateVendorPaymentSettingsInput,
  Vendor,
  VendorComplianceDocument,
  VendorComplianceDocumentType,
  VendorComplianceSummary,
  VendorComplianceUploadInput,
  VendorInvoice,
  VendorNotification,
  VendorPaymentSettings,
  VendorSession,
  UpdateVendorProfileInput,
} from "../../resident/data/types";
import { mapDbError, nowIso, sb } from "./base";
import { supabaseCompanyRepository } from "./companyRepository";
import { purchaseOrderNegotiationRepository } from "./purchaseOrderNegotiationRepository";
import { vendorComplianceRepository } from "./vendorComplianceRepository";
import { vendorInvoiceRepository } from "./vendorInvoiceRepository";
import { vendorPaymentSettingsRepository } from "./vendorPaymentSettingsRepository";
import { mapVendorBuildingRow, mapVendorRow } from "./vendorMappers";
import { invokeSendPortalEmail } from "./sendPortalEmail";

async function requireSession(): Promise<VendorSession & { vendorId: string }> {
  const session = await supabaseVendorRepository.getSession();
  if (!session) throw new Error("No vendor session");
  return session;
}

async function fetchVendorById(vendorId: string): Promise<Vendor> {
  const { data, error } = await sb()
    .from("vendors")
    .select("*, vendor_buildings(building_id)")
    .eq("id", vendorId)
    .maybeSingle();
  mapDbError(error);
  if (!data) throw new Error("Vendor not found");
  return mapVendorRow(data as Record<string, unknown>);
}

export const supabaseVendorRepository = {
  async getSession(): Promise<VendorSession | null> {
    const {
      data: { user },
    } = await sb().auth.getUser();
    if (!user) return null;
    const { data: link, error } = await sb()
      .from("vendor_users")
      .select("vendor_id, vendors(*)")
      .eq("profile_id", user.id)
      .maybeSingle();
    mapDbError(error);
    if (!link?.vendors) return null;
    const vendor = link.vendors as Record<string, unknown>;
    return {
      vendorId: vendor.id as string,
      displayName: vendor.contact_name as string,
      companyName: vendor.company_name as string,
      email: vendor.email as string,
      tradeCategory: vendor.trade_category as string,
    };
  },

  async getVendor(): Promise<Vendor> {
    const session = await requireSession();
    return fetchVendorById(session.vendorId);
  },

  async getBuildings(): Promise<CompanyBuilding[]> {
    const session = await requireSession();
    const vendor = await fetchVendorById(session.vendorId);
    let ids = vendor.buildingIds ?? [];
    if (ids.length === 0) {
      const orders = await supabaseCompanyRepository.getPurchaseOrdersByVendor(session.vendorId);
      ids = [...new Set(orders.map((order) => order.buildingId))];
    }
    if (ids.length === 0) return [];

    const { data, error } = await sb()
      .from("buildings")
      .select("id, code, name, address, status, subscription_package")
      .in("id", ids);
    mapDbError(error);
    return (data ?? []).map((row) => mapVendorBuildingRow(row as Record<string, unknown>));
  },

  async getDashboardStats() {
    const session = await requireSession();
    const orders = await supabaseCompanyRepository.getPurchaseOrdersByVendor(session.vendorId);
    return {
      pendingCount: orders.filter((po) => ["sent", "quoted", "negotiating"].includes(po.status)).length,
      acceptedCount: orders.filter((po) => po.status === "accepted").length,
      declinedCount: orders.filter((po) => po.status === "declined").length,
    };
  },

  async getPurchaseOrders(tab: "action" | "history"): Promise<PurchaseOrder[]> {
    const session = await requireSession();
    const orders = await supabaseCompanyRepository.getPurchaseOrdersByVendor(session.vendorId);
    return orders.filter((po) => {
      if (po.status === "draft") return false;
      if (tab === "action") return ["sent", "quoted", "negotiating"].includes(po.status);
      return po.status === "accepted" || po.status === "declined";
    });
  },

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    const session = await requireSession();
    const po = await supabaseCompanyRepository.getPurchaseOrder(id);
    if (!po || po.vendorId !== session.vendorId) return undefined;
    return po;
  },

  async getBuilding(id: string): Promise<CompanyBuilding | undefined> {
    return supabaseCompanyRepository.getBuilding(id);
  },

  async respondToPurchaseOrder(
    id: string,
    status: "accepted" | "declined",
    declineReason?: string
  ): Promise<PurchaseOrder | undefined> {
    const po = await this.getPurchaseOrder(id);
    if (!po) return undefined;

    if (status === "accepted") {
      if (po.status !== "sent" || po.isQuoteRequest) return undefined;
    } else if (po.isQuoteRequest) {
      if (!["sent", "quoted", "negotiating"].includes(po.status)) return undefined;
    } else if (po.status !== "sent") {
      return undefined;
    }

    const payload: Record<string, unknown> = {
      status,
      responded_at: nowIso(),
      awaiting_response_from: null,
    };
    if (status === "declined" && declineReason) {
      payload.decline_reason = declineReason;
    }

    const { error } = await sb().from("purchase_orders").update(payload).eq("id", id);
    mapDbError(error);
    return this.getPurchaseOrder(id);
  },

  async getPurchaseOrderNegotiations(purchaseOrderId: string): Promise<PurchaseOrderNegotiation[]> {
    const po = await this.getPurchaseOrder(purchaseOrderId);
    if (!po) return [];
    return purchaseOrderNegotiationRepository.getNegotiations(purchaseOrderId);
  },

  async submitVendorQuote(
    purchaseOrderId: string,
    input: SubmitPoProposalInput
  ): Promise<PurchaseOrder | undefined> {
    const session = await requireSession();
    const po = await this.getPurchaseOrder(purchaseOrderId);
    if (!po) return undefined;
    await purchaseOrderNegotiationRepository.submitVendorQuote(po, session.displayName, input);
    return this.getPurchaseOrder(purchaseOrderId);
  },

  async submitVendorCounterOffer(
    purchaseOrderId: string,
    input: SubmitPoProposalInput
  ): Promise<PurchaseOrder | undefined> {
    const session = await requireSession();
    const po = await this.getPurchaseOrder(purchaseOrderId);
    if (!po) return undefined;
    await purchaseOrderNegotiationRepository.submitVendorCounterOffer(po, session.displayName, input);
    return this.getPurchaseOrder(purchaseOrderId);
  },

  async acceptCompanyOffer(purchaseOrderId: string): Promise<PurchaseOrder | undefined> {
    const session = await requireSession();
    const po = await this.getPurchaseOrder(purchaseOrderId);
    if (!po) return undefined;
    await purchaseOrderNegotiationRepository.acceptOffer(po, "vendor", session.displayName);
    return this.getPurchaseOrder(purchaseOrderId);
  },

  async getNotifications(): Promise<VendorNotification[]> {
    const session = await requireSession();
    const { data, error } = await sb()
      .from("vendor_notifications")
      .select("*")
      .eq("vendor_id", session.vendorId)
      .order("created_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((n) => ({
      id: n.id as string,
      vendorId: n.vendor_id as string,
      type: n.notification_type as VendorNotification["type"],
      message: n.message as string,
      poId: (n.po_id as string) || undefined,
      read: n.read as boolean,
      createdAt: n.created_at as string,
    }));
  },

  async markNotificationRead(id: string): Promise<void> {
    await sb().from("vendor_notifications").update({ read: true }).eq("id", id);
  },

  async getUnreadNotificationCount(): Promise<number> {
    const notes = await this.getNotifications();
    return notes.filter((n) => !n.read).length;
  },

  async updateProfile(input: UpdateVendorProfileInput): Promise<Vendor> {
    const session = await requireSession();
    const { error } = await sb()
      .from("vendors")
      .update({
        contact_name: input.contactName,
        phone: input.phone,
        notes: input.notes,
      })
      .eq("id", session.vendorId);
    mapDbError(error);
    return fetchVendorById(session.vendorId);
  },

  async completeInvitation(): Promise<Vendor> {
    const session = await requireSession();
    const vendor = await fetchVendorById(session.vendorId);
    if (vendor.status !== "pending_invite") return vendor;
    const { error } = await sb()
      .from("vendors")
      .update({ status: "active" })
      .eq("id", session.vendorId);
    mapDbError(error);
    return fetchVendorById(session.vendorId);
  },

  async getComplianceSummary(): Promise<VendorComplianceSummary> {
    const session = await requireSession();
    const vendor = await fetchVendorById(session.vendorId);
    return vendorComplianceRepository.getComplianceSummary(
      session.vendorId,
      vendor.wsibRequired ?? true
    );
  },

  async getComplianceDocuments(): Promise<VendorComplianceDocument[]> {
    const session = await requireSession();
    return vendorComplianceRepository.getComplianceDocuments(session.vendorId);
  },

  async uploadComplianceDocument(
    documentType: VendorComplianceDocumentType,
    file: File | null,
    input: VendorComplianceUploadInput
  ): Promise<VendorComplianceDocument> {
    const session = await requireSession();
    return vendorComplianceRepository.uploadComplianceDocument(
      session.vendorId,
      documentType,
      file,
      input
    );
  },

  async getComplianceDocumentUrl(documentId: string): Promise<string> {
    return vendorComplianceRepository.getDocumentDownloadUrl(documentId);
  },

  async getPaymentSettings(): Promise<VendorPaymentSettings> {
    const session = await requireSession();
    return vendorPaymentSettingsRepository.getPaymentSettings(session.vendorId);
  },

  async updatePaymentSettings(
    input: UpdateVendorPaymentSettingsInput,
    logoFile?: File | null
  ): Promise<VendorPaymentSettings> {
    const session = await requireSession();
    return vendorPaymentSettingsRepository.updatePaymentSettings(session.vendorId, {
      ...input,
      logoFile,
    });
  },

  async getInvoiceByPurchaseOrderId(purchaseOrderId: string): Promise<VendorInvoice | undefined> {
    const po = await this.getPurchaseOrder(purchaseOrderId);
    if (!po) return undefined;
    return vendorInvoiceRepository.getInvoiceByPurchaseOrderId(purchaseOrderId);
  },

  async createInvoiceFromPurchaseOrder(
    purchaseOrderId: string,
    input: CreateVendorInvoiceInput
  ): Promise<VendorInvoice> {
    const session = await requireSession();
    const po = await this.getPurchaseOrder(purchaseOrderId);
    if (!po) throw new Error("Purchase order not found.");
    if (po.status !== "accepted") {
      throw new Error("Only accepted purchase orders can be converted to invoices.");
    }

    const { data: vendorRow, error: vendorError } = await sb()
      .from("vendors")
      .select("company_id")
      .eq("id", session.vendorId)
      .single();
    mapDbError(vendorError);
    if (!vendorRow?.company_id) throw new Error("Vendor company not found.");

    return vendorInvoiceRepository.createInvoiceFromPurchaseOrder(
      po,
      session.vendorId,
      vendorRow.company_id as string,
      input
    );
  },

  async submitInvoiceForPayment(invoiceId: string): Promise<VendorInvoice> {
    const session = await requireSession();
    const { data: invoiceRow, error } = await sb()
      .from("vendor_invoices")
      .select("id, vendor_id, status")
      .eq("id", invoiceId)
      .eq("vendor_id", session.vendorId)
      .maybeSingle();
    mapDbError(error);
    if (!invoiceRow) throw new Error("Invoice not found.");
    if (invoiceRow.status !== "draft") {
      throw new Error("This invoice has already been submitted.");
    }

    await invokeSendPortalEmail({ type: "vendor_invoice_submit", invoiceId });

    const updated = await vendorInvoiceRepository.getInvoiceById(invoiceId);
    if (!updated) throw new Error("Invoice not found after submission.");
    return updated;
  },
};
