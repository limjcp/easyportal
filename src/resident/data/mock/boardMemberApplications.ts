import type { BoardMemberApplication } from "../types";

export const seedBoardMemberApplications: BoardMemberApplication[] = [
  {
    id: "app-1",
    residentName: "Sarah Chen",
    unit: "205",
    email: "sarah.chen@example.com",
    phone: "(519) 555-0205",
    statement:
      "I have served on a non-profit board for three years and would like to contribute to our building's long-term planning.",
    submittedAt: "2026-05-10 2:30 PM",
    status: "Under Review",
    unread: false,
  },
  {
    id: "app-2",
    residentName: "Michael Torres",
    unit: "311",
    email: "m.torres@example.com",
    phone: "(519) 555-0311",
    statement:
      "As a CPA I can help with budget oversight and reserve fund planning. I am available for monthly meetings.",
    submittedAt: "2026-05-18 9:15 AM",
    status: "Submitted",
    unread: true,
  },
];
