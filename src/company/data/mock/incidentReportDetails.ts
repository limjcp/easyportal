import type { IncidentReportDetail, MasterReportRow } from "../../../resident/data/types";

const IR_1359251: IncidentReportDetail = {
  id: "ir-1359251",
  incidentNumber: "1359251",
  buildingLabel: "(SCC 148) 500 Essa Road",
  buildingAddress: "SCC148 (SCC 148) 500 Essa Road Barrie, Ontario L4N 7L4",
  incidentDate: "2026-05-18",
  incidentTime: "10:11 AM",
  reportHeaderTime: "2026-05-18 - 10:11 AM",
  unit: "SSCC 148 - Unit 53",
  location: "SSCC 148 - Unit: 53",
  status: "Resolved",
  severity: "High",
  reportType: "Water Leaks/Flooding",
  description: `Water is coming through the ceiling. 
I called Simran right away. 
She said her laundry room is flooded from the air conditioner pipe being disconnected.`,
  createdBy: "Unit 53 - Renae Hayes",
  resident: "Unit 53 - Renae Hayes",
  assignedTo: "All Admins",
  viewPermission: "The selected resident",
  submittedAt: "2026-05-18 - 10:11 AM",
  pendingReplyLabel: "No",
  resolutionTime: "14 Hour(s)",
  resolvedBy: "Scott Hundey",
  resolvedAt: "2026-05-19",
  resolvedAtDisplay: "2026-05-19 at 12:05 AM",
  attachments: [
    {
      id: "att-1",
      fileName: "image.jpg",
      uploadedBy: "Unit 53 - Renae Hayes",
      uploadedDate: "2026-05-18",
      previewUrl: "https://picsum.photos/seed/inc1359251a/200/150",
      kind: "image",
    },
    {
      id: "att-2",
      fileName: "IMG_1031.jpeg",
      uploadedBy: "Unit 53 - Renae Hayes",
      uploadedDate: "2026-05-18",
      previewUrl: "https://picsum.photos/seed/inc1359251b/200/150",
      kind: "image",
    },
    {
      id: "att-3",
      fileName: "IMG_1032.jpeg",
      uploadedBy: "Unit 53 - Renae Hayes",
      uploadedDate: "2026-05-18",
      previewUrl: "https://picsum.photos/seed/inc1359251c/200/150",
      kind: "image",
    },
  ],
  adminComments: [],
  publicComments: [
    {
      dateTime: "2026-05-19 - 12:04 AM",
      author: "Scott Hundey",
      message:
        "Spoke to Scott\nOwners will resolve ABS let us know if any common elements are affected",
      visibility: "public",
    },
    {
      dateTime: "2026-05-19 - 12:05 AM",
      author: "Scott Hundey",
      message:
        "Spoke to Scott\nOwners will resolve ABS let us know if any common elements are affected",
      visibility: "public",
    },
  ],
  archived: false,
  unread: true,
};

export const seedIncidentReportDetails: Record<string, IncidentReportDetail> = {
  "ir-1359251": IR_1359251,
};

export function incidentReportDetailFromRow(row: MasterReportRow): IncidentReportDetail {
  const seeded = seedIncidentReportDetails[row.id];
  if (seeded) return seeded;

  return {
    id: row.id,
    incidentNumber: row.incidentNumber ?? row.id,
    buildingLabel: row.buildingLabel,
    incidentDate: row.date,
    unit: row.unit ?? "",
    location: row.location ?? row.title,
    status: row.status,
    severity: row.severity ?? "Medium",
    reportType: "Other",
    description: row.title,
    createdBy: row.owner ?? row.unit ?? "Resident",
    resident: row.owner ?? row.unit ?? "Resident",
    assignedTo: "All Admins",
    viewPermission: "The selected resident",
    pendingReplyLabel: row.pendingReplyLabel ?? "No",
    resolutionTime: row.resolutionTime,
    attachments: [],
    adminComments: [],
    publicComments: [],
    archived: row.archived,
    unread: row.unread,
  };
}
