import type { BoardApprovalDetail, MasterReportRow } from "../../../resident/data/types";

const BA_134_DETAIL: BoardApprovalDetail = {
  id: "ba-134-fin",
  title: "WNCC 134 - FINANCIALS - APRIL 2026",
  buildingLabel: "(WNCC 134) 54 Green Valley Drive",
  status: "Approved",
  closedBy: "Closed by Unit 19 - Laura &  Matthew Holland On 2026-05-23 at 08:04 PM",
  createdBy: "Darren East",
  dateCreated: "2026-05-23",
  description: `Directors
Financials for month ending April 2026 for your review and approval.
Also included is a Treasurers report highlighting information from the financial statements.
Nothing unusual to report at this time.   No concerns over meeting future expenses.
Thank you.`,
  approvedCount: 3,
  disapprovedCount: 0,
  votesCollected: 3,
  votesRequired: 3,
  votes: [
    { kind: "approved", boardMember: "Unit 13 - Marshall Greensides", voteDate: "2026-05-23" },
    { kind: "approved", boardMember: "Unit 19 - Laura &  Matthew Holland", voteDate: "2026-05-23" },
    { kind: "approved", boardMember: "Unit 47 - Mustafa Yegul", voteDate: "2026-05-23" },
  ],
  attachments: [
    { id: "a1", label: "Attachment #1", fileName: "2026.04 - WNCC 134 - FINANCIALS.pdf" },
    { id: "a2", label: "Attachment #2", fileName: "2026.04 - WNCC 134 - TREASURERS REPORT.pdf" },
  ],
  comments: [
    {
      dateTime: "2026-05-23 - 08:04 PM",
      author: "Unit 19 - Laura &  Matthew Holland",
      message:
        "Treasurers report at the bottom notes March as month in recommendations at bottom. I assume this is a typo. Otherwise no issues.",
    },
    {
      dateTime: "2026-05-23 - 08:08 PM",
      author: "Darren East",
      message:
        "yep - typo.\nthat's what i get for doing it on a saturday afternoon in the comfy chair.\nthanks matt.",
    },
  ],
  archived: false,
  unread: true,
};

export const seedBoardApprovalDetails: Record<string, BoardApprovalDetail> = {
  "ba-134-fin": BA_134_DETAIL,
};

export function boardApprovalDetailFromRow(row: MasterReportRow): BoardApprovalDetail {
  const seeded = seedBoardApprovalDetails[row.id];
  if (seeded) return seeded;

  const collected = row.votesCollected ?? 0;
  const required = row.votesRequired ?? 0;
  const approved = row.approvedCount ?? 0;
  const disapproved = row.disapprovedCount ?? 0;

  return {
    id: row.id,
    title: row.title,
    buildingLabel: row.buildingLabel,
    status: row.status,
    createdBy: "Management",
    dateCreated: row.date,
    description: row.title,
    approvedCount: approved,
    disapprovedCount: disapproved,
    votesCollected: collected,
    votesRequired: required,
    votes: [],
    attachments: [],
    comments: [],
    archived: row.archived,
    unread: row.unread,
  };
}
