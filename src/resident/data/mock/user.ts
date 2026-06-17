import type { EmailRecord, NotificationPreference, ResidentUser } from "../types";

export const seedUser: ResidentUser = {
  id: "1",
  name: "Claudio",
  buildingId: "2125709897",
  buildingName: "Westmount North Condos",
  buildingAddress: "123 Main St Toronto ON M5V 1A1",
  unit: "102",
  email: "claudio.owner@example.com",
  phone: "(519) 555-0102",
  role: "Owner - Board Member",
  birthMonth: 5,
  birthDay: 31,
};

export const seedNotificationPreferences: NotificationPreference[] = [
  { id: "news", label: "News & Notices", enabled: true },
  { id: "events", label: "Events & RSVPs", enabled: true },
  { id: "service", label: "Service Request Updates", enabled: true },
  { id: "incidents", label: "Incident Report Updates", enabled: false },
  { id: "documents", label: "New Documents", enabled: true },
];

export const seedEmails: EmailRecord[] = [
  {
    id: "1",
    date: "2023-05-18 11:53 AM",
    subject: "WNCC67 Account Activation - Claude - Unit 102",
    status: "delivered",
    body: "Your account has been activated. You may now log in to the resident portal.",
  },
  {
    id: "2",
    date: "2023-05-10 9:22 AM",
    subject: "WNCC 87: AGM Portal Access Invitation",
    status: "delivered",
    body: "You have been invited to access the AGM voting portal.",
  },
  {
    id: "3",
    date: "2023-04-28 3:15 PM",
    subject: "Spring Maintenance Schedule",
    status: "delivered",
    body: "Property management will begin spring maintenance on common areas.",
  },
];
