import type {
  CompanyBuilding,
  PurchaseOrder,
  Vendor,
  VendorComplianceDocument,
  VendorComplianceDocumentType,
  VendorComplianceSummary,
  VendorComplianceUploadInput,
  VendorNotification,
  VendorSession,
  UpdateVendorProfileInput,
} from "../../resident/data/types";
import { mapDbError, sb } from "./base";
import { vendorComplianceRepository } from "./vendorComplianceRepository";
import { supabaseCompanyRepository } from "./companyRepository";

async function requireSession(): Promise<VendorSession & { vendorId: string }> {
  const session = await supabaseVendorRepository.getSession();
  if (!session) throw new Error("No vendor session");
  return session;
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
    const vendors = await supabaseCompanyRepository.getVendors();
    const vendor = vendors.find((v) => v.id === session.vendorId);
    if (!vendor) throw new Error("Vendor not found");
    return vendor;
  },

  async getDashboardStats() {
    const session = await requireSession();
    const orders = await supabaseCompanyRepository.getPurchaseOrdersByVendor(session.vendorId);
    return {
      pendingCount: orders.filter((po) => po.status === "sent").length,
      acceptedCount: orders.filter((po) => po.status === "accepted").length,
      declinedCount: orders.filter((po) => po.status === "declined").length,
    };
  },

  async getPurchaseOrders(tab: "action" | "history"): Promise<PurchaseOrder[]> {
    const session = await requireSession();
    const orders = await supabaseCompanyRepository.getPurchaseOrdersByVendor(session.vendorId);
    return orders.filter((po) => {
      if (po.status === "draft") return false;
      if (tab === "action") return po.status === "sent";
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
    if (!po || po.status !== "sent") return undefined;
    if (status === "declined" && declineReason) {
      await sb().from("purchase_orders").update({ decline_reason: declineReason }).eq("id", id);
    }
    return supabaseCompanyRepository.updatePurchaseOrderStatus(id, status);
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
    return (await supabaseCompanyRepository.updateVendor(session.vendorId, input)) ?? (await this.getVendor());
  },

  async completeInvitation(): Promise<Vendor> {
    const vendor = await this.getVendor();
    if (vendor.status !== "pending_invite") return vendor;
    return (await supabaseCompanyRepository.updateVendor(vendor.id, { status: "active" })) ?? vendor;
  },

  async getComplianceSummary(): Promise<VendorComplianceSummary> {
    const session = await requireSession();
    const vendor = await this.getVendor();
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
};
