import type { Poll } from "../../../resident/data/types";

export const seedPolls: Poll[] = [
  {
    id: "1",
    title: "Resident Satisfaction Poll 2025",
    status: "active",
    createdAt: "2025-01-15",
    publishedAt: "2025-02-01",
    expiresAt: "2025-06-30",
    responseCount: 12,
    noNotifications: false,
    privacy: "not-anonymous",
    residentTypes: ["Board Members", "Owners", "Tenants", "Occupants"],
    showToFilter: "No filter",
    questions: [
      {
        id: "q1",
        sortOrder: 1,
        question: "How satisfied are you with building maintenance?",
        type: "Rating",
        answerOptions: "1-5",
      },
    ],
  },
  {
    id: "2",
    title: "Parking Policy Feedback",
    status: "draft",
    createdAt: "2025-03-01",
    expiresAt: "2025-05-01",
    responseCount: 0,
    noNotifications: true,
    privacy: "not-anonymous",
    residentTypes: [
      "Board Members",
      "Absentee Owner",
      "Owners",
      "Tenants",
      "Occupants",
      "Unit Managers",
    ],
    showToFilter: "No filter",
    questions: [],
  },
];
