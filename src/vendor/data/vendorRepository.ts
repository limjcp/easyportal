import { companyRepository } from "../../company/data/companyRepository";
import { companyStore, nextCompanyId } from "../../company/data/companyStore";
import type {
  CompanyBuilding,
  PurchaseOrder,
  Vendor,
  VendorNotification,
  VendorSession,
  UpdateVendorProfileInput,
} from "../../resident/data/types";

const delay = () => new Promise<void>((r) => setTimeout(r, 50));

function requireSession(): VendorSession {
  if (!companyStore.vendorSession) {
    throw new Error("No vendor session");
  }
  return companyStore.vendorSession;
}

function requireVendor(): Vendor {
  const session = requireSession();
  const vendor = companyStore.vendors.find((s) => s.id === session.vendorId);
  if (!vendor) throw new Error("Vendor not found");
  return vendor;
}

export const vendorRepository = {
  async getSession(): Promise<VendorSession> {
    await delay();
    return { ...requireSession() };
  },

  async getVendor(): Promise<Vendor> {
    await delay();
    return { ...requireVendor() };
  },

  async getDashboardStats(): Promise<{
    pendingCount: number;
    acceptedCount: number;
    declinedCount: number;
  }> {
    await delay();
    const { vendorId } = requireSession();
    const orders = companyStore.purchaseOrders.filter((po) => po.vendorId === vendorId);
    return {
      pendingCount: orders.filter((po) => po.status === "sent").length,
      acceptedCount: orders.filter((po) => po.status === "accepted").length,
      declinedCount: orders.filter((po) => po.status === "declined").length,
    };
  },

  async getPurchaseOrders(tab: "action" | "history"): Promise<PurchaseOrder[]> {
    await delay();
    const { vendorId } = requireSession();
    return companyStore.purchaseOrders.filter((po) => {
      if (po.vendorId !== vendorId || po.status === "draft") return false;
      if (tab === "action") return po.status === "sent";
      return po.status === "accepted" || po.status === "declined";
    });
  },

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    await delay();
    const { vendorId } = requireSession();
    const po = companyStore.purchaseOrders.find((p) => p.id === id);
    if (!po || po.vendorId !== vendorId) return undefined;
    return { ...po, lineItems: po.lineItems.map((li) => ({ ...li })) };
  },

  async getBuilding(id: string): Promise<CompanyBuilding | undefined> {
    await delay();
    return companyStore.buildings.find((b) => b.id === id);
  },

  async respondToPurchaseOrder(
    id: string,
    status: "accepted" | "declined",
    declineReason?: string
  ): Promise<PurchaseOrder | undefined> {
    await delay();
    const po = await this.getPurchaseOrder(id);
    if (!po || po.status !== "sent") return undefined;
    if (status === "declined" && declineReason) {
      const idx = companyStore.purchaseOrders.findIndex((p) => p.id === id);
      if (idx >= 0) {
        companyStore.purchaseOrders[idx].declineReason = declineReason;
      }
    }
    return companyRepository.updatePurchaseOrderStatus(id, status);
  },

  async getNotifications(): Promise<VendorNotification[]> {
    await delay();
    const { vendorId } = requireSession();
    return companyStore.vendorNotifications
      .filter((n) => n.vendorId === vendorId)
      .map((n) => ({ ...n }));
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay();
    const n = companyStore.vendorNotifications.find((x) => x.id === id);
    if (n) n.read = true;
  },

  async getUnreadNotificationCount(): Promise<number> {
    await delay();
    const { vendorId } = requireSession();
    return companyStore.vendorNotifications.filter((n) => n.vendorId === vendorId && !n.read)
      .length;
  },

  async updateProfile(input: UpdateVendorProfileInput): Promise<Vendor> {
    await delay();
    const vendor = requireVendor();
    return (await companyRepository.updateVendor(vendor.id, input)) ?? vendor;
  },

  async completeInvitation(): Promise<Vendor> {
    await delay();
    const vendor = requireVendor();
    if (vendor.status !== "pending_invite") return vendor;
    return (await companyRepository.updateVendor(vendor.id, { status: "active" })) ?? vendor;
  },
};
