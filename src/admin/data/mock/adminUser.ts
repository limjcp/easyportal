import type { AdminUser, EmailRecord, NotificationPreference } from "../../../resident/data/types";

export const seedAdminUser: AdminUser = {
  id: "D70D8BD9-DEF5-4972-B30C-61F3B218464D",
  displayName: "Claudio Owner - Board Member",
  firstName: "Claudio",
  lastName: "Owner - Board Member",
  email: "limjahnclaudio@gmail.com",
  phone: "",
  role: "Board Member",
  title: "Board Member",
  managementCompany: "MVP Condo Property Management",
  unit: "102",
  timezone: "America/Toronto",
  telHome: "",
  telMobile: "",
  telBusiness: "",
};

export const seedAdminNotificationPreferences: NotificationPreference[] = [
  { id: "board-approvals", label: "Board Approvals", enabled: true },
  { id: "suggestions", label: "Suggestion Box", enabled: true },
  { id: "news", label: "News & Notices", enabled: true },
  { id: "service", label: "Service Request Updates", enabled: true },
  { id: "incidents", label: "Incident Report Updates", enabled: false },
  { id: "documents", label: "New Documents", enabled: true },
];

export const seedAdminEmails: EmailRecord[] = [
  {
    id: "a1",
    date: "2026-05-20 11:53 AM",
    subject: "WNCC87 Board Approval — Parking Policy Amendment",
    status: "delivered",
    body: "A new board approval topic requires your vote.",
  },
  {
    id: "a2",
    date: "2026-05-10 9:22 AM",
    subject: "WNCC 87: Admin Portal Login",
    status: "delivered",
    body: "Your admin portal account is active.",
  },
];
