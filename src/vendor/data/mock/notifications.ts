import type { VendorNotification } from "../../../resident/data/types";

export const seedVendorNotifications: VendorNotification[] = [
  {
    id: "snotif-1",
    vendorId: "sup-2",
    type: "po_received",
    message: "New purchase order PO-2024-002 requires your response.",
    poId: "po-2",
    read: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
