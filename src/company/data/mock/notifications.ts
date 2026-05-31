import type { CompanyNotification } from "../../../resident/data/types";

export const seedCompanyNotifications: CompanyNotification[] = [
  {
    id: "notif-1",
    type: "po_accepted",
    message: "PO-2024-001 was accepted by Kitchener Plumbing Co.",
    read: true,
    createdAt: "2024-05-11T10:30:00",
    poId: "po-1",
  },
  {
    id: "notif-2",
    type: "po_declined",
    message: "PO-2024-003 was declined by ProClean Janitorial.",
    read: false,
    createdAt: "2024-04-03T14:15:00",
    poId: "po-3",
  },
];
