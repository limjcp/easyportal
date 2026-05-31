import type { AdminSuggestion } from "../../../resident/data/types";

export const seedAdminSuggestions: AdminSuggestion[] = [
  {
    id: "2854278775",
    text: "I have noticed the entrance lighting in the garden entering our community is not visible at night. The light is covered by the bush growing in the garden where the address sign is located. Could the light be extended higher on a post so it would light up the entire address sign. Thank you for considering this.",
    createdAt: "2024-09-20",
    status: "Open",
    visibility: "Private (Admin & Author)",
    createdBy: "Unit 10 - Carol Zinger",
    unit: "10",
    unread: true,
    adminComments: [
      {
        id: "ac1",
        author: "Scott Hundey",
        text: "Discussing options for trimming bushes back with groundskeeper",
        createdAt: "2024-10-11 - 07:10 AM",
        visibility: "admin",
      },
    ],
    publicComments: [],
    attachments: [],
  },
  {
    id: "2854278733",
    text: "Condo fee withdrawal delay - I noticed my condo fee was withdrawn later than usual this month. Could you please look into this?",
    createdAt: "2024-09-14",
    status: "Open",
    visibility: "Private",
    createdBy: "Unit 14 - John Smith",
    unit: "14",
    unread: true,
    adminComments: [],
    publicComments: [],
    attachments: [],
  },
];
