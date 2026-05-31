import type { Newsletter } from "../types";

export const seedNewsletters: Newsletter[] = [
  {
    id: "1",
    title: "2025 Fall Newsletter",
    date: "10/4/2025",
    body: `Dear Residents,

Attached is your Fall Newsletter, featuring key updates and insights for your community.

Wishing you a wonderful season ahead.

Best,
MVP Condos`,
    attachmentName: "AUTUMN WOODS FALL NEWSLETTER 2025.pdf",
  },
  {
    id: "2",
    title: "2025 SPRING SUMMER NEWSLETTER",
    date: "5/12/2025",
    body: "Dear Residents, Please find attached the Spring/Summer newsletter with community updates and event information.",
    attachmentName: "SPRING_SUMMER_2025.pdf",
  },
  {
    id: "3",
    title: "2024 Winter Newsletter",
    date: "12/8/2024",
    body: "Dear Residents, The winter newsletter includes holiday hours, snow removal procedures, and board updates.",
    attachmentName: "WINTER_2024.pdf",
  },
  {
    id: "4",
    title: "2024 Fall Newsletter",
    date: "10/2/2024",
    body: "Dear Residents, Attached is the Fall 2024 community newsletter.",
    attachmentName: "FALL_2024.pdf",
  },
];
