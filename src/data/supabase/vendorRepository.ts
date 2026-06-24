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
import { mapDbError, nowIso, sb } from "./base";
import { supabaseCompanyRepository } from "./companyRepository";
import { vendorComplianceRepository } from "./vendorComplianceRepository";
import { mapVendorBuildingRow, mapVendorRow } from "./vendorMappers";

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

    const payload: Record<string, unknown> = {
      status,
      responded_at: nowIso(),
    };
    if (status === "declined" && declineReason) {
      payload.decline_reason = declineReason;
    }

    const { error } = await sb().from("purchase_orders").update(payload).eq("id", id);
    mapDbError(error);
    return this.getPurchaseOrder(id);
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
};
