export type PreviewMetric = {
  id: string;
  label: string;
  value: string;
  delta: string;
};

export type PreviewTableRow = {
  id: string;
  unit: string;
  owner: string;
  request: string;
  status: "Open" | "In Review" | "Resolved";
  updatedAt: string;
};

export const previewMetrics: PreviewMetric[] = [
  { id: "m1", label: "Open Requests", value: "26", delta: "+4 this week" },
  { id: "m2", label: "Pending Approvals", value: "8", delta: "2 urgent" },
  { id: "m3", label: "Unread Messages", value: "13", delta: "+1 today" },
  { id: "m4", label: "Occupancy", value: "97%", delta: "Stable month-over-month" },
];

export const previewRows: PreviewTableRow[] = [
  {
    id: "r1",
    unit: "A-102",
    owner: "Claudio Owner",
    request: "Lobby camera inspection",
    status: "Open",
    updatedAt: "May 30, 2026",
  },
  {
    id: "r2",
    unit: "B-214",
    owner: "Marie Johnson",
    request: "Parking access card replacement",
    status: "In Review",
    updatedAt: "May 29, 2026",
  },
  {
    id: "r3",
    unit: "C-310",
    owner: "Jaspreet Gill",
    request: "Noise complaint follow-up",
    status: "Resolved",
    updatedAt: "May 27, 2026",
  },
];

export const sharedTableRows = [
  { id: "s1", module: "Announcements", owner: "Admin", records: "42", status: "Healthy" },
  { id: "s2", module: "Requests", owner: "Resident", records: "26", status: "Needs review" },
  { id: "s3", module: "Approvals", owner: "Board", records: "8", status: "Backlog" },
];
