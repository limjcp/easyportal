import type { PurchaseOrder } from "../../../resident/data/types";

export const seedPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po-1",
    poNumber: "PO-2024-001",
    vendorId: "sup-1",
    buildingId: "2125710101",
    status: "accepted",
    lineItems: [
      { id: "li-1", description: "Emergency pipe repair - Unit 12", quantity: 1, unitPrice: 450 },
    ],
    total: 450,
    createdBy: "Claudio Lim",
    createdAt: "2024-05-10",
    sentAt: "2024-05-10",
    respondedAt: "2024-05-11",
  },
  {
    id: "po-2",
    poNumber: "PO-2024-002",
    vendorId: "sup-2",
    buildingId: "2125710404",
    status: "sent",
    lineItems: [
      { id: "li-2", description: "Lobby lighting replacement", quantity: 8, unitPrice: 75 },
    ],
    total: 600,
    createdBy: "Claudio Lim",
    createdAt: "2024-05-18",
    sentAt: "2024-05-18",
  },
  {
    id: "po-3",
    poNumber: "PO-2024-003",
    vendorId: "sup-4",
    buildingId: "2125710202",
    status: "declined",
    lineItems: [
      { id: "li-3", description: "Monthly common area cleaning", quantity: 1, unitPrice: 1200 },
    ],
    total: 1200,
    notes: "Vendor unavailable this month",
    createdBy: "Claudio Lim",
    createdAt: "2024-04-01",
    sentAt: "2024-04-01",
    respondedAt: "2024-04-03",
  },
  {
    id: "po-4",
    poNumber: "PO-2024-004",
    vendorId: "sup-1",
    buildingId: "2125709897",
    status: "draft",
    lineItems: [
      { id: "li-4", description: "Annual backflow testing", quantity: 1, unitPrice: 350 },
    ],
    total: 350,
    createdBy: "Claudio Lim",
    createdAt: "2024-05-21",
  },
];
