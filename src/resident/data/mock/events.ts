import type { CalendarEvent, RsvpItem } from "../types";

export const seedEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Board Meeting",
    date: "2026-05-15",
    description: "Monthly board meeting",
  },
  {
    id: "2",
    title: "Spring BBQ",
    date: "2026-05-24",
    description: "Community spring barbecue in the courtyard",
  },
  {
    id: "3",
    title: "AGM",
    date: "2026-04-27",
    description: "Annual General Meeting",
  },
];

export const seedRsvps: RsvpItem[] = [
  {
    id: "1",
    eventTitle: "Spring BBQ",
    date: "5/24/2026",
    status: "Confirmed",
  },
];
