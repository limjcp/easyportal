import { companyStore, nextCompanyId } from "../../legacy/company/companyStore";
import type { VendorNotification } from "../../resident/data/types";

export function pushVendorNotification(
  vendorId: string,
  poId: string,
  poNumber: string,
  type: VendorNotification["type"] = "po_received"
): void {
  const message =
    type === "po_received"
      ? `New purchase order ${poNumber} requires your response.`
      : `Reminder: purchase order ${poNumber} is awaiting your response.`;
  companyStore.vendorNotifications.unshift({
    id: nextCompanyId("snotif"),
    vendorId,
    type,
    message,
    poId,
    read: false,
    createdAt: new Date().toISOString(),
  });
}
